import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { join } from "node:path";

const wss = new WebSocketServer({ port: 8080 });
const db = new Database(join("..", "db.sql"));
db.prepare(
  `
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  username VARCHAR(255) NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
).run();
db.prepare(
  `
CREATE TABLE IF NOT EXISTS messages(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  message VARCHAR(255) NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);`
).run();

const connections = new Map();

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const event = JSON.parse(data);
    switch (event.type) {
      case "register":
        const registerUser = db
          .prepare("SELECT username FROM users WHERE username = ?")
          .get(event.username);
        if (registerUser) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Cette utilisateur existe déjà!",
            })
          );
          return;
        }
        const registerStmt = db
          .prepare("INSERT INTO users (username) VALUES (?)")
          .run(event.username);
        if (!registerStmt.changes) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Echec de l'inscritpion, veuillez réessayer.",
            })
          );
          return;
        }
        ws.client = { username: event.username, id: randomUUID() };
        connections.set(ws.client.id, ws);
        ws.send(
          JSON.stringify({
            type: "login",
            client: ws.client,
          })
        );
        break;
      case "login":
        const loggedUser = db
          .prepare("SELECT username FROM users WHERE username = ?")
          .get(event.username);
        if (!loggedUser) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Cette utilisateur n'existe pas!",
            })
          );
          return;
        }
        ws.client = { username: event.username, id: randomUUID() };
        connections.set(ws.client.id, ws);
        ws.send(
          JSON.stringify({
            type: "login",
            client: ws.client,
          })
        );
        break;
      case "chat":
        const { client, message } = event;
        if (!connections.has(client.id)) {
          ws.send(
            JSON.stringify({
              type: "logout",
              message: "Vous n'ête pas connecter!",
            })
          );
          return;
        }
        const createAt = Date.now();
        console.log(event.client.username);
        const chatClient = db
          .prepare("SELECT id, username FROM users WHERE username = ?")
          .get(client.username);
        console.log(chatClient);
        db.prepare("INSERT INTO messages (message, user_id) VALUES (?, ?)").run(
          message,
          chatClient.id
        );
        wss.clients.forEach((c) => {
          c.send(
            JSON.stringify({
              type: "chat",
              client,
              createAt,
              message,
            })
          );
        });
        break;
      case "messages":
        if (!connections.has(event.client?.id)) {
          ws.send(
            JSON.stringify({
              type: "logout",
              message: "Vous n'ête pas connecter!",
            })
          );
          return;
        }
        const messages = db
          .prepare(
            "SELECT * FROM messages INNER JOIN users ON users.id = messages.user_id"
          )
          .all();
        ws.send(JSON.stringify({ type: "messages", messages }));
        break;
      default:
        break;
    }
  });
});

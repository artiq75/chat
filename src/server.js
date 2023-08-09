import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { join } from "node:path";

const wss = new WebSocketServer({ port: 8080 });
const db = new Database(join("..", "db.sql"));
const stmt = db.prepare(`CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  username VARCHAR(255) NOT NULL,
  createdAt INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
);`);
stmt.run();

const connections = new Map();
const messages = [];

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const event = JSON.parse(data);
    switch (event.type) {
      case "login":
        const { username } = event;
        ws.client = { username, id: randomUUID() };
        connections.set(ws.client.id, ws);
        db.prepare("SELECT username FROM users").get();
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
              type: "error",
              message: "Vous n'ête pas connecter!",
            })
          );
        }
        const createAt = Date.now();
        messages.push({ client, message, createAt });
        console.log(insert);
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
              type: "error",
              message: "Vous n'ête pas connecter!",
            })
          );
        }
        ws.send(JSON.stringify({ type: "messages", messages }));
        break;
      default:
        break;
    }
  });
});

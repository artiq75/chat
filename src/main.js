import DOMChat from "./classes/DOMChat";
import Client from "./classes/Client";
import URLStorage from "./classes/URLStorage";

const ws = new WebSocket("ws://localhost:8080");

const loginForm = document.getElementById("login");
const messageForm = document.getElementById("message");
const chatSection = document.getElementById("chat");
const messageItems = chatSection.querySelector("ul");

const client = new Client(new URLStorage());
const chat = new DOMChat(messageItems);

if (client.id) {
  loginForm.setAttribute("aria-hidden", true);
  messageForm.removeAttribute("aria-hidden");
  chatSection.removeAttribute("aria-hidden");
}

ws.addEventListener("message", ({ data }) => {
  const event = JSON.parse(data);
  switch (event.type) {
    case "login":
      client.login(event.client);
      break;
    case "chat":
      chat.add(event);
      break;
    case "messages":
      if (event.messages.length) {
        chat.refresh(event.messages);
      }
      break;
    case "error":
      if (client.logout()) {
        window.alert(event.message);
      }
      break;
    default:
      break;
  }
});

ws.addEventListener("open", (e) => {
  if (ws.readyState !== ws.OPEN) {
    console.error("Erreur: la connexion websocket n'est pas ouverte!");
    return;
  }

  ws.send(JSON.stringify({ type: "messages", client: client.client }));

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = loginForm.elements["username"].value;
    if (username) {
      ws.send(
        JSON.stringify({
          type: "login",
          username,
        })
      );
    }
    loginForm.reset();
  });

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageForm.elements["message"].value;
    if (message) {
      ws.send(
        JSON.stringify({
          type: "chat",
          client: client.client,
          message,
        })
      );
    }
    messageForm.reset();
  });
});

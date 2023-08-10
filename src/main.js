import DOMChat from "./classes/DOMChat";
import Client from "./classes/Client";
import URLStorage from "./classes/URLStorage";

const ws = new WebSocket("ws://localhost:8080");

const authForm = document.getElementById("authForm");
const messageForm = document.getElementById("messageForm");
const chatSection = document.getElementById("chat");
const messageItems = chatSection.querySelector("ul");

const client = new Client(new URLStorage());
const chat = new DOMChat(messageItems);

if (client.id) {
  authForm.setAttribute("aria-hidden", true);
  messageForm.removeAttribute("aria-hidden");
  chatSection.removeAttribute("aria-hidden");
}

ws.addEventListener("message", ({ data }) => {
  const event = JSON.parse(data);
  switch (event.type) {
    case "login":
      client.login(event.client);
      break;
    case "logout":
      client.logout();
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
      window.alert(`Erreur: ${event.message}`);
      break;
    default:
      break;
  }
});

ws.addEventListener("open", (e) => {
  if (ws.readyState !== ws.OPEN) {
    window.alert("Erreur: la connexion websocket n'est pas ouverte!");
    return;
  }

  ws.send(JSON.stringify({ type: "messages", client: client.client }));

  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = authForm.elements["username"].value;
    if (!username) return;
    const action = e.submitter.dataset.action;
    if (action !== "login" && action !== "register") {
      window.alert("Dommage, bien tenté!");
      return;
    }
    ws.send(
      JSON.stringify({
        type: action,
        username,
      })
    );
    authForm.reset();
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

export default class DOMChat {
  constructor(chat) {
    this.chat = chat;
  }

  getMessageElement(username, message, createAt) {
    console.log(createAt);
    const li = document.createElement("li");
    const usernameElement = li.appendChild(document.createElement("h3"));
    usernameElement.classList.add("username");
    usernameElement.innerHTML = `<strong>${username} <time datetime="${createAt.toLocaleString()}">${createAt.toLocaleString(
      "fr-FR",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    )}</time></strong>`;
    const messageElement = li.appendChild(document.createElement("p"));
    messageElement.classList.add("message");
    messageElement.innerText = message;
    return li;
  }

  add(event) {
    this.chat.appendChild(
      this.getMessageElement(
        event.client.username,
        event.message,
        new Date(event.createAt)
      )
    );
  }

  refresh(messages) {
    const fragment = document.createDocumentFragment();
    for (const message of messages) {
      fragment.appendChild(
        this.getMessageElement(
          message.client.username,
          message.message,
          new Date(message.createAt)
        )
      );
    }
    this.chat.replaceChildren(fragment);
  }
}

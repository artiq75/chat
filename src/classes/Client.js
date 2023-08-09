export default class Client {
  constructor(storage) {
    this.storage = storage;
    if (this.storage.has("client")) {
      this.client = JSON.parse(this.storage.get("client") || {});
    }
  }

  login(client) {
    this.storage.set("client", JSON.stringify(client));
  }

  logout() {
    return this.storage.delete("client");
  }

  get id() {
    return this.client?.id;
  }

  get username() {
    return this.client?.username;
  }
}

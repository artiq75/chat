export default class URLStorage {
  constructor() {
    this.params = new URLSearchParams(window.location.search);
  }

  set(key, value) {
    this.params.set(key, value);
    window.location.search = this.params.toString();
  }

  get(key) {
    return this.params.get(key);
  }

  has(key) {
    return this.params.has(key);
  }

  delete(key) {
    if (this.params.has(key)) {
      this.params.delete(key);
      window.location.search = this.params.toString();
      return true;
    }
    return false;
  }
}

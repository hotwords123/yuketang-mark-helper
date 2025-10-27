const ON_REQUEST = Symbol("ON_REQUEST");
const ON_RESPONSE = Symbol("ON_RESPONSE");
const RESPONSE_TEXT = Symbol("RESPONSE_TEXT");

/** @typedef {(body: any) => any} OnRequestCallback */
/** @typedef {(response: string) => string | void} OnResponseCallback */

/**
 * A custom XMLHttpRequest class that allows interception and modification of requests.
 */
export class MyXMLHttpRequest extends XMLHttpRequest {
  static original = XMLHttpRequest;
  static handlers = [];

  /**
   * Add a global handler for all requests.
   * @param {(xhr: MyXMLHttpRequest, method: string, url: URL) => void} handler The handler function
   * @return {void}
   */
  static addHandler(handler) {
    this.handlers.push(handler);
  }

  constructor() {
    super();
    /** @type {OnRequestCallback?} */
    this[ON_REQUEST] = null;
    /** @type {OnResponseCallback?} */
    this[ON_RESPONSE] = null;
    /** @type {string?} */
    this[RESPONSE_TEXT] = null;
  }

  /**
   * Open the request and invoke any registered handlers.
   * @param {string} method The HTTP method
   * @param {string | URL} url The request URL
   * @param  {...any} args Additional arguments
   * @return {void}
   */
  open(method, url, ...args) {
    const parsed = new URL(url, location.href);
    for (const handler of this.constructor.handlers) {
      handler(this, method, parsed);
    }
    return super.open(method, url, ...args);
  }

  /**
   * Set the request and response interceptors.
   * @param {OnRequestCallback?} onRequest A callback to modify the request body
   * @param {OnResponseCallback?} onResponse A callback to modify the response text
   * @return {void}
   */
  intercept(onRequest, onResponse) {
    this[ON_REQUEST] = onRequest;
    this[ON_RESPONSE] = onResponse;
  }

  /**
   * Send the request, possibly modified by the onRequest callback.
   * @param {any} body The request body
   * @return {void}
   */
  send(body) {
    const onRequest = this[ON_REQUEST];
    if (typeof onRequest === "function") {
      const result = onRequest(body);
      if (typeof result !== "undefined") {
        body = result;
      }
    }
    return super.send(body);
  }

  /**
   * Get the response text, possibly modified by the onResponse callback.
   * @return {string} The response text
   */
  get responseText() {
    if (this.readyState !== XMLHttpRequest.DONE) {
      return super.responseText;
    }

    if (this[RESPONSE_TEXT] === null) {
      this[RESPONSE_TEXT] = super.responseText;

      const onResponse = this[ON_RESPONSE];
      if (typeof onResponse === "function") {
        const result = onResponse(super.responseText);
        if (typeof result !== "undefined") {
          this[RESPONSE_TEXT] = result;
        }
      }
    }

    return this[RESPONSE_TEXT];
  }
}

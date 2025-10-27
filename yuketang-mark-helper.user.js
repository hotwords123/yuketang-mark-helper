// ==UserScript==
// @name         雨课堂作业批改助手
// @namespace    npm/vite-plugin-monkey
// @version      0.1.0
// @author       hotwords123
// @description  雨课堂作业批改助手
// @match        https://pro.yuketang.cn/subject*
// ==/UserScript==

(function () {
  'use strict';

  const ON_REQUEST = Symbol("ON_REQUEST");
  const ON_RESPONSE = Symbol("ON_RESPONSE");
  const RESPONSE_TEXT = Symbol("RESPONSE_TEXT");
  class MyXMLHttpRequest extends XMLHttpRequest {
    static original = XMLHttpRequest;
    static handlers = [];
static addHandler(handler) {
      this.handlers.push(handler);
    }
    constructor() {
      super();
      this[ON_REQUEST] = null;
      this[ON_RESPONSE] = null;
      this[RESPONSE_TEXT] = null;
    }
open(method, url, ...args) {
      const parsed = new URL(url, location.href);
      for (const handler of this.constructor.handlers) {
        handler(this, method, parsed);
      }
      return super.open(method, url, ...args);
    }
intercept(onRequest, onResponse) {
      this[ON_REQUEST] = onRequest;
      this[ON_RESPONSE] = onResponse;
    }
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
  window.XMLHttpRequest = MyXMLHttpRequest;
  const KNOWN_IMAGE_TYPES = ["jpg", "jpeg", "png", "bmp", "webp", "tiff"];
  MyXMLHttpRequest.addHandler((xhr, method, url) => {
    if (url.pathname == "/v/quiz/new_get_subj_problem_result_detail/") {
      xhr.intercept(null, (responseText) => {
        try {
          const resp = JSON.parse(responseText);
          if (!resp.success) return;
          const {
            pics,
            attachments: { filelist }
          } = resp.data.answer_content;
          if (!Array.isArray(filelist) || filelist.length === 0) return;
          let found = false;
          for (const file of filelist) {
            if (KNOWN_IMAGE_TYPES.includes(file.fileType.toLowerCase())) {
              pics.push({
                pic: file.fileUrl,
                thumb: file.fileUrl
              });
              found = true;
            }
          }
          if (found) {
            return JSON.stringify(resp);
          }
        } catch (err) {
          console.error("Error in response interceptor:", err);
        }
      });
    }
  });

})();
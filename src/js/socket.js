import autoBind from "auto-bind";
import sockjs from "sockjs-client";
import webstomp from "webstomp-client";
import utils from "@/js/utils";
import { SOCKET_URL, DEBUG, SOCKET_TRAFFIC_DEBUG } from "@/js/consts";


export class SocketResponse {
  /**
   * @param id {number}
   * @param type {string}
   * @param body {Object}
   */
  constructor(id, type, body) {
    this.id = id;
    this.type = type;
    this.body = body;
  }
}

class Socket {
  /**
   *
   * @param frameHandler {function} socketFrameHandler from flows.js
   * @param closeCb {function} called when socket is closed with CloseEvent {
      code: {number}
        1000 - normal
        1002 - protocol error
        1006 - abnormal closure (lost connection)
        more @ https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      reason: {string}
      type: {string}
      wasClean: {boolean}
    }
   */
  constructor(frameHandler, closeCb) {
    this.stompClient = null;
    this.nextResponseId = 1;
    this.responsePromises = [];
    this.nextSubId = 1;
    this.subscriptions = {};

    this.connected = false;
    this.frameHandler = frameHandler;
    this.closeCb = closeCb;

    this.debug = DEBUG;
    autoBind(this);
  }

  _debug(text, ...extra) {
    if (this.debug) {
      // const caller = new Error().stack.split('\n')[2].replace(/(\s.+at [^.]+.| \(.+)/g, "");
      const caller = new Error().stack.split("\n")[2].replace(/ \(.+/g, "").replace(/\s.+at [^.]*\./g, "");
      this._logDebug(text, caller);
      if (extra) console.log(...extra);
    }
  }

  _logDebug(text, caller) {
    text = text.toString();
    const time = utils.debugDateTime();
    const error = !text.indexOf("! ");
    if (error) text = text.substring(2);
    console.log(`${time} %c${this.constructor.name} (${caller}): %c${text}`, "color: #cb7300; font-weight: bold", `color: ${error ? "#f00" : "inherit"}`);
  }

  /**
   * @returns {Promise<Object>} resolves on connection or if already connected with {alreadyOpen: true}
   */
  open() {
    const _debug = (text) => {
      if (this.debug) this._logDebug(text, "open");
    };

    if (this.connected) {
      _debug("Socket already open");
      return Promise.resolve({ alreadyOpen: true });
    }
    return new Promise((resolve, reject) => {
      _debug("Creating socket");
      // eslint-disable-next-line new-cap
      this.stompClient = webstomp.over(new sockjs(SOCKET_URL), { debug: SOCKET_TRAFFIC_DEBUG });
      _debug("Connecting...");
      this.stompClient.connect({}, (frame) => {
        if (frame.command === "CONNECTED") {
          this.connected = true;
          _debug("Connection successful, resolving");
          resolve({ frame });
        } else {
          _debug("! Connection failed, rejecting");
          reject({ error: true, frame });
        }
      }, (CloseEvent) => {
        _debug("Connection closed");
        this.closeCleanup(CloseEvent);
      });
    });
  }

  /**
   * @param CloseEvent {Object} socket close event that is passed to closeCb
   * @returns {Promise<Object>} resolves when socket closing and cleanup is finished or with {alreadyClosed: true}
   */
  close(CloseEvent) {
    const _debug = (text) => {
      if (this.debug) this._logDebug(text, "close");
    };

    if (this.connected && this.stompClient?.connected) {
      return new Promise((resolve) => {
        this.stompClient.disconnect(() => {
          _debug("stompclient disconnected");
          this.closeCleanup(CloseEvent);
          _debug("stompclient disconnect cleanup done");
          resolve();
        });
      });
    }
    return Promise.resolve({ alreadyClosed: true });
  }

  closeCleanup(CloseEvent) {
    this._debug("Starting cleanup");
    this.connected = false;

    this.unsubscribeAll();

    this.responsePromises.forEach((responsePromise) => {
      responsePromise.error("Socket closed");
    });
    this.responsePromises.splice(0, this.responsePromises.length);
    this.nextResponseId = 1;
    this.nextSubId = 1;
    this._debug("Done, calling closeCb with close event");
    this.closeCb(CloseEvent);
  }

  /**
   * Subscribes to destination
   *
   * @param destination {string}
   * @param [response] {boolean}
   * @returns {Promise<Object>} If response=true response frame body or {alreadyExists: true}
   */
  subscribe(destination, response) {
    if (!this.connected) {
      this._debug("! Socket not connected", destination);
      return Promise.reject(new Error("Socket not connected"));
    }
    if (this.subscriptions[destination]) {
      if (response) return Promise.resolve({ alreadyExists: true });
      return Promise.resolve();
    }
    if (response) {
      return new Promise((resolve, reject) => {
        this.responsePromises[this.nextResponseId] = {
          success: resolve,
          error: reject,
        };
        this.subscriptions[destination] = this.stompClient.subscribe(
          destination,
          this._frameHandler.bind(this), {
            response: this.nextResponseId++,
            id: this.nextSubId++,
          },
        );
      });
    }
    this.subscriptions[destination] = this.stompClient.subscribe(
      destination,
      this._frameHandler.bind(this), {
        id: this.nextSubId++,
      },
    );
    return Promise.resolve();
  }

  unsubscribe(destination) {
    const sub = this.subscriptions[destination];
    if (sub) {
      sub.unsubscribe();
      delete this.subscriptions[destination];
    }
  }

  unsubscribeAll() {
    Object.keys(this.subscriptions).forEach((sub) => {
      this.unsubscribe(sub);
    });
  }

  /**
   * Sends a message through socket
   *
   * @param destination {string}
   * @param data {Object}
   * @param [response] {boolean}
   * @returns {Promise<SocketResponse>} If response=true resolves to SocketResponse
   */
  message(destination, data, response) {
    if (!this.connected) {
      this._debug("! Socket not connected");
      return Promise.reject(new Error("Socket not connected"));
    }
    if (response) {
      return new Promise((resolve, reject) => {
        this.responsePromises[this.nextResponseId] = {
          success: resolve,
          error: reject,
        };
        this.stompClient.send(destination, JSON.stringify(data), {
          response: this.nextResponseId++,
        });
      });
    }
    this.stompClient.send(destination, JSON.stringify(data));
    return Promise.resolve();
  }

  /**
   * Internal frame handler before calling provided frameHandler
   * Resolves or rejects response promises with SocketResponse
   *
   * @param frame {Object} socket frame object
   * @private
   */
  _frameHandler(frame) {
    if (frame.headers["response-id"]) {
      const response = new SocketResponse(
        parseInt(frame.headers["response-id"], 10),
        frame.headers.cl,
        JSON.parse(frame.body),
      );

      if (this.responsePromises[response.id]) {
        if (response.type === "Error") {
          this.responsePromises[response.id].error(response);
        } else {
          this.responsePromises[response.id].success(response);
        }
        delete this.responsePromises[response.id];
      }
    }

    if (this.frameHandler) {
      this.frameHandler(frame);
    }
  }
}


export default Socket;

// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import LoginData from "@/js/model/LoginData";
import localstorage from "@/js/flows/localstorage";
import Socket, { OpenResult, SocketResult, SubResult } from "@/js/socket";


class Connection {
  flows: Flows2;
  store: STORE;
  events: Vue;
  socket: Socket;
  tryToReconnect: boolean = false;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    this.events.$on("documentVisible", () => {
      if (this.tryToReconnect) this.reconnect();
    });

    autoBind(this);
  }

  public message(destination: string, data: Object): void {
    if (!this.canMessage) throw new Error("Can not message, socket closed");
    this.socket.message(destination, data);
  }

  public messageWithResponse(destination: string, data: Object): Promise<SocketResult> {
    if (!this.canMessage) return Promise.reject(new Error("Can not message, socket closed"));
    // @ts-ignore
    return this.socket.message(destination, data, true);
  }

  public async findByUser(topic: GlobalUserTopic) {
    if (!this.canMessageAuth) return Promise.reject(new Error("Not connected / signed in"));
    // @ts-ignore
    const currentUserId = this.store.currentUser.id;
    return await this.messageWithResponse(`/app/${topic}.findByUser`, {id: currentUserId});
  }

  public async findByChat(topic: ChatTopic, id: number, filter?: any) {
    return await this.messageWithResponse(`/app/${topic}.findByTopic`, filter ? {id, filter} : {id});
  }

  public subscribe(destination: string): void {
    this.socket.subscribe(destination);
  }

  public subscribeWithResponse(destination: string): Promise<SubResult> {
    // @ts-ignore
    return this.socket.subscribe(destination, true);
  }

  public subscribeUserTopic(topic: GlobalUserTopic): Promise<SubResult[]> {
    if (!this.canMessageAuth) return Promise.reject(new Error("Not connected / signed in"));
    // @ts-ignore
    const currentUserId = this.store.currentUser.id;
    const promises = ["modified", "deleted"].map(type => this.subscribeWithResponse(`/topic/User.${currentUserId}.${topic}.${type}`));
    return Promise.all(promises);
  }

  public subscribeChatTopic(topic: ChatTopic, id: number): Promise<SubResult[]> {
    const promises = ["modified", "deleted"].map(type => this.subscribeWithResponse(`/topic/Topic.${id}.${topic}.${type}`));
    return Promise.all(promises);
  }

  public subscribeUserQueueChatTopic(topic: ChatTopic, id: number) {
    const promises = ["modified", "deleted"].map(type => this.subscribeWithResponse(`/user/queue/Topic.${id}.${topic}.${type}`));
    return Promise.all(promises);
  }

  get canMessage(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  get canMessageAuth(): boolean {
    return !!(this.canMessage && this.store.currentUser);
  }

  async login(loginData: LoginData): Promise<boolean> {
    const result = await (async () => {
      const openResult = await this.openSocket();

      if (openResult.error) return false;
      loginData.clientType = "WEB";
      loginData.clientInfo = "RFlows";

      try {
        await this.messageWithResponse("/app/Login.logout", {});
        await this.messageWithResponse("/app/Login.login", loginData);
        return true;
      } catch (error) {
        console.error("loginError");
        console.error(error);
        if (error.body.description !== "You are already logged in. Please logoff or disconnect first (refreshing the page helps)!") {
          this.logout();
        }
      }
      return false;
    })();

    if (result === true) this.events.$emit("loginDone");
    return result;

  }

  logout(): void {
    try {
      if (this.canMessage) {
        this.messageWithResponse("/app/Login.logout", {});
        this.socket.unsubscribeAll();
      }
    } catch (error) {
      console.error("logout error");
      console.error(error);
    } finally {
      localstorage.clearSession();
      this.store.currentUser = null;
      this.store.currentChatId = null;
      this.tryToReconnect = false;
      Object.keys(this.store.flows).forEach(key => {
        if (key === "_messages") return;
        if (key === "messages") {
          // @ts-ignore
          this.store.flows.messages.keys.forEach(chatId => {
            this.store.flows.messages[chatId].d = [];
            this.store.flows.messages[chatId].v += 1;
          });
          return;
        }
        // @ts-ignore
        this.store.flows[key].d = [];
        // @ts-ignore
        this.store.flows[key].v += 1;
      });
    }

    this.events.$emit("logout");
  }

  public reconnect(): void {
    if (!this.canMessageAuth) {
      const token = this.flows.localstorage.getSessionToken();
      if (!token) {
        throw new Error("No token in localstorage");
      }
      this.login({token});
    }
  }

  private async openSocket(): Promise<OpenResult> {
    this.store.connection.connecting = true;
    if (!this.socket) {
      this.socket = new Socket(this.socketFrameHandler, this.socketClose);
    }
    try {
      const result: OpenResult = await this.socket.open();
      if (result.error) {
        console.error("Error opening socket");
        console.error(result.error);
        this.connectionFailure({errorMsg: "Error opening socket"});
        return result;
      }
      this.connectionSuccess();
      this.subscribe("/user/queue/response");
      this.subscribe("/topic/common");
      this.tryToReconnect = true;
      return result;

    } catch (errorData) {
      return errorData;
    }
  }

  private socketClose(closeEvent: any): void {
    this.connectionFailure(closeEvent ? closeEvent : {errorMsg: "Socket closed"});
  }

  private connectionFailure(closeEvent: any) {
    console.log("Close", closeEvent);
    this.store.connection.error = true;
    this.store.connection.connecting = false;
    this.store.loginLoading = false;

    if (closeEvent.errorMsg) {
      this.store.connection.errorMsg = closeEvent.errorMsg;
      return;
    }

    if ([1000, 1002, 1006].indexOf(closeEvent.code) > -1) {
      this.store.connection.errorMsg = "??? todo";
      //this.startReconnectTimer();
    }
    if (closeEvent.reason && closeEvent.reason.length) {
      this.store.connection.errorMsg = closeEvent.reason;
    } else if (closeEvent.code && closeEvent.code === 1006) {
      this.store.connection.errorMsg = "Connection lost";
    }
  }

  private connectionSuccess() {
    this.store.connection.error = false;
    this.store.connection.connecting = false;
    this.store.connection.errorMsg = "";
  }

  private socketFrameHandler(frame: any): void {
    //const STARTTIME = window.performance.now();

    const frameType = frame.headers.cl;
    const type = frameType.replace("[]", "");
    const frameBody = JSON.parse(frame.body);
    const frameDestination = frame.headers.destination.split(".");

    let action = frame.headers.destination.match(/\.(modified|deleted)$/);
    if (action && action.length > 1) action = action[1];
    const filteredBody = Connection.bodyFilter(frameBody, action !== "deleted");

    //console.log(type, action, filteredBody);
    //console.log(frame);

    this.store.connection.error = false;
    switch (type) {
      case "LoginResponse": {
        localstorage.setSessionToken(frameBody.token);
        localstorage.setSessionUser(frameBody.user);
        if (frameBody.user) this.store.currentUser = frameBody.user;
        break;
      }
      case "Topic": {
        if (filteredBody.length) this.flows.chats.parseChats(filteredBody, action);
        break;
      }
      case "TopicUser": {
        if (filteredBody.length) this.flows.chats.parseChatUsers(filteredBody, action);
        break;
      }
      case "Organization": {
        if (filteredBody.length) this.flows.chats.parseWorkspaces(filteredBody, action);
        break;
      }
      case "TopicLocation": {
        if (filteredBody.length) this.flows.chats.parseChatWorkspaces(filteredBody, action);
        break;
      }
      case "TopicItem": {
        if (filteredBody.length) this.flows.messages.parseChatMessages(filteredBody, action);
        break;
      }
      case "TopicItemRead": {
        if (filteredBody.length) this.flows.messages.parseChatMessagesRead(filteredBody, action);
        break;
      }
      case "TopicItemUserProperty": {
        if (filteredBody.length) this.flows.messages.parseChatMessagesFlagged(filteredBody, action);
        break;
      }
      case "TopicProperty": {
        if (filteredBody.length) this.flows.chats.parseChatProperties(filteredBody, action);
        break;
      }
      case "UserAccess": {
        if (filteredBody.length) this.flows.chats.parseChatWorkspaceAccesses(filteredBody, action);
        break;
      }
      case "User": {
        if (filteredBody.length) this.flows.users.parseUsers(filteredBody, action);
        break;
      }
      case "UserProperty": {
        if (filteredBody.length) this.flows.settings.parseSettings(filteredBody, action);
        break;
      }
      case "Error": {
        if (frameBody.description) {
          this.events.$emit("notify", frameBody.description)
        } else if (frameBody.shortName) {
          this.events.$emit("notify", frameBody.shortName);
        }
        break;
      }
      case "SubscribeResponse": {
        break;
      }
      default: {
        console.warn("Unknown frame type " + type);
        console.log(frame, frameBody);
      }
    }
    /* if (this.store.debugMode) {
      const timespan = window.performance.now() - STARTTIME;
      if (timespan < 6) {
        console.log(`${Math.round(timespan * 10) / 10}ms ${type}${action ? "." + action : ''}[${filteredBody.length}]`);
      } else if (timespan < 15) {
        console.warn(`${Math.round(timespan * 10) / 10}ms ${type}${action ? "." + action : ''}[${filteredBody.length}]`);
      } else {
        console.error(`${Math.round(timespan * 10) / 10}ms ${type}${action ? "." + action : ''}[${filteredBody.length}]`);
      }
    } */
  }

  private static makeArrayIfNotArray(x: any): any[] {
    if (x.length === undefined) {
      x = [x];
    }
    return x;
  }

  private static removeDeleted(x: any[]): any[] {
    return x.filter(a => !a.deleted);
  }

  private static bodyFilter(x: any, removeDeleted: boolean): any[] {
    if (removeDeleted) {
      return Connection.removeDeleted(Connection.makeArrayIfNotArray(x));
    }
    return Connection.makeArrayIfNotArray(x)
  }
}

type GlobalUserTopic = ("TopicUser" | "UserProperty" | "Topic" | "Organization" | "TopicLocation" | "User" | "OrganizationContact" | "UserAccess" | "TopicProperty");
type ChatTopic = ("TopicItem" | "TopicUser" | "TopicItemUserProperty" | "TopicItemRead");
export type FrameAction = ("modified" | "deleted" | null);

export default Connection;

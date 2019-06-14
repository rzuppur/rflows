// @ts-ignore
import autoBind from "auto-bind";
import Vue from "vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import utils, { performanceLog } from "@/js/flows/utils";
import Message, { mapMessage } from "@/js/model/Message";
import { mapMessagesRead } from "@/js/model/MessagesRead";
import { mapMessageFlagged } from "@/js/model/MessagesFlagged";
import { SocketResult } from "@/js/socket";

class Messages {
  flows: Flows2;
  store: STORE;
  events: Vue;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    this.setupMessageGetter();
    autoBind(this);
  }

  private setupMessageGetter() {
    this.store.flows._messages = JSON.parse(JSON.stringify(this.store.flows.messages || {}));
    const _messages = this.store.flows._messages;

    this.store.flows.messages = new Proxy({}, {
      get(target, prop:string) {
        if (prop === "keys") {
          return Object.keys(_messages);
        }
        if (!Object.keys(_messages).includes(prop)) {
          Vue.set(_messages, prop, { v: 0 });
          _messages[prop].d = [];
        }
        return _messages[prop];
      },
      ownKeys() {
        return Object.keys(_messages);
      },
    });
  }

  async getChatReadAndFlagged(chatId: number): Promise<SocketResult[]> {
    const subResponses = await Promise.all([
      this.flows.connection.subscribeChatTopic("TopicItemUserProperty", chatId),
      this.flows.connection.subscribeChatTopic("TopicItemRead", chatId),
    ]);

    const promises = [];
    if (!subResponses[0][0].alreadyExists || !subResponses[0][1].alreadyExists) promises.push(this.flows.connection.findByChat("TopicItemUserProperty", chatId));
    if (!subResponses[1][0].alreadyExists || !subResponses[1][1].alreadyExists) promises.push(this.flows.connection.findByChat("TopicItemRead", chatId));

    return await Promise.all(promises);
  }

  async getChatMessages(chatId: number, filter: chatFilter | null): Promise<Message[]> {
    this.flows.connection.subscribeChatTopic("TopicItem", chatId);

    return (await this.flows.connection.findByChat("TopicItem", chatId, filter)).body.map(mapMessage).sort((a: Message, b:Message) => a.id - b.id);
  }

  @performanceLog()
  parseChatMessages(messages: any[]) {
    const mapped = messages.map(mapMessage);

    const chatId: number = mapped.map(chat => chat.chatId).reduce((a, b) => (a === b) ? a : NaN );
    if (!chatId) throw new Error("Different or no chatIds in messages");

    const ids = mapped.map(message => message.id);
    this.store.flows.messages[chatId].d = this.store.flows.messages[chatId].d.filter(message => ids.indexOf(message.id) === -1);
    this.store.flows.messages[chatId].d = this.store.flows.messages[chatId].d.concat(mapped);
    this.store.flows.messages[chatId].d.sort((a, b) => a.id - b.id);
    this.store.flows.messages[chatId].v += 1;

    this.updateMessagesRead(chatId);
    this.updateMessagesFlagged(chatId);
  }

  @performanceLog()
  parseChatMessagesRead(messagesRead: any[]) {
    if (!this.store.currentUser) throw new Error("No currentUser in store");
    const currentUserId = this.store.currentUser.id;
    const mapped = messagesRead.map(mapMessagesRead).filter(x => x.userId === currentUserId);
    this.flows.updateStoreArray("messagesRead", mapped);

    const chatId: number = mapped.map(x => x.chatId).reduce((a, b) => (a === b) ? a : NaN );
    if (chatId) {
      this.updateMessagesRead(chatId);
      return;
    }
    this.updateMessagesRead();
  }

  @performanceLog()
  parseChatMessagesFlagged(messagesFlagged: any[]) {
    if (!this.store.currentUser) throw new Error("No currentUser in store");
    const currentUserId = this.store.currentUser.id;
    this.flows.updateStoreArray("messagesFlagged", messagesFlagged.filter(flagged => flagged.flag).map(mapMessageFlagged).filter(x => x.userId === currentUserId));

    this.updateMessagesFlagged();
  }

  @performanceLog()
  private _updateMessagesReadChat(chatId: number): void {
    if (!this.store.flows.messages[chatId].d.length) return;
    if (!this.store.flows.messagesRead.d.find(readRange => readRange.chatId === chatId)) return;

    this.store.flows.messages[chatId].d.map((message) => {
      const inReadRange = this.store.flows.messagesRead.d.find(readRange => readRange.chatId === chatId && readRange.messageFrom <= message.id && readRange.messageTo >= message.id);
      message.unread = !inReadRange;
    });
    this.store.flows.messages[chatId].v += 1;
  }

  @performanceLog()
  updateMessagesRead(chatId?: number): void {
    if (chatId) {
      this._updateMessagesReadChat(chatId);
    } else {
      // @ts-ignore
      this.store.flows.messages.keys.map((chatId) => {
        this._updateMessagesReadChat(+chatId);
      })
    }
  }

  @performanceLog()
  updateMessagesFlagged(chatId?: number): void {

  }

  public chatTextParse(text: string) {
    if (!text) return "";
    const { currentUser } = this.store;
    const firstName = currentUser ? currentUser.firstName : "";
    const lastName = currentUser ? currentUser.lastName : "";
    const emojis: { [index: string]: string } = {
      ":)": "🙂",
      ";)": "😉",
      ":d": "😁",
      ":\\": "😕",
      ":/": "😕",
      ":(": "😟",
      "(y)": "👍",
      "(n)": "👎",
    };
    const splitText = text.match(/\S+|\s/g) || [];

    /* copied with modifications from compiled Contriber Flows source */
    const parsedText = [];
    const addText = (text_: string) => parsedText.push(utils.textToHTML(text_));
    for (let i = 0; i < splitText.length; i++) {
      const part = splitText[i];
      if (part === firstName || part === lastName || part[0] === "@" && ( part.substr(1) === firstName || part.substr(1) === lastName )) {
        parsedText.push("<span class=\"message-at\">");
        addText(part);
        parsedText.push("</span>");
      } else if (part.match(/^(ftp:\/\/|http:\/\/|https:\/\/|mailto:)(.*)/)) {
        parsedText.push("<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"");
        addText(part.replace(/"/g, "&quot;"));
        parsedText.push("\">");
        addText(part);
        parsedText.push("</a>");
      } else if (part.match(/^(www.)(.*)/)) {
        parsedText.push("<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://");
        addText(part.replace(/"/g, "&quot;"));
        parsedText.push("\">");
        addText(part);
        parsedText.push("</a>");
      } else if (emojis[part.toLowerCase()]) {
        parsedText.push(emojis[part.toLowerCase()]);
      } else {
        addText(part);
      }
    }
    return parsedText.join("");
  }

  public getMessageTextRepresentation = (messageText: string): string => messageText
  .replace(/<img .*?alt=[\"']?([^\"']*)[\"']?.*?\/?>/g, "$1")
  .replace(/<a .*?href=["']?([^"']*)["']?.*?>(.*)<\/a>/g, "$2")
  .replace(/<(\/p|\/div|\/h\d|br)\w?\/?>/g, "\n")
  .replace(/<[A-Za-z/][^<>]*>/g, "")
  .replace(/&quot/g, "\"");

  public noteTextParse = (text: string): string => text
  .replace(/src=['"]\/files\/*([^'"]+)['"]/g, "src=\"https://flows.contriber.com/files/$1\"")
  .replace(/<a[^<]+href=['"]*([^'"]+)['"][^>]*>/g, "<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"$1\">")
  .replace(/<p><\/p>/g, "<br>");

  public fileMessagePreviewable = (message: Message): boolean => {
    if (!message.url) return false;
    if (message.originalFileName === "mime") return true;
    let ext: any = message.url.split(".");
    ext = ext[ext.length - 1];
    return ["png", "jpg", "gif", "jpeg", "svg"].indexOf(ext.toLowerCase()) >= 0;
  };
}

export default Messages;

type chatFilter = { amount: number, from?: { id: number }, sticky: boolean };

// @ts-ignore
import autoBind from "auto-bind";
import Vue from "vue";

import STORE from "@/js/store";
import utils from "@/js/flows/utils";
import Connection from "@/js/flows/connection";
import Chat from "@/js/model/Chat";
import ChatUser from "@/js/model/ChatUser";
import Workspace from "@/js/model/Workspace";
import ChatWorkspace from "@/js/model/ChatWorkspace";
import WorkspaceAccess from "@/js/model/WorkspaceAccess";
import Message from "@/js/model/Message";
import { SocketResult } from "@/js/socket";
import MessagesRead from "@/js/model/MessagesRead";

class Chats {
  store: STORE;
  events: Vue;
  connection: Connection;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;

    this.setupMessageGettersSetters();
    autoBind(this);
  }

  private setupMessageGettersSetters() {
    this.store.flows._messages = JSON.parse(JSON.stringify(this.store.flows.messages || {}));
    const _messages = this.store.flows._messages;

    this.store.flows.messages = new Proxy({}, {
      // @ts-ignore
      set(obj, prop: number, val: { v: number, d: Message[] }) {
        console.log("SET", prop, ":", val);
      },
      get(target, prop:string) {
        if (prop === "keys") {
          return Object.keys(_messages);
        }
        if (!Object.keys(_messages).includes(prop)) {
          console.log("creating", prop);
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

  async getChats(): Promise<void> {
    this.connection.subscribeUserTopic("Topic");
    this.connection.subscribeUserTopic("TopicUser");
    this.connection.subscribeUserTopic("Organization");
    this.connection.subscribeUserTopic("TopicLocation");
    await Promise.all([
      this.connection.findByUser("Topic"),
      this.connection.findByUser("TopicUser"),
      this.connection.findByUser("Organization"),
      this.connection.findByUser("TopicLocation"),
    ]);
  }

  async getChatUsers(chatId: number): Promise<void> {
    // this.connection.subscribeChatTopic("TopicUser", chatId);

    await Promise.all([
      this.connection.findByChat("TopicUser", chatId),
    ]);
  }

  async getChatReadAndFlagged(chatId: number): Promise<SocketResult[]> {
    this.connection.subscribeChatTopic("TopicItemUserProperty", chatId);
    this.connection.subscribeChatTopic("TopicItemRead", chatId);

    return await Promise.all([
      this.connection.findByChat("TopicItemUserProperty", chatId),
      this.connection.findByChat("TopicItemRead", chatId),
    ]);
  }

  async getChatMessages(chatId: number, filter: chatFilter | null): Promise<SocketResult> {
    this.connection.subscribeChatTopic("TopicItem", chatId);

    return (await this.connection.findByChat("TopicItem", chatId, filter)).body.map(Chats.mapMessages);
  }

  setChatOpen(chatId: number, open: boolean): void {
    this.connection.message("/app/Topic.setMyStatus", { topicId: chatId, status: open ? "OPEN" : "NONE" });
  }

  get favChatIds(): number[] {
    // todo: cache

    const favs = this.store.flows.userProperties.d.find(userProperty => userProperty.name === "favorites");
    if (favs && favs.value.length) {
      return favs.value
      .filter((fav: propChat) => fav.type === "MEETING" && fav.id)
      .map((fav: propChat) => fav.id);
    }
    return [];
  }

  get recentChatIds(): number[] {
    // todo: cache

    const recents = this.store.flows.userProperties.d.find(userProperty => userProperty.name === "recentTools");
    if (recents && recents.value.length) {
      return recents.value
      .filter((recent: propChat) => recent.type === "MEETING" && recent.id)
      .map((recent: propChat) => recent.id);
    }
    return [];
  }

  get userWorkspaceIds(): number[] {
    const currentUserId = this.store.currentUser && this.store.currentUser.id;
    if (!currentUserId) {
      return [];
    }

    return this.store.flows.workspaceAccesses.d
    .filter(workspaceAccess => workspaceAccess.userId === currentUserId)
    .map(workspaceAccess => workspaceAccess.workspaceId);
  }

  set favChatIds(chatIds: number[]) {
    chatIds = utils.uniqueNonZeroNumberArray(chatIds);
    const prop = this.store.flows.userProperties.d.find(userProperty => userProperty.name === "favorites");
    if (!prop) throw new Error("Could not find userProperty for favorites");
    prop.value = chatIds.map(chatId => ({id: chatId, type: "MEETING"}));
    try {
      this.connection.message("/app/UserProperty.save", prop);
    } catch (error) {
      console.log(error);
      this.events.$emit("notify", `Error saving favorite chats`);
    }
  }

  set recentChatIds(chatIds: number[]) {
    chatIds = utils.uniqueNonZeroNumberArray(chatIds);
    const prop = this.store.flows.userProperties.d.find(userProperty => userProperty.name === "recentTools");
    if (!prop) throw new Error("Could not find userProperty for recents");
    prop.value = chatIds.map(chatId => ({id: chatId, type: "MEETING"}));
    try {
      this.connection.message("/app/UserProperty.save", prop);
    } catch (error) {
      console.log(error);
      this.events.$emit("notify", `Error saving recent chats`);
    }
  }

  parseChats(chats: any[]) {
    const mapped = chats
    .filter(chat => !chat.integration && chat.type === "MEETING")
    .map(Chats.mapChat);

    const ids = mapped.map(chat => chat.id);
    this.store.flows.chats.d = this.store.flows.chats.d.filter(chat => ids.indexOf(chat.id) === -1);
    this.store.flows.chats.d = this.store.flows.chats.d.concat(mapped);
    this.connection.storeUpdate("chats");

    this.updateChatData();
  }

  parseChatUsers(chatUsers: any[]) {
    const mapped = chatUsers.map(Chats.mapChatUser);

    const ids = mapped.map(chatUser => chatUser.id);
    this.store.flows.chatUsers.d = this.store.flows.chatUsers.d.filter(chatUser => ids.indexOf(chatUser.id) === -1);
    this.store.flows.chatUsers.d = this.store.flows.chatUsers.d.concat(mapped);
    this.connection.storeUpdate("chatUsers");

    this.updateChatData();
  }

  parseWorkspaces(workspaces: any[]) {
    const mapped = workspaces
    .filter(workspace => !workspace.integration)
    .map(Chats.mapWorkspace);

    const ids = mapped.map(workspace => workspace.id);
    this.store.flows.workspaces.d = this.store.flows.workspaces.d.filter(workspace => ids.indexOf(workspace.id) === -1);
    this.store.flows.workspaces.d = this.store.flows.workspaces.d.concat(mapped);
    this.connection.storeUpdate("workspaces");
  }

  parseChatWorkspaces(chatWorkspaces: any[]) {
    const mapped = chatWorkspaces.map(Chats.mapChatWorkspace);

    const ids = mapped.map(chatWorkspace => chatWorkspace.id);
    this.store.flows.chatWorkspaces.d = this.store.flows.chatWorkspaces.d.filter(chatWorkspace => ids.indexOf(chatWorkspace.id) === -1);
    this.store.flows.chatWorkspaces.d = this.store.flows.chatWorkspaces.d.concat(mapped);
    this.connection.storeUpdate("chatWorkspaces");
  }

  parseChatWorkspaceAccesses(workspaceAccesses: any[]) {
    const mapped = workspaceAccesses.map(Chats.mapWorkspaceAccess);

    const ids = mapped.map(workspaceAccess => workspaceAccess.id);
    this.store.flows.workspaceAccesses.d = this.store.flows.workspaceAccesses.d.filter(workspaceAccess => ids.indexOf(workspaceAccess.id) === -1);
    this.store.flows.workspaceAccesses.d = this.store.flows.workspaceAccesses.d.concat(mapped);
    this.connection.storeUpdate("workspaceAccesses");
  }

  parseChatMessages(messages: any[]) {
    const mapped = messages.map(Chats.mapMessages);

    const chatId: number = mapped.map(chat => chat.chatId).reduce((a, b) => (a === b) ? a : NaN );
    if (!chatId) throw new Error("Different or no chatIds in messages");

    const ids = mapped.map(message => message.id);
    this.store.flows.messages[chatId].d = this.store.flows.messages[chatId].d.filter(message => ids.indexOf(message.id) === -1);
    this.store.flows.messages[chatId].d = this.store.flows.messages[chatId].d.concat(mapped);
    this.store.flows.messages[chatId].v += 1;
  }

  parseChatMessagesRead(messagesRead: any[]) {
    const mapped = messagesRead.map(Chats.mapMessagesRead);

    const ids = mapped.map(messagesRead => messagesRead.id);
    this.store.flows.messagesRead.d = this.store.flows.messagesRead.d.filter(messagesRead => ids.indexOf(messagesRead.id) === -1);
    this.store.flows.messagesRead.d = this.store.flows.messagesRead.d.concat(mapped);
    this.connection.storeUpdate("messagesRead");
  }

  updateChatData(): void {
    const currentUserId = this.store.currentUser && this.store.currentUser.id;
    if (!currentUserId) {
      console.log("! No currentUser while updating chat data");
      return;
    }

    let changed = false;

    this.store.flows.chats.d.forEach(chat => {
      if (!chat.name) {
        const otherUsers = this.store.flows.chatUsers.d.filter(chatUser => chatUser.userId !== currentUserId && chatUser.chatId === chat.id);
        if (otherUsers.length) {
          const names = otherUsers.map(chatUser => {
            const user = this.store.flows.users.d.find(user => user.id === chatUser.userId);
            if (user) {
              return utils.getFullNameFromUser(user);
            }
          }).filter(name => name);

          if (names.length) {
            chat.name = names.join(", ");
            changed = true;
          }
        }
      }

      const myChatUser = this.store.flows.chatUsers.d.find(chatUser => chatUser.userId === currentUserId && chatUser.chatId === chat.id);
      if (myChatUser) {
        if (chat.unread !== myChatUser.unreadItemsCount
          || chat.unreadImportant !== myChatUser.unreadItemsToMeCount
          || chat.unreadAtme !== myChatUser.atItemsToMeCount
          || chat.flagged !== myChatUser.flaggedItemsCount
        ) {
          chat.unread = myChatUser.unreadItemsCount;
          chat.unreadImportant = myChatUser.unreadItemsToMeCount;
          chat.unreadAtme = myChatUser.atItemsToMeCount;
          chat.flagged = myChatUser.flaggedItemsCount;
          changed = true;
        }
      }
    });

    if (changed) {
      this.store.flows.chats.d.sort((a, b) => ( a.name ? a.name : "" ).localeCompare(b.name ? b.name : ""));
      this.connection.storeUpdate("chats");
    }
  }

  private static mapChat(chat: any): Chat {
    return {
      id: chat.id,
      guid: chat.guid,
      description: chat.description,
      name: chat.name,
      ownerId: chat.ownerId,
      visibility: chat.visibility,
    };
  }

  private static mapChatUser(chatUser: any): ChatUser {
    return {
      id: chatUser.id,
      createDate: chatUser.createDate,
      modifiedDate: chatUser.modifiedDate,
      userId: chatUser.userId,
      chatId: chatUser.topicId,
      role: chatUser.role,
      status: chatUser.status,
      atItemsToMeCount: chatUser.atItemsToMeCount,
      flaggedItemsCount: chatUser.flaggedItemsCount,
      unreadItemsCount: chatUser.unreadItemsCount,
      unreadItemsToMeCount: chatUser.unreadItemsToMeCount,
    };
  }

  private static mapWorkspace(workspace: any): Workspace {
    return {
      id: workspace.id,
      name: workspace.name,
      logoUrl: workspace.logoUrl,
      type: workspace.type,
    };
  }

  private static mapChatWorkspace(chatWorkspace: any): ChatWorkspace {
    return {
      id: chatWorkspace.id,
      workspaceId: chatWorkspace.orgId,
      chatId: chatWorkspace.topicId,
    };
  }

  private static mapWorkspaceAccess(workspaceAccess: any): WorkspaceAccess {
    return {
      id: workspaceAccess.id,
      role: workspaceAccess.role,
      workspaceId: workspaceAccess.orgId,
      userId: workspaceAccess.userId,
    };
  }

  private static mapMessages(message: any): Message {
    return {
      id: message.id,
      createDate: message.createDate,
      modifiedDate: message.modifiedDate,
      userId: message.creatorUserId,
      chatId: message.topicId,
      type: message.type,
      text: message.text,
      replyTo: message.referenceFromTopicItemId,
      url: message.url,
      subject: message.subject,
      from: message.from,
      to: message.to,
      contentType: message.contentType,
      customData: message.customData,
    };
  }

  private static mapMessagesRead(messagesRead: any): MessagesRead {
    return {
      id: messagesRead.id,
      userId: messagesRead.userId,
      chatId: messagesRead.topicId,
      messageFrom: messagesRead.itemFrom,
      messageTo: messagesRead.itemTo,
    };
  }
}

export default Chats;

type propChat = { type: string, id: number; };

type chatFilter = { amount: number, from?: { id: number } };

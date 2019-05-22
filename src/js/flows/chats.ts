// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import STORE from "@/js/store";
import Connection from "@/js/flows/connection";
import Chat from "@/js/model/Chat";
import ChatUser from "@/js/model/ChatUser";

class Chats {
  store: STORE;
  eventBus: Vue;
  connection: Connection;

  constructor(store: STORE, eventBus: Vue) {
    this.store = store;
    this.eventBus = eventBus;

    autoBind(this);
  }

  async getChats(): Promise<void> {
    this.connection.subscribeUserTopic("Topic");
    this.connection.subscribeUserTopic("TopicUser");
    await Promise.all([
      this.connection.findByUser("Topic"),
      this.connection.findByUser("TopicUser"),
    ]);
  }

  parseChats(chats: any[]) {
    if (chats.length === undefined) {
      chats = [chats];
    }
    const mapped = chats
    .filter(chat => !chat.integration && chat.type === "MEETING")
    .map(Chats.mapChat);

    const ids = mapped.map(chat => chat.id);
    this.store.flows.chats.chats = this.store.flows.chats.chats.filter(chat => ids.indexOf(chat.id) === -1);
    this.store.flows.chats.chats = this.store.flows.chats.chats.concat(mapped);
    this.store.flows.chats.v += 1;
  }

  parseChatUsers(chatUsers: any[]) {
    if (chatUsers.length === undefined) {
      chatUsers = [chatUsers];
    }
    const mapped = chatUsers.map(Chats.mapChatUser);

    const ids = mapped.map(chatUser => chatUser.id);
    this.store.flows.chatUsers.chatUsers = this.store.flows.chatUsers.chatUsers.filter(chatUser => ids.indexOf(chatUser.id) === -1);
    this.store.flows.chatUsers.chatUsers = this.store.flows.chatUsers.chatUsers.concat(mapped);
    this.store.flows.chatUsers.v += 1;
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
      topicId: chatUser.topicId,
      role: chatUser.role,
      status: chatUser.status,
      atItemsToMeCount: chatUser.atItemsToMeCount,
      flaggedItemsCount: chatUser.flaggedItemsCount,
      unreadItemsCount: chatUser.unreadItemsCount,
      unreadItemsToMeCount: chatUser.unreadItemsToMeCount,
    };
  }
}

export default Chats;

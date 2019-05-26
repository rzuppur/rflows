// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import STORE from "@/js/store";
import utils from "@/js/flows/utils";
import Connection from "@/js/flows/connection";
import Chat from "@/js/model/Chat";
import ChatUser from "@/js/model/ChatUser";

class Chats {
  store: STORE;
  events: Vue;
  connection: Connection;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;

    autoBind(this);
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

  get recentChatIds(): number[] {
    const recents = this.store.flows.userProperties.d.find(userProperty => userProperty.name === "recentTools");
    if (recents && recents.value.length) {
      return recents.value
      .filter((recent: recentTool) => recent.type === "MEETING")
      .map((recent: recentTool) => recent.id)
      .filter((recent: recentTool) => recent);
    }
    return [];
  }

  set recentChatIds(chatIds: number[]) {
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
    this.store.flows.chats.v += 1;

    this.updateChatData();
  }

  parseChatUsers(chatUsers: any[]) {
    const mapped = chatUsers.map(Chats.mapChatUser);

    const ids = mapped.map(chatUser => chatUser.id);
    this.store.flows.chatUsers.d = this.store.flows.chatUsers.d.filter(chatUser => ids.indexOf(chatUser.id) === -1);
    this.store.flows.chatUsers.d = this.store.flows.chatUsers.d.concat(mapped);
    this.store.flows.chatUsers.v += 1;

    this.updateChatData();
  }

  updateChatData(): void {
    const currentUserId = this.store.currentUser && this.store.currentUser.id;
    if (!currentUserId) {
      console.log("! No currentUser while updating chat unreads");
      return;
    }

    let changed = false;

    this.store.flows.chats.d.forEach(chat => {
      if (!chat.name) {
        const otherUsers = this.store.flows.chatUsers.d.filter(chatUser => chatUser.userId !== currentUserId && chatUser.topicId === chat.id);
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

      const myChatUser = this.store.flows.chatUsers.d.find(chatUser => chatUser.userId === currentUserId && chatUser.topicId === chat.id);
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
      this.store.flows.chats.v += 1;
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

type recentTool = { type: string, id: number; };

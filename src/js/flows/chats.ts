// @ts-ignore
import autoBind from "auto-bind";
import Vue from "vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import utils from "@/js/flows/utils";
import { mapChat } from "@/js/model/Chat";
import { mapChatUser } from "@/js/model/ChatUser";
import { mapWorkspace } from "@/js/model/Workspace";
import { mapChatWorkspace } from "@/js/model/ChatWorkspace";
import { mapWorkspaceAccess } from "@/js/model/WorkspaceAccess";
import Message, { mapMessage } from "@/js/model/Message";
import { mapMessagesRead } from "@/js/model/MessagesRead";
import { mapMessageFlagged } from "@/js/model/MessagesFlagged";
import { SocketResult } from "@/js/socket";

class Chats {
  flows: Flows2;
  store: STORE;
  events: Vue;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    this.setupMessageGettersSetters();
    autoBind(this);
  }

  private setupMessageGettersSetters() {
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

  async getChats(): Promise<void> {
    this.flows.connection.subscribeUserTopic("Topic");
    this.flows.connection.subscribeUserTopic("TopicUser");
    this.flows.connection.subscribeUserTopic("Organization");
    this.flows.connection.subscribeUserTopic("TopicLocation");
    await Promise.all([
      this.flows.connection.findByUser("Topic"),
      this.flows.connection.findByUser("TopicUser"),
      this.flows.connection.findByUser("Organization"),
      this.flows.connection.findByUser("TopicLocation"),
    ]);
  }

  async getChatUsers(chatId: number): Promise<void> {
    await Promise.all([
      this.flows.connection.findByChat("TopicUser", chatId),
    ]);
  }

  async getChatReadAndFlagged(chatId: number): Promise<SocketResult[]> {
    this.flows.connection.subscribeChatTopic("TopicItemUserProperty", chatId);
    this.flows.connection.subscribeChatTopic("TopicItemRead", chatId);

    return await Promise.all([
      this.flows.connection.findByChat("TopicItemUserProperty", chatId),
      this.flows.connection.findByChat("TopicItemRead", chatId),
    ]);
  }

  async getChatMessages(chatId: number, filter: chatFilter | null): Promise<Message[]> {
    this.flows.connection.subscribeChatTopic("TopicItem", chatId);

    return (await this.flows.connection.findByChat("TopicItem", chatId, filter)).body.map(mapMessage);
  }

  setChatOpen(chatId: number, open: boolean): void {
    this.flows.connection.message("/app/Topic.setMyStatus", { topicId: chatId, status: open ? "OPEN" : "NONE" });
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
      this.flows.connection.message("/app/UserProperty.save", prop);
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
      this.flows.connection.message("/app/UserProperty.save", prop);
    } catch (error) {
      console.log(error);
      this.events.$emit("notify", `Error saving recent chats`);
    }
  }

  parseChats(chats: any[]) {
    this.flows.updateStoreArray("chats", chats.filter(chat => !chat.integration && chat.type === "MEETING").map(mapChat));
    this.updateChatData();
  }

  parseChatUsers(chatUsers: any[]) {
    this.flows.updateStoreArray("chatUsers", chatUsers.map(mapChatUser));
    this.updateChatData();
  }

  parseWorkspaces(workspaces: any[]) {
    this.flows.updateStoreArray("workspaces", workspaces.filter(workspace => !workspace.integration).map(mapWorkspace));
  }

  parseChatWorkspaces(chatWorkspaces: any[]) {
    this.flows.updateStoreArray("chatWorkspaces", chatWorkspaces.map(mapChatWorkspace));
  }

  parseChatWorkspaceAccesses(workspaceAccesses: any[]) {
    this.flows.updateStoreArray("workspaceAccesses", workspaceAccesses.map(mapWorkspaceAccess));
  }

  parseChatMessages(messages: any[]) {
    const mapped = messages.map(mapMessage);

    const chatId: number = mapped.map(chat => chat.chatId).reduce((a, b) => (a === b) ? a : NaN );
    if (!chatId) throw new Error("Different or no chatIds in messages");

    const ids = mapped.map(message => message.id);
    this.store.flows.messages[chatId].d = this.store.flows.messages[chatId].d.filter(message => ids.indexOf(message.id) === -1);
    this.store.flows.messages[chatId].d = this.store.flows.messages[chatId].d.concat(mapped);
    this.store.flows.messages[chatId].v += 1;
  }

  parseChatMessagesRead(messagesRead: any[]) {
    this.flows.updateStoreArray("messagesRead", messagesRead.map(mapMessagesRead));
  }

  parseChatMessagesFlagged(messagesFlagged: any[]) {
    this.flows.updateStoreArray("messagesFlagged", messagesFlagged.filter(flagged => flagged.flag).map(mapMessageFlagged));
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
      this.flows.storeUpdate("chats");
    }
  }
}

export default Chats;

type propChat = { type: string, id: number; };

type chatFilter = { amount: number, from?: { id: number } };

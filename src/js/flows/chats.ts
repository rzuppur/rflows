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
import { performanceLog } from "@/js/flows/utils";

class Chats {
  flows: Flows2;
  store: STORE;
  events: Vue;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    autoBind(this);
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

  @performanceLog()
  parseChats(chats: any[]): void {
    this.flows.updateStoreArray("chats", chats.filter(chat => !chat.integration && chat.type === "MEETING").map(mapChat));
    this.updateChatData();
  }

  @performanceLog()
  parseChatUsers(chatUsers: any[]) {
    this.flows.updateStoreArray("chatUsers", chatUsers.map(mapChatUser));
    this.updateChatData();
  }

  @performanceLog()
  parseWorkspaces(workspaces: any[]) {
    this.flows.updateStoreArray("workspaces", workspaces.filter(workspace => !workspace.integration).map(mapWorkspace));
  }

  @performanceLog()
  parseChatWorkspaces(chatWorkspaces: any[]) {
    this.flows.updateStoreArray("chatWorkspaces", chatWorkspaces.map(mapChatWorkspace));
  }

  @performanceLog()
  parseChatWorkspaceAccesses(workspaceAccesses: any[]) {
    this.flows.updateStoreArray("workspaceAccesses", workspaceAccesses.map(mapWorkspaceAccess));
  }

  @performanceLog()
  updateChatData(): void {
    const currentUserId = this.store.currentUser && this.store.currentUser.id;
    if (!currentUserId) {
      throw new Error("No currentUser while updating chat data");
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

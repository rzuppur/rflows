// @ts-ignore
import autoBind from "auto-bind";
import Vue from "vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import utils from "@/js/flows/utils";
import { mapChat } from "@/js/model/Chat";
import { mapChatUser } from "@/js/model/ChatUser";
import { mapChatProperty } from "@/js/model/ChatProperty";
import { mapWorkspace } from "@/js/model/Workspace";
import { mapChatWorkspace } from "@/js/model/ChatWorkspace";
import { mapWorkspaceAccess } from "@/js/model/WorkspaceAccess";
import { FrameAction } from "@/js/flows/connection";
import { SocketResult } from "@/js/socket";

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

  get favChatIds(): number[] {
    const favs = this.store.flows.userProperties.d.find(userProperty => userProperty.name === "favorites");
    if (favs && favs.value.length) {
      return favs.value
      .filter((fav: propChat) => fav.type === "MEETING" && fav.id)
      .map((fav: propChat) => fav.id);
    }
    return [];
  }

  get recentChatIds(): number[] {
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

  get userChatIds(): number[] {
    const currentUserId = this.store.currentUser && this.store.currentUser.id;
    if (!currentUserId) {
      return [];
    }
    return this.store.flows.chatUsers.d.filter(chatUser => chatUser.userId === currentUserId).map(chatUser => chatUser.chatId);
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
      console.error("Could not save recent chats");
      console.error(error);
    }
  }

  public async getChats(): Promise<void> {
    this.flows.connection.subscribeUserTopic("Topic");
    this.flows.connection.subscribeUserTopic("TopicUser");
    this.flows.connection.subscribeUserTopic("Organization");
    this.flows.connection.subscribeUserTopic("TopicLocation");
    this.flows.connection.subscribeUserTopic("TopicProperty");
    await Promise.all([
      this.flows.connection.findByUser("Topic"),
      this.flows.connection.findByUser("TopicUser"),
      this.flows.connection.findByUser("Organization"),
      this.flows.connection.findByUser("TopicLocation"),
      this.flows.connection.findByUser("TopicProperty"),
    ]);
  }

  public async getChatUsers(chatId: number): Promise<void> {
    await Promise.all([
      this.flows.connection.findByChat("TopicUser", chatId),
    ]);
  }

  public setChatOpen(chatId: number, open: boolean): void {
    this.flows.connection.message("/app/Topic.setMyStatus", {topicId: chatId, status: open ? "OPEN" : "NONE"});
  }

  public currentUserMemberOfChat(chatId: number): boolean {
    return this.userChatIds.includes(chatId);
  }

  public setTypingStatus(typing: boolean, chatId: number): void {
    this.flows.connection.message("/app/Topic.setMyStatus", {
      topicId: chatId,
      status: typing ? "TYPING" : "OPEN",
    });
  }

  public getChatName(chatId: number): string {
    const chat = this.store.flows.chats.d.find(chat => chat.id === chatId);
    if (!chat || !chat.name) return "?";
    return chat.name;
  }

  public subAll() {
    this.userChatIds.forEach((chatId) => {
      this.flows.connection.subscribeChatTopic("TopicItem", chatId);
    });
  }

  public joinChat(chatId: number): Promise<SocketResult> {
    if (!this.store.currentUser) throw new Error("No currentUser in store");
    const currentUserId = this.store.currentUser.id;

    return this.flows.connection.messageWithResponse("/app/TopicUser.save", {
      topicId: chatId,
      userId: currentUserId,
    });
  }

  public leaveChat(chatId: number): Promise<SocketResult> {
    if (!this.store.currentUser) throw new Error("No currentUser in store");
    const currentUserId = this.store.currentUser.id;

    const chatUser = this.store.flows.chatUsers.d.find(chatUser => chatUser.chatId === chatId && chatUser.userId === currentUserId);
    if (!chatUser) throw new Error("No chatUser found");

    const chat = this.store.flows.chats.d.find(chat => chat.id === chatId);
    if (!chat) throw new Error("No chat found");

    return this.flows.connection.messageWithResponse("/app/TopicUser.delete", { id: chatUser.id });
  }

  parseChats(chats: any[], action: FrameAction): void {
    if (action === "deleted") {
      this.flows.deleteStoreArrayItems("chats", chats);
      return;
    }
    this.flows.updateStoreArray("chats", chats.filter(chat => !chat.integration && chat.type === "MEETING").map(mapChat));
    this.updateChatData();
  }

  parseChatUsers(chatUsers: any[], action: FrameAction) {
    if (action === "deleted") {
      this.flows.deleteStoreArrayItems("chatUsers", chatUsers);
      return;
    }
    const mapped = chatUsers.map(mapChatUser);
    this.flows.updateStoreArray("chatUsers", mapped);
    this.updateChatData();
    const chatId: number = mapped.map(chatUser => chatUser.chatId).reduce((a, b) => (a === b) ? a : NaN);

    this.subAll();

    // todo: this is called every time someone's status changes, should only be updated if user leaves a chat
    this.flows.messages.updateMessagesRead(chatId);
  }

  parseWorkspaces(workspaces: any[], action: FrameAction) {
    if (action === "deleted") {
      this.flows.deleteStoreArrayItems("workspaces", workspaces);
      return;
    }
    this.flows.updateStoreArray("workspaces", workspaces.filter(workspace => !workspace.integration).map(mapWorkspace));
  }

  parseChatWorkspaces(chatWorkspaces: any[], action: FrameAction) {
    if (action === "deleted") {
      this.flows.deleteStoreArrayItems("chatWorkspaces", chatWorkspaces);
      return;
    }
    this.flows.updateStoreArray("chatWorkspaces", chatWorkspaces.map(mapChatWorkspace));
  }

  parseChatProperties(chatProperties: any[], action: FrameAction) {
    if (action === "deleted") {
      this.flows.deleteStoreArrayItems("chatProperties", chatProperties);
      return;
    }
    this.flows.updateStoreArray("chatProperties", chatProperties.map(mapChatProperty));
  }

  parseChatWorkspaceAccesses(workspaceAccesses: any[], action: FrameAction) {
    if (action === "deleted") {
      this.flows.deleteStoreArrayItems("workspaceAccesses", workspaceAccesses);
      return;
    }
    this.flows.updateStoreArray("workspaceAccesses", workspaceAccesses.map(mapWorkspaceAccess));
  }

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

      // @ts-ignore
      chat.props = this.store.flows.chatProperties.d.filter(prop => prop.chatId === chat.id).reduce((obj, item) => { obj[item.name] = item.value; return obj; }, {});
    });

    if (changed) {
      this.store.flows.chats.d.sort((a, b) => (a.name ? a.name : "").localeCompare(b.name ? b.name : ""));
      this.flows.storeUpdate("chats");

      const totalUnread: number = this.store.flows.chats.d.reduce((a, b) => (a + (b.unread || 0)), 0);
      this.store.unreadMessagesTotal = totalUnread ? `(${totalUnread}) ` : "";
    }
  }
}

export default Chats;

type propChat = { type: string, id: number; };

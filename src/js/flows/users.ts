// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import User, { mapUser } from "@/js/model/User";
import { FrameAction } from "@/js/flows/connection";

class Users {
  flows: Flows2;
  store: STORE;
  events: Vue;

  constructor(flows: Flows2) {
    this.flows = flows;
    this.store = flows.store;
    this.events = flows.events;

    autoBind(this);
  }

  async getUsers(): Promise<void> {
    this.flows.connection.subscribeUserTopic("User");
    this.flows.connection.subscribeUserTopic("UserAccess");
    await Promise.all([
      this.flows.connection.findByUser("User"),
      this.flows.connection.findByUser("UserAccess"),
    ]);
  }

  public getUserName(userId: number): string {
    const user = this.store.flows.users.d.find(user => user.id === userId);
    return this.flows.utils.getFullNameFromUser(user);
  }

  public getUserAvatar(userId: number): string {
    const user = this.store.flows.users.d.find(user => user.id === userId);
    return this.flows.utils.getAvatarFromUser(user);
  }

  parseUsers(users: any[], action: FrameAction) {
    if (action === "deleted") {
      this.flows.deleteStoreArrayItems("users", users);
      return;
    }
    this.flows.updateStoreArray("users", users.map(mapUser));
    this.flows.chats.updateChatData();
  }
}

export default Users;

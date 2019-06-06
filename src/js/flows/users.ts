// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import Flows2 from "@/js/flows/main";
import STORE from "@/js/store";
import Connection from "@/js/flows/connection";
import User from "@/js/model/User";
import Chats from "@/js/flows/chats";

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

  parseUsers(users: any[]) {
    this.flows.updateStoreArray("users", users.map(Users.mapUser));
    this.flows.chats.updateChatData();
  }

  private static mapUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      workspaceId: user.homeOrgId,
      online: user.online,
      status: user.status,
      lastLoggedIn: user.lastLoggedIn,
      lastLoggedOut: user.lastLoggedOut,
    };
  }
}

export default Users;

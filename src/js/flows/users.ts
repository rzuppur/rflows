// @ts-ignore
import autoBind from "auto-bind";
import { Vue } from "vue/types/vue";

import STORE from "@/js/store";
import Connection from "@/js/flows/connection";
import User from "@/js/model/User";
import Chats from "@/js/flows/chats";

class Users {
  store: STORE;
  events: Vue;
  connection: Connection;
  chats: Chats;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;

    autoBind(this);
  }

  async getUsers(): Promise<void> {
    this.connection.subscribeUserTopic("User");
    this.connection.subscribeUserTopic("UserAccess");
    await Promise.all([
      this.connection.findByUser("User"),
      this.connection.findByUser("UserAccess"),
    ]);
  }

  parseUsers(users: any[]) {
    const mapped = users.map(Users.mapUser);

    const ids = mapped.map(user => user.id);
    this.store.flows.users.d = this.store.flows.users.d.filter(user => ids.indexOf(user.id) === -1);
    this.store.flows.users.d = this.store.flows.users.d.concat(mapped);
    this.connection.storeUpdate("users");

    this.chats.updateChatData();
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

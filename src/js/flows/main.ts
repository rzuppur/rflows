import { Vue } from "vue/types/vue.d";

import STORE from "@/js/store";
import utils from "@/js/flows/utils";
import localstorage from "@/js/flows/localstorage";
import Connection from "@/js/flows/connection";
import Chats from "@/js/flows/chats";
import Users from "@/js/flows/users";

class Flows2 {
  store: STORE;
  events: Vue;
  connection: Connection;
  chats: Chats;
  users: Users;

  readonly utils = utils;
  readonly localstorage = localstorage;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;

    this.connection = new Connection(store, events);
    this.chats = new Chats(store, events);
    this.users = new Users(store, events);

    this.chats.connection = this.connection;
    this.users.connection = this.connection;
    this.connection.chats = this.chats;
    this.connection.users = this.users;
    this.users.chats = this.chats;
  }
}

export default Flows2;

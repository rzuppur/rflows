import { Vue } from "vue/types/vue.d";

import STORE, { StoreKeyVersionNumber } from "@/js/store";
import utils from "@/js/flows/utils";
import localstorage from "@/js/flows/localstorage";
import Connection from "@/js/flows/connection";
import Chats from "@/js/flows/chats";
import Users from "@/js/flows/users";
import Settings from "@/js/flows/settings";

class Flows2 {
  store: STORE;
  events: Vue;
  connection: Connection;
  chats: Chats;
  users: Users;
  settings: Settings;

  readonly utils = utils;
  readonly localstorage = localstorage;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;

    this.connection = new Connection(this);
    this.chats = new Chats(this);
    this.users = new Users(this);
    this.settings = new Settings(this);
  }

  public storeUpdate(key: StoreKeyVersionNumber): void {
    this.store.flows[key].v += 1;
  }

  public updateStoreArray(key: StoreKeyVersionNumber, newItems: any[]) {
    const ids = newItems.map(item => item.id);
    // @ts-ignore
    this.store.flows[key].d = this.store.flows[key].d.filter(item => ids.indexOf(item.id) === -1);
    // @ts-ignore
    this.store.flows[key].d = this.store.flows[key].d.concat(newItems);
    this.storeUpdate(key);
  }
}

export default Flows2;

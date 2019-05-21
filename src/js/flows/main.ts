import { Vue } from "vue/types/vue.d";

import STORE from "@/js/store";
import utils from "@/js/flows/utils";
import localstorage from "@/js/flows/localstorage";
import Connection from "@/js/flows/connection";

class Flows2 {
  store: STORE;
  events: Vue;
  connection: Connection;

  readonly utils = utils;
  readonly localstorage = localstorage;

  constructor(store: STORE, events: Vue) {
    this.store = store;
    this.events = events;
    this.connection = new Connection(store, events);
  }
}

export default Flows2;

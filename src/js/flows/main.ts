import { Vue } from "vue/types/vue.d";

import utils from "@/js/flows/utils";
import localstorage from "@/js/flows/localstorage";
import Connection from "@/js/flows/connection";

class Flows2 {
  store: any;
  eventBus: Vue;
  connection: Connection;

  readonly utils = utils;
  readonly localstorage = localstorage;

  constructor(store: any, eventBus: Vue) {
    this.store = store;
    this.eventBus = eventBus;
    this.connection = new Connection(store, eventBus);
  }
}

export default Flows2;

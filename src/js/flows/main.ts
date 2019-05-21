import utils from "@/js/flows/utils";
import {Vue} from "vue/types/vue";

class Flows2 {
  store: any;
  eventBus: Vue;
  utils: object;

  constructor(store: any, eventBus: Vue) {
    this.store = store;
    this.eventBus = eventBus;
    this.utils = utils;
  }
}

export default Flows2;

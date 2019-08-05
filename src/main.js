import Vue from "vue";
import VTooltip from "v-tooltip";
import PortalVue from "portal-vue";
import AsyncComputed from "vue-async-computed";
import { plugin } from "vue-function-api";
import rvc from "@rzuppur/rvc";

import STORE from "@/js/store";
import utils from "@/js/utils";
import Flows2 from "@/js/flows/main";
import { RESIZE_DEBOUNCE_TIME } from "@/js/consts";

import App from "@/App.vue";
import Button from "@/components/UI/global/Button.vue";

// import "intersection-observer";
import "@/assets/main.css";

Vue.use(VTooltip);
Vue.use(PortalVue);
Vue.use(AsyncComputed);
Vue.use(plugin);
Vue.use(rvc);
Vue.config.productionTip = false;

Vue.component("btn", Button);

/*
 * STORE
 *
 * $store.flows[key].d (data) is not watched for updates by Vue
 * Components should be watching $store.flows[key].v (data version)
 *
 */
const storeModel = { init: STORE };
storeModel.init();
delete storeModel.init;
delete storeModel.flows.messages;
Object.keys(storeModel.flows).forEach(key => delete storeModel.flows[key].d);
const store = new Vue({
  data() {
    return storeModel;
  },
});
Object.keys(storeModel.flows).forEach((key) => { store.flows[key].d = []; });

/*
 * EVENT BUS
 */
const events = new Vue();

Vue.mixin({
  filters: {
    capitalize(value) {
      if (!value) return "";
      value = value.toString();
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
  },
  computed: {
    mqMobile() {
      return this.$root.mqMobileMatches;
    },
  },
  beforeCreate() {
    this.$store = store;
    this.$flows = this.$root.$flows;
    this.$events = events;
    this.utils = utils;
  },
  created() {
    this.flows = this.$root.flows;
  },
  methods: {
    _debug(text, ...extra) {
      if (this.$store.debugMode) {
        const caller = new Error().stack.split("\n")[2].replace(/ \(.+/g, "").replace(/\s.+at [^.]*\./g, "");
        this._logDebug(text, caller);
        if (extra) console.log(...extra); // eslint-disable-line no-console
      }
    },
    _logDebug(text, caller) {
      text = text.toString();
      const time = utils.debugDateTime();
      const error = !text.indexOf("! ");
      if (error) text = text.substring(2);
      const parentVNodeTag = this.$options?._parentVnode?.tag?.split("-");
      const name = parentVNodeTag ? parentVNodeTag[parentVNodeTag.length - 1] : "unknown";
      console.log(`${time} %c${name}.vue (${caller}): %c${text}`, "color: #3ba776; font-weight: bold", `color: ${error ? "#f00" : "inherit"}`); // eslint-disable-line no-console
    },
  },
});

let resizeDebounceTimeout = null;

function alwaysFullHeightSetSize(fixAnchor) {
  const elements = document.getElementsByClassName("alwaysFullHeight");
  if (fixAnchor && elements.length) {
    const height = `${Math.round(fixAnchor.getBoundingClientRect().height || window.innerHeight)}px`;
    for (let i = 0; i < elements.length; i++) {
      elements[i].setAttribute("style", `height:${height}; max-height:${height}`);
    }
  }
  events.$emit("debouncedResize");
}

new Vue({
  data: {
    mqMobileMatches: false,
  },
  created() {
    this.$flows = new Flows2(this.$store, events);

    const fixAnchor = document.getElementById("fixAnchor");
    this.updateFullHeight = () => {
      alwaysFullHeightSetSize(fixAnchor);
    };

    const resizeHandler = () => {
      this.updateFullHeight();
      this.$events.$emit("windowResize");
    };

    window.addEventListener("resize", () => {
      clearTimeout(resizeDebounceTimeout);
      resizeDebounceTimeout = setTimeout(resizeHandler, RESIZE_DEBOUNCE_TIME);
    });

    this.mq = window.matchMedia("(max-width: 700px)");
    this.mqListener = (q) => { this.mqMobileMatches = q.matches; };
    this.mq.addListener(this.mqListener);
    this.mqMobileMatches = this.mq.matches;
  },
  destroyed() {
    this.mq.removeListener(this.mqListener);
  },
  render: h => h(App),
}).$mount("#app");

import Vue from "vue";
import VueCompositionApi from "@vue/composition-api";

import PortalVue from "portal-vue";
import AsyncComputed from "vue-async-computed";
import rvc from "@rzuppur/rvc";

import STORE from "@/js/store";
import utils from "@/js/utils";
import Flows2 from "@/js/flows/main";
import { RESIZE_DEBOUNCE_TIME, EMOJIFY } from "@/js/consts";

import App from "@/App.vue";

// import "intersection-observer";
import "@/assets/main.css";

Vue.use(VueCompositionApi);
Vue.use(PortalVue);
Vue.use(AsyncComputed);
Vue.use(rvc);
Vue.config.productionTip = false;

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
store.EMOJIFY = EMOJIFY;

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
    mqSideCollapse() {
      return this.$root.mqSideCollapseMatches;
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
}

new Vue({
  data: {
    mqMobileMatches: false,
    mqSideCollapseMatches: false,
  },
  created() {
    this.$flows = new Flows2(this.$store, events);

    const fixAnchor = document.getElementById("fixAnchor");
    this.updateFullHeight = () => {
      alwaysFullHeightSetSize(fixAnchor);
    };

    const resizeHandler = () => {
      this.updateFullHeight();
      this.$events.$emit("windowResize"); // TODO: remove after popup menu in RVC
    };

    window.addEventListener("resize", () => {
      clearTimeout(resizeDebounceTimeout);
      resizeDebounceTimeout = setTimeout(resizeHandler, RESIZE_DEBOUNCE_TIME);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.$events.$emit("documentHidden");
      } else {
        this.$events.$emit("documentVisible");
      }
    }, false);

    this.mobileMediaQueryList = window.matchMedia("(max-width: 700px)");
    this.mqListener = (q) => { this.mqMobileMatches = q.matches; };
    this.mobileMediaQueryList.addListener(this.mqListener);
    this.mqMobileMatches = this.mobileMediaQueryList.matches;

    this.sideCollapseMediaQueryList = window.matchMedia("(max-width: 1000px)");
    this.mqSideCollapseListener = (q) => { this.mqSideCollapseMatches = q.matches; };
    this.sideCollapseMediaQueryList.addListener(this.mqSideCollapseListener);
    this.mqSideCollapseMatches = this.sideCollapseMediaQueryList.matches;
  },
  destroyed() {
    this.mq.removeListener(this.mqListener);
  },
  render: h => h(App),
}).$mount("#app");

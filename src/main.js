import Vue from "vue";
import VTooltip from "v-tooltip";
import PortalVue from "portal-vue";

import STORE from "@/js/store";
import utils from "@/js/utils";
import Flows from "@/js/flows";
import Flows2 from "@/js/flows/main";
import { RESIZE_DEBOUNCE_TIME, DEBUG } from "@/js/consts";

import App from "@/App.vue";
import Button from "@/components/UI/global/Button.vue";

// import "intersection-observer";
import "@/assets/main.css";

Vue.use(VTooltip);
Vue.use(PortalVue);
Vue.config.productionTip = false;

Vue.component("btn", Button);

const storeModel = { init: STORE };
storeModel.init();

const store = new Vue({
  data() {
    return storeModel ;
  },
});
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
  },
  created() {
    this.flows = this.$root.flows;
    this.$flows = this.$root.$flows;
    this.$events = events;
    this.utils = utils;
    this.DEBUG = DEBUG;
  },
  methods: {
    _debug(text, ...extra) {
      if (this.DEBUG) {
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

let alwaysFullHeightTimeout = null;

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
    //this.flows = new Flows(this.$store, events);
    this.$flows = new Flows2(this.$store, events);

    const fixAnchor = document.getElementById("fixAnchor");
    this.updateFullHeight = () => {
      alwaysFullHeightSetSize(fixAnchor);
    };
    window.addEventListener("resize", () => {
      clearTimeout(alwaysFullHeightTimeout);
      alwaysFullHeightTimeout = setTimeout(this.updateFullHeight, RESIZE_DEBOUNCE_TIME);
    });

    this.mq = window.matchMedia("(max-width: 600px)");
    this.mqListener = q => this.mqMobileMatches = q.matches;
    this.mq.addListener(this.mqListener);
    this.mqMobileMatches = this.mq.matches;
  },
  destroyed() {
    this.mq.removeListener(this.mqListener);
  },
  render: h => h(App),
}).$mount("#app");

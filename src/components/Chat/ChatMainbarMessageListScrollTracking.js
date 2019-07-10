import ResizeObserver from "resize-observer-polyfill";
import { value, onMounted, onUnmounted } from "vue-function-api";
import { SCROLL_DEBOUNCE_TIME } from "@/js/consts";

function scrollTracking(props, context) {
  const height = value(0);
  const top = value(0);
  const lastScrollTop = {};
  const chatFirstScrollDone = {};
  const keepScrollBottom = {};
  let scrollThrottle = null;
  let resizeThrottle = null;

  const saveScrollPosition = (chatId) => {
    lastScrollTop[chatId] = top.value;
  };

  const restoreScrollPosition = (chatId) => {
    if (typeof lastScrollTop[chatId] === "undefined") return;
    const messagesEl = context.refs.messages;
    setTimeout(() => { if (messagesEl) messagesEl.scrollTop = lastScrollTop[chatId]; }, 0);
  };

  const scrollToNew = () => {
    const unreadSepEl = context.refs.unread?.[0];
    unreadSepEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  const scrollToBottomInstant = () => {
    const messagesEl = context.refs.messages;
    if (messagesEl) messagesEl.scrollTop = height.value;
  };
  context.root.$events.$on("MESSAGELIST_scrollToBottomInstant", scrollToBottomInstant);

  const scrollToNewOrBottomInstant = () => {
    const unreadSepEl = context.refs.unread?.[0];
    if (unreadSepEl) {
      unreadSepEl.scrollIntoView({ block: "start" });
    } else {
      const messagesEl = context.refs.messages;
      if (messagesEl) messagesEl.scrollTop = height.value;
    }
  };

  const markChatAsNew = (chatId) => {
    chatFirstScrollDone[chatId] = false;
    keepScrollBottom[chatId] = true;
    height.value = 0;
    top.value = 0;
  };

  /*
  SCROLL
   */

  const keepScrollBottomThreshold = 20;

  const scrollUpdate = () => {
    scrollThrottle = null;
    const messagesEl = context.refs.messages;
    if (messagesEl) {
      top.value = Math.round(messagesEl.scrollTop);
      height.value = Math.round(messagesEl.scrollHeight - messagesEl.clientHeight);
      if (!resizeThrottle) keepScrollBottom[props.chatId] = top.value >= (height.value - keepScrollBottomThreshold);
      // console.log(`%cBOTTOM ${keepScrollBottom[props.chatId]}`, "color: green; font-size: 20px;");
    }
  };

  const onMessagesScroll = () => {
    if (!scrollThrottle) scrollThrottle = setTimeout(scrollUpdate, SCROLL_DEBOUNCE_TIME);
  };

  onUnmounted(() => {
    clearTimeout(scrollThrottle);
  });

  /*
  RESIZE
   */

  const resizeUpdate = () => {
    resizeThrottle = null;
    const messagesEl = context.refs.messages;
    if (messagesEl) {
      top.value = Math.round(messagesEl.scrollTop);
      height.value = Math.round(messagesEl.scrollHeight - messagesEl.clientHeight);
    }
    if (!chatFirstScrollDone[props.chatId] && height.value > 0) {
      setTimeout(scrollToNewOrBottomInstant, 0);
      chatFirstScrollDone[props.chatId] = true;
    }
    if (keepScrollBottom[props.chatId]) {
      messagesEl.scrollTop = height.value;
      top.value = height.value;
      // console.log("%cKEEPING BOTTOM", "color: red; font-size: 20px;");
    }
  };

  const onMessagesResize = () => {
    if (!resizeThrottle) resizeThrottle = setTimeout(resizeUpdate, SCROLL_DEBOUNCE_TIME);
  };

  const messagesObs = new ResizeObserver(onMessagesResize);
  onMounted(() => {
    if (context.refs.messagesInner) messagesObs.observe(context.refs.messagesInner);
    if (context.refs.messages) messagesObs.observe(context.refs.messages);
  });

  onUnmounted(() => {
    clearTimeout(resizeThrottle);
    messagesObs.disconnect();
  });

  /*
  EXPORT
   */

  return {
    top,
    onMessagesScroll,
    markChatAsNew,
    saveScrollPosition,
    restoreScrollPosition,
    scrollToNew,
  };
}

export default scrollTracking;

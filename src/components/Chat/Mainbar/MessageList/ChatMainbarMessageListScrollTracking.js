import ResizeObserver from "resize-observer-polyfill";
import { ref, onMounted, onUnmounted } from "@vue/composition-api";
import { SCROLL_DEBOUNCE_TIME } from "@/js/consts";

function scrollTracking(props, context) {

  /*
  SCROLL
   */

  const height = ref(0);
  const viewportHeight = ref(0);
  const top = ref(0);
  const lastScrollTop = {};
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

  const keepScrollBottomThreshold = 20;

  const scrollUpdate = () => {
    scrollThrottle = null;
    const messagesEl = context.refs.messages;
    if (messagesEl) {
      top.value = Math.round(messagesEl.scrollTop);
      height.value = Math.round(messagesEl.scrollHeight - messagesEl.clientHeight);
      if (!resizeThrottle) keepScrollBottom[props.chatId] = top.value >= (height.value - keepScrollBottomThreshold);
    }
  };

  const onMessagesScroll = () => {
    if (!scrollThrottle) scrollThrottle = setTimeout(scrollUpdate, SCROLL_DEBOUNCE_TIME);
  };

  onUnmounted(() => {
    clearTimeout(scrollThrottle);
  });

  const scrollToNew = () => {
    const unreadSepEl = context.refs.unread?.[0];
    unreadSepEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToNewInstant = () => {
    const unreadSepEl = context.refs.unread?.[0];
    unreadSepEl?.scrollIntoView({ block: "start" });
  };

  const scrollToBottomInstant = () => {
    const messagesEl = context.refs.messages;
    if (messagesEl) {
      messagesEl.scrollTop = height.value;
      scrollUpdate();
    }
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

  /*
  RESIZE
   */

  const resizeUpdate = () => {
    resizeThrottle = null;
    const messagesEl = context.refs.messages;
    if (messagesEl) {
      top.value = Math.round(messagesEl.scrollTop);
      height.value = Math.round(messagesEl.scrollHeight - messagesEl.clientHeight);
      viewportHeight.value = Math.round(messagesEl.clientHeight);
    }
    if (keepScrollBottom[props.chatId]) {
      messagesEl.scrollTop = height.value;
      top.value = height.value;
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
  SAVE
   */

  let lastHeight;

  const saveHeight = () => {
    const messagesEl = context.refs.messages;
    if (messagesEl) {
      lastHeight = Math.round(messagesEl.scrollHeight - messagesEl.clientHeight);
    }
  };

  const restoreScrollTop = () => {
    if (keepScrollBottom[props.chatId]) return;

    const messagesEl = context.refs.messages;
    if (messagesEl) {
      const newHeight = Math.round(messagesEl.scrollHeight - messagesEl.clientHeight);
      messagesEl.scrollTop += (newHeight - lastHeight);
      scrollUpdate();
    }
  };

  /*
  EXPORT
   */

  return {
    viewportHeight,
    height,
    top,
    onMessagesScroll,
    saveScrollPosition,
    restoreScrollPosition,
    scrollToNew,
    scrollToNewInstant,
    scrollToBottomInstant,
    saveHeight,
    restoreScrollTop,
  };
}

export default scrollTracking;

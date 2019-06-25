<template lang="pug">

  mixin chatMessagesList()
    hr.day
    .day-separator
      .text {{ getDayText(key) | capitalize }}

    template(v-for="message, i in day")

      .unread-container(v-if="firstUnreadMessageId === message.id")
        hr.unread(ref="unread")
        .unread-separator(:class="{ rised: i === 0 }" )
          .text new

      message-display(:message="message" :key="message.id" :class="message.classList")

  .messages-container.scrollbar-style(
    ref="messages"
    :class="{ replyActive, limitContainerWidth }"
    @scroll="onMessagesScroll"
  )

    .messages(ref="messagesInner")

      .day(v-for="day, key in messagesByDay[0]")
        +chatMessagesList()

      .load-more-container
        btn.button.load-more(v-if="hasOlderMessages" :action="() => { loadMessages(chatId); }" :loading="isLoadingMessages") Load older messages

      .day(v-for="day, key in messagesByDay[1]")
        +chatMessagesList()

      message-display(v-for="user in chatMembersWriting" :writing-user="user")

      template(v-if="messages.length === 0")
        message-display(v-for="i in 3" :style="{ opacity: 1 - (i*.2) }")

</template>

<script>
  import ResizeObserver from "resize-observer-polyfill";
  import { value, onMounted, onUnmounted } from "vue-function-api";
  import { SCROLL_DEBOUNCE_TIME } from "@/js/consts";

  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  const MESSAGE_PAGE_SIZE = 15;

  function scrollTracking(props, context) {
    const height = value(0);
    const top = value(0);

    const lastScrollTop = {};
    const saveScrollPosition = (chatId) => { lastScrollTop[chatId] = top.value; };
    const restoreScrollPosition = (chatId) => {
      if (typeof lastScrollTop[chatId] === "undefined") return;
      const messagesEl = context.refs.messages;
      setTimeout(() => { if (messagesEl) messagesEl.scrollTop = lastScrollTop[chatId]; }, 0);
    };

    const scrollToNew = () => {
      const unreadSepEl = context.refs.unread?.[0];
      unreadSepEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const scrollToNewOrBottomInstant = () => {
      const unreadSepEl = context.refs.unread?.[0];
      if (unreadSepEl) {
        unreadSepEl.scrollIntoView({ block: "start" });
      } else {
        const messagesEl = context.refs.messages;
        if (messagesEl) messagesEl.scrollTop = height.value;
      }
    };

    const chatFirstScrollDone = {};
    const keepScrollBottom = {};

    const markChatAsNew = (chatId) => {
      chatFirstScrollDone[chatId] = false;
      keepScrollBottom[chatId] = true;
      height.value = 0;
      top.value = 0;
    };

    let throttleTimeout = null;
    const scrollUpdate = () => {
      throttleTimeout = null;
      const messagesEl = context.refs.messages;
      if (messagesEl) {
        top.value = Math.round(messagesEl.scrollTop);
        height.value = Math.round(messagesEl.scrollHeight - messagesEl.clientHeight);
      }
      if (!chatFirstScrollDone[props.chatId] && height.value > 0) {
        setTimeout(scrollToNewOrBottomInstant, 0);
        chatFirstScrollDone[props.chatId] = true;
      }
    };

    const onMessagesScroll = () => {
      if (!throttleTimeout) throttleTimeout = setTimeout(scrollUpdate, SCROLL_DEBOUNCE_TIME);
    };

    const messagesObs = new ResizeObserver(onMessagesScroll);
    onMounted(() => {
      if (context.refs.messagesInner) messagesObs.observe(context.refs.messagesInner);
    });

    onUnmounted(() => {
      clearTimeout(throttleTimeout);
      messagesObs.disconnect();
    });

    return {
      onMessagesScroll,
      markChatAsNew,
      saveScrollPosition,
      restoreScrollPosition,
      scrollToNew,
    };
  }

  export default {
    name: "ChatMainbarMessageList",
    components: { MessageDisplay },
    props: {
      chatId: Number,
      replyToId: Number,
      chatMembersWriting: Array,
    },
    data() {
      return {
        lastLoadedMessageId: {},
        canLoadMore: {},
        messagesLoading: {},
        firstUnread: {},
      };
    },
    computed: {
      replyActive() {
        return !!this.replyToId;
      },
      limitContainerWidth() {
        this.$store.flows.userProperties.v;

        return !this.$flows.settings.getBooleanUserProp("compactMode");
      },
      startNextLoadFromId() {
        return this.lastLoadedMessageId[this.chatId];
      },
      hasOlderMessages() {
        return this.canLoadMore[this.chatId];
      },
      isLoadingMessages() {
        return this.messagesLoading[this.chatId];
      },
      messages() {
        if (!this.chatId) return [];
        this.$store.flows.messages[this.chatId].v;

        return this.$store.flows.messages[this.chatId].d.map((message, index, array) => {
          message.classList = [];

          if (this.replyToId === message.id) message.classList.push("message-highlight");
          if (message.unread) message.classList.push("message-unread");

          if (index > 0) {
            const prevMessage = array[index - 1];
            const sameUser = prevMessage.userId === message.userId;
            if (sameUser) {
              const sameDay = this.utils.datesAreSameDay(message.createDate, prevMessage.createDate);
              if (sameDay) message.classList.push("noauthor");
            }
          }

          return message;
        });
      },
      messagesLoadSpilit() {
        const splitIndex = this.messages.findIndex(message => message.id >= this.startNextLoadFromId);
        return [
          this.messages.slice(0, splitIndex),
          this.messages.slice(splitIndex, this.messages.length),
        ];
      },
      messagesByDay() {
        const byDay = [{}, {}];
        [0, 1].forEach((i) => {
          this.messagesLoadSpilit[i].forEach((message) => {
            const day = message.createDate - (message.createDate % (24 * 60 * 60 * 1000));
            if (byDay[i][day]) {
              byDay[i][day].push(message);
            } else {
              byDay[i][day] = [message];
            }
          });
        });
        return byDay;
      },
      autoReadEnabled() {
        this.$store.flows.userProperties.v;

        return this.$flows.settings.getBooleanUserProp("autoMarkAsRead");
      },
      firstUnreadMessageId() {
        if (!this.chatId) return -1;

        if (this.firstUnread[this.chatId] && this.autoReadEnabled) return this.firstUnread[this.chatId];

        const firstUnreadMessage = this.messages.find(message => message.unread);
        if (!firstUnreadMessage) return -1;

        return firstUnreadMessage.id;
      },
    },
    watch: {
      chatId: {
        immediate: true,
        handler(chatId, oldChatId) {
          if (oldChatId) this.saveScrollPosition(oldChatId);

          if (!chatId || chatId === oldChatId) return;

          this.$flows.messages.getChatReadAndFlagged(chatId);
          this.restoreScrollPosition(chatId);

          if (!this.lastLoadedMessageId[chatId]) {
            this.loadMessages(chatId);
            this.$flows.messages.getChatMessages(chatId, { sticky: true });
          }
        },
      },
      firstUnreadMessageId: {
        immediate: true,
        handler(unreadId) {
          if (unreadId > 0 && this.autoReadEnabled) {
            this.firstUnread[this.chatId] = unreadId;
          }
        },
      },
    },
    methods: {
      async loadMessages(chatId) {
        try {
          this.$set(this.messagesLoading, chatId, true);
          const filter = this.lastLoadedMessageId[chatId] ? { amount: MESSAGE_PAGE_SIZE, from: { id: this.lastLoadedMessageId[chatId] - 1 } } : { amount: MESSAGE_PAGE_SIZE };

          const messagesLoaded = await this.$flows.messages.getChatMessages(chatId, filter);

          if (messagesLoaded.length) {
            if (!this.lastLoadedMessageId[chatId]) {
              this.markChatAsNew(chatId);
            }
            this.$set(this.lastLoadedMessageId, chatId, messagesLoaded[0].id);
          }

          this.$set(this.canLoadMore, chatId, (messagesLoaded.length >= MESSAGE_PAGE_SIZE));
        } finally {
          this.$set(this.messagesLoading, chatId, false);
        }
      },
      getDayText(day) {
        const date = +day;
        if (this.utils.datesAreSameDay(date, Date.now())) {
          return `Today, ${this.utils.shortDate(date)}`;
        }
        if (this.utils.datesAreSameDay(date, this.utils.dayjsDate().subtract(1, "day"))) {
          return `Yesterday, ${this.utils.shortDate(date)}`;
        }
        return this.utils.weekdayDateAddOtherYear(date);
      },
    },
    setup(props, context) {
      return { ...scrollTracking(props, context) };
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .messages-container
    flex 1
    overflow-y scroll
    background $color-light-gray-background

    &.limitContainerWidth
      .messages
        max-width 850px
        margin 0 auto !important
        box-shadow 0 0 0 2px alpha(#000, 0.05)
        transform translate3d(0px, 0px, 0px)

      .typing
        padding 20px 20px 0

    &.replyActive
      .day-separator,
      .unread-separator
        &::before
          background $color-gray-border

        .text
          background $color-light-gray-background
          color $color-gray-text

      & /deep/ .chat-message:not(.message-highlight)
        background none !important

        .avatar
          filter saturate(0)
          opacity 0.5

        .content-container
          color $color-gray-text
          filter saturate(0)

    .typing
      color $color-gray-text
      margin 10px 20px 0 65px

  .messages
    padding 20px 0
    position relative
    background #fff
    min-height 100%
    // overflow hidden  todo: breaks sticky

    .load-more-container
      margin 10px 0

      &:first-child
        margin-top -20px

    .button.load-more
      display block
      width 100%
      margin 0
      border-radius 0
      border none
      height 40px
      text-bold-16()
      background $color-light-blue-background

      &:hover,
      &:focus
        background darken($color-light-blue-background, 2)

  .day
    position relative

  hr.day,
  hr.unread
    position absolute
    top -11px
    left 0
    right 0

  hr.unread
    background lighten($color-red, 20)

  .unread-container
    position relative
    top -2px

  .day-separator,
  .unread-separator
    position relative
    z-index 10
    margin 10px 0

    .text
      display inline-block
      padding 2px 10px
      text-bold-13()
      background #fff
      border-radius $border-radius
      z-index 1
      position relative
      box-shadow 0 0 0 2px alpha(#000, .05)

  .day-separator
    position sticky
    top -4px
    text-align center

    .text
      color $color-blue

  .unread-separator
    text-align center

    &.rised
      text-align right
      margin-top -32px

      .text
        margin 0 20px

    .text
      background $color-red
      color #fff
      position relative
      top -1px
      box-shadow none


</style>

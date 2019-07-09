<template lang="pug">

  mixin chatMessagesList()
    .day-separator-line
      hr.day
    .day-separator
      .text {{ getDayText(key) | capitalize }}

    template(v-for="message, i in day")

      .unread-container(v-if="firstUnreadMessageId === message.id" ref="unread")
        hr.unread
        .unread-separator(:class="{ rised: i === 0 }" )
          .text new

      message(
        :message="message"
        :replyToId="replyToId"
        :classList="message.classList"
        :key="message.id"
        :ref="'message-' + message.id"
      )

  .messages-container.scrollbar-style(
    ref="messages"
    :class="{ replyActive, limitContainerWidth }"
    @scroll="onMessagesScroll"
  )

    slide-in-out(:outDuration="0")
      btn.button-reset.new-shortcut(v-if="showNewShortcut" :action="scrollToNew")
        span.icon.is-small(style="position: relative; left: -3px;")
          i.fas.fa-arrow-up
        | UNREAD

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

  import SlideInOut from "@/components/UI/SlideInOut.vue";
  import Message from "@/components/Message/Message.vue";
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  const MESSAGE_PAGE_SIZE = 50;

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

  export default {
    name: "ChatMainbarMessageList",
    components: { Message, SlideInOut, MessageDisplay },
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

        return this.$store.flows.messages[this.chatId].d
          .filter(message => !message.parentTopicItemId)
          .map((message, index, array) => {
            message.classList = [];

            if (this.replyToId === message.id) message.classList.push("message-highlight");
            if (message.unread) message.classList.push("message-unread");
            if (message.shadow) message.classList.push("message-shadow");
            if (message.error) message.classList.push("message-error");

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
            const day = +(new Date(this.utils.dayjsDate(message.createDate).format("YYYY MM DD")));
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

        if (this.firstUnread[this.chatId] && this.autoReadEnabled) {
          if (this.messages.find(message => message.id === this.firstUnread[this.chatId])) {
            return this.firstUnread[this.chatId];
          }
        }

        const firstUnreadMessage = this.messages.find(message => message.unread);
        if (!firstUnreadMessage) return -1;

        return firstUnreadMessage.id;
      },
    },
    asyncComputed: {
      showNewShortcut: {
        async get() {
          if (this.firstUnreadMessageId <= 0) return false;
          this.top;
          await this.$nextTick();

          const unread = this.$refs.unread && this.$refs.unread[0];
          if (unread) return (this.top - unread.offsetTop) > 100;
          return false;
        },
        default: false,
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
      messages: {
        handler() {
          if (this.autoReadEnabled && this.messages.find(message => message.unread)) {
            this.$flows.messages.markMessagesAsRead(
              this.messages.filter(message => message.unread).map(message => message.id),
              this.chatId,
            );
          }
        },
      },
    },
    mounted() {
      this.$events.$on("editMessage", (messageId) => {
        const message = this.$refs[`message-${messageId}`]?.[0];
        if (message) {
          setTimeout(() => {
            message.$el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 10);
          message.openEdit();
        }
      });
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

  .day-separator-line
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
    text-align right

    &.rised
      margin-top -32px

    .text
      margin 0 20px
      background $color-red
      color #fff
      position relative
      top -1px
      box-shadow none

  .new-shortcut
    width auto
    box-shadow 0 0 0 2px alpha(#000, .05)
    position fixed
    top 56px
    right 28px
    z-index 23
    text-bold-13()
    color $color-red
    background #fff
    padding 7px 10px
    border-bottom-left-radius $border-radius
    border-bottom-right-radius $border-radius

    &:hover
      box-shadow 0 0 0 2px alpha(#000, .15)

</style>

<style lang="stylus">
  @import "~@/shared.styl"
  $verticalPadding = 12px

  .limitContainerWidth .chat-message
    padding $verticalPadding 30px !important

    &.message-highlight
      padding $verticalPadding 17px !important

    @media (max-width $media-sidebar-hide)
      padding $verticalPadding 20px !important

    p
      line-height 1.6

</style>

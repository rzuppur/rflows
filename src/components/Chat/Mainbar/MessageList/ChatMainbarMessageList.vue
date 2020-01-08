<template lang="pug">

  mixin chatMessagesList()
    .day-separator-line
      hr.day
    .day-separator
      .text {{ getDayText(key) | capitalize }}

    template(v-for="message, i in day")

      .unread-container(v-if="firstUnreadMessageId === message.id" ref="unread")
        hr.unread
        .unread-separator(:class="{ rised: i === 0 }")
          .text new
      .loaded-container(v-else-if="prevLoadSeparatorId === message.id" ref="loaded")
        hr.loaded
        .loaded-separator(:class="{ rised: i === 0 }")
          .text loaded

      message(
        :message="message"
        :replyToId="replyToId"
        :classList="message.classList"
        :key="message.id"
        :ref="'message-' + message.id"
      )

  .messages-container.r-elevation-2(
    ref="messages"
    :class="{ replyActive, limitContainerWidth, 'r-styled-scrollbar': !mqMobile }"
    @scroll="onMessagesScroll"
  )

    .messages.r-elevation-3(ref="messagesInner")

      .text-center.margin-top-large.margin-bottom-large(v-if="chatId && !isLoadingMessages && !hasOlderMessages && messages.length !== 0")
        .title-4 🌴 ⛵
          .margin-top-tiny Chat created
        .text-small.text-color-quiet(v-if="chatWorkspaceLocation") {{ utils.fullDate(chatWorkspaceLocation.createDate) }}

      .day(v-for="day, key in messagesByDay[0]")
        +chatMessagesList()

      .load-more-container(v-if="hasOlderMessages")
        r-button.load-more-button(fullwidth primary :action="() => { loadMessages(chatId); }" :loading="isLoadingMessages") Load older messages

      .day(v-for="day, key in messagesByDay[1]")
        +chatMessagesList()

      message-display(v-for="user in chatMembersWriting" :writing-user="user" :key="user.id")

      template(v-if="!chatId || isLoadingMessages && messages.length === 0")
        message-display(v-for="i in 3" :style="{ opacity: 1 - (i*.2) }" :key="'skeleton-message-' + i")

      .text-center.margin-top-large(v-else-if="chatId && messages.length === 0")
        .title-4 📭 🐢
          .margin-top-tiny No messages
        .text-small.text-color-quiet(v-if="chatWorkspaceLocation") Created on {{ utils.fullDate(chatWorkspaceLocation.createDate) }}

    portal(to="scrollToShortcuts")

      r-button(v-if="!scrolledToBottom" ref="bottombutton" borderless v-rtip.bottom="'Scroll to bottom'" :action="() => { $events.$emit('MESSAGELIST_scrollToBottomInstant'); }" label="Scroll to bottom" icon="arrow down" icon-color="blue")

      r-button(v-if="showNewShortcut" ref="newbutton" borderless v-rtip.bottom="'Scroll to new'" :action="scrollToNewInstant" label="Scroll to new" icon="new message" icon-color="red")

</template>

<script>
  import SlideInOut from "@/components/UI/SlideInOut.vue";
  import Message from "@/components/Message/Message.vue";
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  import scrollTracking from "./ChatMainbarMessageListScrollTracking";

  const MESSAGE_PAGE_SIZE = 40;

  export default {
    name: "ChatMainbarMessageList",
    components: { Message, SlideInOut, MessageDisplay },
    props: {
      chatId: Number,
      chatMembersWriting: Array,
    },
    data() {
      return {
        lastLoadedMessageId: {},
        prevLastLoadedMessageId: {},
        canLoadMore: {},
        messagesLoading: {},
        firstUnread: {},
      };
    },
    computed: {
      replyToId() {
        return this.$store.currentChatReplyToId;
      },
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
      prevLoadSeparatorId() {
        return this.prevLastLoadedMessageId[this.chatId];
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
              const prevNotEmail = prevMessage.type !== "EMAIL";
              if (sameUser && prevNotEmail) {
                const sameDay = this.utils.datesAreSameDay(message.createDate, prevMessage.createDate);
                if (sameDay) message.noauthor = true;
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
        const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
        [0, 1].forEach((i) => {
          this.messagesLoadSpilit[i].forEach((message) => {
            const timezoneDate = message.createDate - timezoneOffset;
            const day = timezoneDate - (timezoneDate % (24 * 60 * 60 * 1000));
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

        this.$store.flows.messagesRead.v;
        if (!this.$store.flows.messagesRead.d.find(messagesRead => messagesRead.chatId === this.chatId)) return -1;

        if (this.firstUnread[this.chatId] && this.autoReadEnabled) {
          if (this.messages.find(message => message.id === this.firstUnread[this.chatId])) {
            return this.firstUnread[this.chatId];
          }
        }

        const firstUnreadMessage = this.messages.find(message => message.unread);
        if (!firstUnreadMessage) return -1;

        return firstUnreadMessage.id;
      },
      scrolledToBottom() {
        return this.top >= this.height;
      },
      chatWorkspaceLocation() {
        this.$store.flows.chatWorkspaces.v;

        return this.$store.flows.chatWorkspaces.d.find(chatWorkspace => chatWorkspace.chatId === this.chatId);
      },
    },
    asyncComputed: {
      showNewShortcut: {
        async get() {
          if (this.firstUnreadMessageId <= 0) return false;
          // if (this.autoReadEnabled) return false;

          // this.top;
          // this.viewportHeight;
          // await this.$nextTick();

          const unread = this.$refs.unread && this.$refs.unread[0];
          if (!unread) return false;

          // const offset = this.top - unread.offsetTop;
          // return offset > 100 || offset < -this.viewportHeight;

          return true;
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
          this.prevLastLoadedMessageId = {}; // clear load marker on chat change

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
          if (this.autoReadEnabled && this.messages.find(message => message.unread) && this.$store.flows.messagesRead.d.find(messagesRead => messagesRead.chatId === this.chatId)) {
            this.$flows.messages.markMessagesAsRead(
              this.messages.filter(message => message.unread).map(message => message.id),
              this.chatId,
            );
          }

          this.saveHeight();
          this.$nextTick(this.restoreScrollTop);
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
      this.$events.$on("scrollToMessage", messageId => this.scrollToMessage(messageId));
    },
    methods: {
      scrollToMessage(messageId) {
        const message = this.$refs[`message-${messageId}`]?.[0];
        if (!message?.$el) return;

        message.$el.scrollIntoView({ behavior: "smooth", block: "start" });
        message.highlight();
      },
      async loadMessages(chatId) {
        const isFirstLoad = !this.lastLoadedMessageId[chatId];
        if (isFirstLoad) this.scrollToBottomInstant();

        try {
          this.$set(this.messagesLoading, chatId, true);

          const filter = isFirstLoad ? { amount: MESSAGE_PAGE_SIZE } : { amount: MESSAGE_PAGE_SIZE, from: { id: this.lastLoadedMessageId[chatId] - 1 } };
          const messagesLoaded = await this.$flows.messages.getChatMessages(chatId, filter);

          if (messagesLoaded.length) {
            this.$set(this.prevLastLoadedMessageId, chatId, this.lastLoadedMessageId[chatId]);
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
          return "Today";
        }
        if (this.utils.datesAreSameDay(date, this.utils.dayjsDate().subtract(1, "day"))) {
          return "Yesterday";
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
    min-height 100%

    .load-more-container
      margin 10px 0

      &:first-child
        margin-top -20px

    .load-more-button
      margin 20px 0
      border-radius 0

  .day-separator-line
    position relative

  hr.day,
  hr.unread,
  hr.loaded
    position absolute
    top 13px
    left 0
    right 0
    margin 0

  hr.unread
    #app &
      background lighten($color-red, 20)

    #app.darkMode &
      background desaturate($color-red, 40%)

  hr.loaded
    #app &
      background desaturate(lighten($color-focus-blue, 40), 50)

    #app.darkMode &
      background desaturate($color-focus-blue, 50%)

  .unread-container
    position relative
    top -2px

  .loaded-container
    position relative
    top -3px

  .day-separator,
  .unread-separator,
  .loaded-separator
    position relative
    z-index 10
    margin 10px 0
    pointer-events none

    .text
      display inline-block
      padding 2px 10px
      font-sans($font-size-small, $font-weight-sans-bold)
      background #fff
      border-radius $border-radius
      z-index 1
      position relative
      box-shadow 0 0 0 2px alpha(#000, .05)

      .darkMode &
        background $color-background-3-darkmode
        color #45a8ec
        box-shadow 0 0 0 2px alpha(#fff, 7%)

  .day-separator
    position sticky
    top -4px
    text-align center

    .text
      color $color-blue

  .unread-separator,
  .loaded-separator
    text-align right

    &.rised
      margin-top -32px

    .text
      margin 0 20px
      background $color-red
      color #fff
      position relative
      box-shadow none

      .darkMode &
        background $color-red
        color #fff
        box-shadow none

  .loaded-separator .text
    background $color-focus-blue

    .darkMode &
      background $color-focus-blue

</style>

<style lang="stylus">
  @import "~@/shared.styl"
  $verticalPadding = 12px

  .limitContainerWidth .chat-message

    &.message-highlight
      padding $verticalPadding 17px !important

</style>

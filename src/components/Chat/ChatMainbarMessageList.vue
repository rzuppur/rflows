<template lang="pug">

  .messages-container.scrollbar-style(
    ref="messages"
    :class="{ replyActive, limitContainerWidth }"
    @scroll="scrollTrack"
  )

    .messages

      .day(v-for="day, key in messagesByDay[0]")
        .day-separator
          .text {{ utils.weekdayDateAddOtherYear(+key) | capitalize }}

        template(v-for="message, i in day")
          message-display(:message="message" :key="message.id" :class="message.classList")

      .load-more-container
        btn.button.load-more(v-if="true || hasOlderMessages" :action="() => { loadMessages(chatId); }" :loading="isLoadingMessages") Load older messages

      .day(v-for="day, key in messagesByDay[1]")
        .day-separator
          .text {{ utils.weekdayDateAddOtherYear(+key) | capitalize }}

        template(v-for="message, i in day")
          message-display(:message="message" :key="message.id" :class="message.classList")


</template>

<script>

  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  const MESSAGE_PAGE_SIZE = 15;

  export default {
    name: "ChatMainbarMessageList",
    components: { MessageDisplay },
    props: {
      chatId: Number,
      replyToId: Number,
    },
    data() {
      return {
        lastLoadedMessageId: {},
        canLoadMore: {},
        messagesLoading: {},
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
    },
    watch: {
      chatId: {
        immediate: true,
        handler(chatId, oldChatId) {
          if (!chatId || chatId === oldChatId) return;
          this.$flows.messages.getChatReadAndFlagged(chatId);
          if (!this.lastLoadedMessageId[chatId]) {
            this.loadMessages(chatId);
            this.$flows.messages.getChatMessages(chatId, { sticky: true });
          }
        },
      },
    },
    methods: {
      scrollTrack() {
        // console.log("todo: scrollTrack");
      },
      async loadMessages(chatId) {
        try {
          this.$set(this.messagesLoading, chatId, true);
          const filter = this.lastLoadedMessageId[chatId] ? { amount: MESSAGE_PAGE_SIZE, from: { id: this.lastLoadedMessageId[chatId] - 1 } } : { amount: MESSAGE_PAGE_SIZE };
          const messagesLoaded = await this.$flows.messages.getChatMessages(chatId, filter);
          if (messagesLoaded.length) {
            this.$set(this.lastLoadedMessageId, chatId, messagesLoaded[0].id);
          }
          this.$set(this.canLoadMore, chatId, (messagesLoaded.length >= MESSAGE_PAGE_SIZE));
        } finally {
          this.$set(this.messagesLoading, chatId, false);
        }
      },
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
    overflow hidden

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

  .day-separator,
  .unread-separator
    position relative
    margin-top 10px

    &:before
      content ""
      position absolute
      left 0
      right 0
      top 12px
      height 2px
      z-index 0

    .text
      display inline-block
      padding 0 10px
      text-bold-13()
      background #fff
      z-index 1
      position relative

  .day-separator
    text-align center

    &:before
      background #eee

    .text
      color $color-blue

  .unread-separator
    text-align center

    &:before
      background $color-red

    &.rised
      text-align right
      margin-top -24px

      .text
        margin 0 15px

    .text
      color $color-red-text
      position relative
      top -1px



</style>

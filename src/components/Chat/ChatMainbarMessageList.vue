<template lang="pug">

  .messages-container.scrollbar-style(
    ref="messages"
    :class="{ replyActive, limitContainerWidth }"
    @scroll="scrollTrack"
  )

    .messages

      message-display(v-for="message in messagesBeforeLoad" :message="message" :key="message.id")

      .load-more-container
        btn.button.load-more(v-if="hasOlderMessages" :action="() => { loadMessages(chatId); }" :loading="isLoadingMessages") Load older messages

      message-display(v-for="message in messagesAfterLoad" :message="message" :key="message.id")

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
        this.$store.flows.messages[this.chatId].v;

        return this.$store.flows.messages[this.chatId].d;
      },
      messagesBeforeLoad() {
        const splitIndex = this.messages.findIndex(message => message.id >= this.startNextLoadFromId);
        return this.messages.slice(0, splitIndex);
      },
      messagesAfterLoad() {
        const splitIndex = this.messages.findIndex(message => message.id >= this.startNextLoadFromId);
        return this.messages.slice(splitIndex, this.messages.length);
      },
    },
    watch: {
      chatId: {
        immediate: true,
        handler(chatId, oldChatId) {
          if (!chatId || chatId === oldChatId) return;
          this.$flows.chats.getChatReadAndFlagged(chatId);
          if (!this.lastLoadedMessageId[chatId]) {
            this.loadMessages(chatId);
            this.$flows.chats.getChatMessages(chatId, { sticky: true });
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
          const messagesLoaded = await this.$flows.chats.getChatMessages(chatId, filter);
          if (messagesLoaded.length) {
            this.$set(this.lastLoadedMessageId, chatId, messagesLoaded[0].id);
          }
          this.$set(this.canLoadMore, chatId, (messagesLoaded.length >= MESSAGE_PAGE_SIZE));;
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
        overflow-x hidden
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


</style>

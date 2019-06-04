<template lang="pug">

  .messages-container.scrollbar-style(
    ref="messages"
    :class="{ replyActive, limitContainerWidth }"
    @scroll="scrollTrack"
  )

    .messages

      message-display(v-for="i in 10")

</template>

<script>

  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  export default {
    name: "ChatMainbarMessageList",
    components: { MessageDisplay },
    props: {
      chatId: Number,
      replyToId: Number,
    },
    data() {
      return {
        messages: [],
        allMessagesLoaded: false,
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
    },
    watch: {
      chatId: {
        immediate: true,
        async handler(chatId, oldChatId) {
          if (!chatId || chatId === oldChatId) return;
          this.messages = [];

          this.$flows.chats.getChatReadAndFlagged(chatId);
          const messagesLoaded = await this.$flows.chats.getChatMessages(chatId, null);
          console.log(messagesLoaded);

          // TODO: load X items, if got < X then no old messages, else load new when scrolled up
          // store oldest chatmessage got without sticky, use id for next page
        },
      },
    },
    methods: {
      scrollTrack() {
        // console.log("todo: scrollTrack");
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

</style>

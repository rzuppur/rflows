<template lang="pug">

  .message-preview(
    @click="scrollToMessage"
    @keyup.enter="e => e.target.click()"
    :class="{ clickable }"
    :tabindex="clickable ? 0 : -1"
  )

    .date(v-if="!message") Message not loaded

    template(v-else)

      .name {{ authorName }}
      .date {{ utils.fullDateAddOtherYear(message.createDate) }}
      .message-content.note-content.clamped(v-html="messageText")

</template>

<script>

  export default {
    name: "MessagePreview",
    props: {
      messageId: Number,
      chatId: Number,
      clickable: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        messageLoading: null,
      };
    },
    computed: {
      message() {
        this.$store.flows.messages[this.chatId].v;

        return this.$store.flows.messages[this.chatId].d.find(message => message.id === this.messageId);
      },
      author() {
        this.$store.flows.users.v;

        return this.$store.flows.users.d.find(user => user.id === this.message.userId);
      },
      authorName() {
        return this.$flows.utils.getFullNameFromUser(this.author);
      },
      messageText() {
        if (this.message) {
          if (this.message.type === "EMAIL") {
            return `✉ ${this.message.subject}\n👤 ${this.message.from.name} &lt;${this.message.from.address}&gt;`;
          }
          if (this.message.type === "NOTE") {
            return this.$flows.messages.getMessageTextRepresentation(this.message.text);
          }
          return this.$flows.messages.chatTextParse(this.message.text);
        }
        return "";
      },
    },
    watch: {
      messageId: {
        immediate: true,
        async handler(newMessageId) {
          if (newMessageId && !this.message && this.messageLoading !== newMessageId) {
            this.messageLoading = newMessageId;
            await this.$flows.messages.getChatMessages(+this.chatId, { amount: 1, from: { id: newMessageId } });
            this.messageLoading = null;
          }
        },
      },
    },
    methods: {
      scrollToMessage() {
        if (this.clickable && this.message) this.$events.$emit("scrollToMessage", this.message.id);
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .message-preview
    padding 5px 20px 5px 10px
    transition all 0.1s
    background alpha($color-light-blue-background, 0.6)
    border-radius $border-radius

    &.clickable
      &:hover,
      &:focus
        background darken($color-light-blue-background, 1)
        outline none

    &.sidebar-saved
      margin-bottom 7px

    &.reply-original
      border-left 4px solid #71aee3

      &:focus
        .name,
        .date
          text-decoration underline

    .name,
    .date
      display inline-block
      font-sans($font-size-small)

    .name
      font-sans($font-size-small, $font-weight-sans-bold)
      margin-right 5px

    .date
      color $color-gray-text

    .expand-toggle
      font-sans($font-size-small)
      margin-left 6px
      user-select none

    .message-content
      margin-top -2px
      margin-bottom 2px
      white-space pre-line

      &.clamped
        overflow hidden
        text-overflow ellipsis
        white-space nowrap

        @supports (-webkit-line-clamp: 2)
          white-space pre-line
          display -webkit-box
          -webkit-box-orient vertical
          -webkit-line-clamp 2

</style>

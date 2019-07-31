<template lang="pug">

  .message-preview(
    @click="scrollToMessage"
    @keyup.enter="e => e.target.click()"
    :class="{ clickable, superCompact }"
    :tabindex="clickable ? 0 : -1"
    v-tooltip.left="{ content: tooltipText, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }"
  )

    template(v-if="superCompact")
      .has-text-grey.text-small.has-text-centered
        span.icon.small.has-text-info(style="margin-left: -5px; margin-right: -4px;")
          i.fas.fa-thumbtack
        | {{ initials }}

    template(v-else)

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
      superCompact: {
        type: Boolean,
        default: false,
      },
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
            return `✉ ${this.message.subject}\n${this.message.from.address}`;
          }
          if (this.message.type === "NOTE") {
            return this.$flows.messages.getMessageTextRepresentation(this.message.text);
          }
          return this.$flows.messages.chatTextParse(this.message.text);
        }
        return "";
      },
      tooltipText() {
        if (!this.superCompact || !this.message) return null;
        //return `${this.flows.getFullName(this.message.creatorUserId)}: ${this.messageText.substring(0, 30)}...`;
      },
      initials() {
        //const name = this.flows.getFullName(this.message.creatorUserId);
        //return name.charAt(0) + name.split(" ")[1].charAt(0);
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
      cursor pointer

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

    &.superCompact
      padding 5px 0

    .name,
    .date
      display inline-block
      text-regular-13()

    .name
      text-bold-13()
      margin-right 5px

    .date
      color $color-gray-text

    .expand-toggle
      text-regular-13()
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

<template lang="pug">
  .message-preview(@click="scrollToMessage()" @keyup.enter="e => e.target.click()" :class="{ clickable: clickable }" :tabindex="clickable ? 0 : -1")
    .name(v-if="!message") ?
    template(v-else)
      .name
        | {{ flows.getFullName(message.creatorUserId) }}
      .date {{ utils.fullDateAddOtherYear(message.createDate) }}
      a.expand-toggle(v-if="!clickable && clamped && !expanded" @click="toggleClamp()") View more
      .message-content.note-content(:class="{ clamped: !expanded }" ref="text" v-html="messageText")
</template>

<script>

  export default {
    name: "MessagePreview",
    props: {
      messageId: Number,
      clickable: {
        type: Boolean,
        default: true,
      },
    },
    data: function () {
      return {
        expanded: false,
      };
    },
    computed: {
      message() {
        return this.flows.getChatMessage(this.messageId);
      },
      messageText() {
        if (this.message) {
          if (this.message.type === "EMAIL") {
            return "✉ " + this.message.subject + "\n" + this.message.from.address;
          } else if (this.message.type === "NOTE") {
            return this.getTextRepresentation(this.message.text);
          } else {
            return this.getTextRepresentation(this.flows.chatTextParse(this.message.text));
          }
        }
      },
      clamped() {
        if (this.messageText && this.$refs.text) {
          return this.$refs.text.offsetHeight < this.$refs.text.scrollHeight
              || this.$refs.text.offsetWidth  < this.$refs.text.scrollWidth;
        }
      },
    },
    methods: {
      getTextRepresentation(text) {
        return text
          .replace(/<img .*?alt=[\"']?([^\"']*)[\"']?.*?\/?>/g, "$1")
          .replace(/<a .*?href=["']?([^"']*)["']?.*?>(.*)<\/a>/g, "$2")
          .replace(/<(\/p|\/div|\/h\d|br)\w?\/?>/g, "\n")
          .replace(/<[A-Za-z/][^<>]*>/g, "")
          .replace(/&quot/g, '"');
      },
      scrollToMessage() {
        if (this.clickable && this.message) this.eventBus.$emit("scrollToMessage", this.message.id);
      },
      toggleClamp() {
        this.expanded = !this.expanded;
      },
    }
  }
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

        @supports (-webkit-line-clamp: 3)
          white-space pre-line
          display -webkit-box
          -webkit-box-orient vertical
          -webkit-line-clamp 3

</style>

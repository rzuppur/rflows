<template lang="pug">
  .message-preview(@click="scrollToMessage()" :class="{ clickable: clickable }")
    .name(v-if="!message") ?
    template(v-else)
      .name
        | {{ flows.getFullName(message.creatorUserId) }}
      .date {{ utils.fullDateAddOtherYear(message.createDate) }}
      a.expand-toggle(v-if="!clickable && clamped && !expanded" @click="toggleClamp()") View more
      .message-content.note-content(v-clampy="clamp" ref="text") {{ messageText }}
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
        if (this.message && this.$refs.text) {
          const text = this.$refs.text.innerText;
          return text.slice(-1) === "…";
        }
      },
      clamp() {
        return this.expanded ? 0 : 2;
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

    &.clickable:hover
      background darken($color-light-blue-background, 1)

    &.sidebar-saved
      margin-bottom 7px

    &.reply-original
      border-left 4px solid #71aee3

    .name, .date
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
      overflow hidden
      white-space pre-line
</style>

<template lang="pug">

  .message-preview(
    @click="scrollToMessage()"
    @keyup.enter="e => e.target.click()"
    :class="{ clickable: clickable, superCompact: superCompact }"
    :tabindex="clickable ? 0 : -1"
    v-tooltip.left="{ content: (superCompact && message) ? flows.getFullName(message.creatorUserId) + ': ' + messageText.substring(0, 30) + '...' : null, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }"
  )
    template(v-if="superCompact")
      .has-text-grey-light.text-small.has-text-centered
        span.icon.small(style="margin-left: -5px; margin-right: -4px;")
          i.fas.fa-thumbtack
        | {{ flows.getFullName(message.creatorUserId).charAt(0) + flows.getFullName(message.creatorUserId).split(" ")[1].charAt(0) }}

    template(v-else)
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
      superCompact: {
        type: Boolean,
        default: false,
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
            return this.flows.getMessageTextRepresentation(this.message.text);
          } else {
            return this.flows.getMessageTextRepresentation(this.flows.chatTextParse(this.message.text));
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

<template lang="pug" functional>

  .chat(
    :class="[data.staticClass, { unread: !!props.chat.unread, active: props.chat.id === props.store.currentChatId }]"
    @click="props.store.currentChatId = props.chat.id"
  )

    .chat-title.ellipsis(:class="{ placeholder: !props.chat.name }") {{ props.chat.name }}
      span.icon.is-small.chat-flagged(v-if="props.chat.name && props.chat.flagged > 0")
        i.fas.fa-thumbtack

    .chat-removerecent(v-if="props.recentRemove" @click.stop="props.recentRemove(props.chat.id)")
      i.fa.fa-times

    .chat-unread(:class="{ important: !!props.chat.unreadImportant, atme: !!props.chat.unreadAtme }")
      | {{ (!!props.chat.unreadAtme ? '@' : '') + props.chat.unread }}

</template>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .chat
    $chat-height = 28px
    display flex
    height $chat-height
    text-regular-16()
    padding 3px 10px
    color $color-gray-text-light
    align-items center
    cursor pointer

    &.unread
      color #fff
      text-bold-16()

      .chat-unread
        display block

    &:hover
      background rgba(255, 255, 255, 0.05)

      &.recentChat:not(.unread)
        .chat-unread
          display none

        .chat-removerecent
          display block

    &.active
      background $color-blue
      color #fff

    .chat-title
      flex 1

      &.placeholder
        background alpha(#fff, .1)
        margin-right 40px
        height 13px
        border-radius @height

    .chat-removerecent
      display none
      align-self center
      padding 0 10px 0
      margin-right -4px

      &:hover
        background rgba(255,255,255,0.1)

      .fa
        font-size 12px
        color #fff
        opacity 0.5
        line-height $chat-height

    .chat-flagged
      font-size 13px
      color alpha($color-blue, 0.5)
      margin-left 5px

    .chat-unread
      display none
      background rgba(0, 0, 0, 0.25)
      color #fff
      padding 0 6px
      margin-left 8px
      border-radius $border-radius
      text-bold-13()
      line-height 1.55
      height 20px
      align-self center

      &.important
        background alpha($color-red, 0.35)

        &.atme
          background $color-red

    &.active
      .chat-unread,
      .chat-unread.atme
        background rgba(0, 0, 0, 0.2)

</style>

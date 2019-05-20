<template lang="pug">

  .sidebar-content

    .user.user-with-name(v-if="$store.currentUser && !$store.connectionError")

      img.avatar.avatar-small(:src="flows.getAvatarFromUser($store.currentUser)")

      .text
        .name.ellipsis {{ flows.getFullNameFromUser($store.currentUser) }}
        .details.ellipsis {{ $store.currentUser.email }}

      button.button.settings(v-tooltip.right="'Settings'")
        span.icon
          i.fas.fa-cog


</template>

<script>

  export default {
    name: "ChatSidebar",
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .sidebar-content
    position absolute
    left 0
    right 0
    top 0
    bottom 0
    margin-right -50px
    padding-right 50px
    overflow-y scroll
    height 100%

    .user
      .details
        color $color-gray-text-light

      .button
        color alpha(#fff, 0.5)

        &:hover
          background alpha(#fff, 0.1)

    .workspace-filter
      padding 10px 10px 0

      .menu-open,
      .popup-menu-container
        width $sidebar-width - 20px

      .menu-open
        border-color transparent
        background alpha(#fff, .08)
        color alpha(#fff, 0.6)
        justify-content space-between
        padding-left 9px

        &:hover
          background alpha(#fff, .12)
          color alpha(#fff, 0.8)

  .connection-error,
  .user
    padding 10px 10px 0

  .user-links
    padding 20px 10px 10px

  .connection-error,
  .user,
  .user-links,
  .search
    width $sidebar-width

  .search
    padding 10px 10px 0

    .input
      background transparent
      transition all 0.1s
      border-color alpha(#fff, 0.2)
      color #fff

      &::placeholder
        color #fff
        opacity 0.6

      &:hover
        background alpha(#fff, 0.05)

      &:focus
        background #fff
        color $color-text
        &::placeholder
          color $color-text


</style>

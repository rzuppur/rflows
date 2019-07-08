<template lang="pug">

  .user(
    v-if="user"
    :class="{ 'user-with-name': withName, outside: user.role === 'NOTIFICATION_RECEIVER' }"
    v-tooltip="tooltip"
    :status="user.userStatus"
  )

    slot(name="avatar")
      .avatar-container(v-if="user.avatar")
        img.avatar.avatar-small(:src="user.avatar" :status="user.status")
        .online-status
        .unreads(v-if="user.unreadItemsCount") {{ user.role === 'NOTIFICATION_RECEIVER' ? '@' : user.unreadItemsCount }}

    .text(v-if="withName")
      .name.ellipsis {{ user.name }}
      .details.ellipsis(v-if="user.email") {{ user.email }}
      .details.ellipsis(v-else-if="user.role") {{ user.role.toLowerCase() | capitalize }}
        span(v-if="user.userStatus") &nbsp;· {{ user.userStatus.toLowerCase() }}

    slot

</template>

<script>
  export default {
    name: "UserDisplay",
    props: {
      user: {
        type: Object,
      },
      withName: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      tooltip() {
        if (!this.withName && this.user.name) {
          if (this.user.role) return `${this.user.name} (${this.user.role.toLowerCase()})`;
          return this.user.name;
        }
        return null;
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .user
    text-regular-13()
    min-width 40px

    &[status="OFFLINE"] .avatar
      opacity 0.5
      filter saturate(0)

    .avatar-container
      position relative
      height 40px

    .online-status
      width 10px
      height @width
      border-radius 50%
      position absolute
      right -3px
      top -2px
      border 2px solid #fff
      display none

    &[status="AWAY"]
      .online-status
        background #ffc843
        display block

    &[status="ONLINE"]
      .online-status
        background #83c844
        display block

      .avatar[status="OPEN"],
      .avatar[status="TYPING"]
        box-shadow 0 0 0 1px #fff, 0 0 0 3px #83c843

    .avatar
      margin 0 0 0 10px

    &.user-with-name .avatar
      margin 0 10px 0 0

    .unreads
      position absolute
      bottom -2px
      right -4px
      padding 0 4px
      text-bold-13()
      background $color-blue
      color #fff
      text-shadow 0 -1px rgba(0, 0, 0, 0.5)
      border-radius $border-radius

    &.outside .unreads
      background $color-red
      font-feature-settings "case"
      padding 0 3px
      font-size 90%

    .details
      color $color-gray-text
      text-regular-13()

</style>

<template lang="pug">

  .sidebar-content

    .user.user-with-name(v-if="$store.currentUser && !$store.connectionError")

      img.avatar.avatar-small(:src="$flows.utils.getAvatarFromUser($store.currentUser)")

      .text
        .name.ellipsis {{ $flows.utils.getFullNameFromUser($store.currentUser) }}
        .details.ellipsis {{ $store.currentUser.email }}

      //-button.button.settings(v-tooltip.right="'Settings'")
        span.icon
          i.fas.fa-cog

      btn.button(:action="$flows.connection.logout" rtip="Log out" icon)
        span.icon
          i.fas.fa-sign-out-alt

    .sidebar-chats

      h4.chats-section
        btn.button-reset(:action="toggleAllChats" label="Toggle all chats")
          i.fas(:class="`fa-angle-${showAllChats ? 'up' : 'down'}`")
          | &nbsp;All chats{{ allChats.length ? ' (' + allChats.length + ')' : '' }}

      chat-sidebar-chat-display(v-for="chat in allChats" :chat="chat" :currentChatId="$store.currentChatId")

</template>

<script>
  import ChatSidebarChatDisplay from "@/components/Chat/ChatSidebarChatDisplay.vue";

  export default {
    name: "ChatSidebar",
    components: { ChatSidebarChatDisplay },
    data() {
      return {
        showAllChats: true,
      };
    },
    computed: {
      allChats() {
        return this.$store.flows.chats.d;
      },
    },
    methods: {
      toggleAllChats() {
        this.showAllChats = !this.showAllChats;
      },
    },
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
        text-regular-13()

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
          color $color-

  .sidebar-chats
    width $sidebar-width
    overflow hidden

  .chats-section
    padding 20px 10px 5px
    color $color-red-text

</style>

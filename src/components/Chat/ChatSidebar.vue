<template lang="pug">

  .sidebar-content

    .user.user-with-name(v-if="$store.currentUser && !$store.connectionError")

      img.avatar.avatar-small(:src="$flows.utils.getAvatarFromUser($store.currentUser)")

      .text
        .name.ellipsis {{ $flows.utils.getFullNameFromUser($store.currentUser) }}
        .details.ellipsis {{ $store.currentUser.email }}

      button.button.settings(v-tooltip.right="'Settings'" @click="$events.$emit('openSettings')")
        span.icon
          i.fas.fa-cog

    .sidebar-chats

      h4.chats-section #[i.far.fa-comment] RFlows
      chat-sidebar-chat-display(v-if="devChat" :chat="devChat" :store="$store")

      h4.chats-section(v-if="favChats.length") #[i.far.fa-star] Favorites
      chat-sidebar-chat-display(v-for="chat in favChats" :chat="chat" :store="$store")

      h4.chats-section(v-if="unreadChats.length") #[i.far.fa-bell] Unread
      chat-sidebar-chat-display(v-for="chat in unreadChats" :chat="chat" :store="$store")

      h4.chats-section(v-if="recentChats.length") #[i.far.fa-clock] Recent
      chat-sidebar-chat-display.recentChat(v-for="chat in recentChats" :chat="chat" :store="$store" :recentRemove="recentRemove")

      h4.chats-section(v-if="allChats.length")
        btn.button-reset(:action="toggleAllChats" label="Toggle all chats")
          i.fas(:class="`fa-angle-${showAllChats ? 'up' : 'down'}`")
          | &nbsp;All chats{{ allChats.length ? ' (' + allChats.length + ')' : '' }}

      template(v-if="showAllChats")
        chat-sidebar-chat-display(v-for="chat in allChats" :chat="chat" :store="$store")

      h4.chats-section

</template>

<script>
  import { DEVCHAT_ID } from "@/js/consts";
  import ChatSidebarChatDisplay from "@/components/Chat/ChatSidebarChatDisplay.vue";

  export default {
    name: "ChatSidebar",
    components: { ChatSidebarChatDisplay },
    data() {
      return {
        showAllChats: false,
      };
    },
    computed: {
      allChats() {
        this.$store.flows.chats.v;

        return this.$store.flows.chats.d;
      },
      devChat() {
        this.$store.flows.chats.v;

        const devChat = this.$store.flows.chats.d.find(chat => chat.id === DEVCHAT_ID);
        return devChat || {
          id: DEVCHAT_ID,
          name: "Features & support",
        };
      },
      ignoreIds() {
        this.$store.flows.userProperties.v;

        return this.$flows.chats.favChatIds.concat(DEVCHAT_ID);
      },
      favChats() {
        this.$store.flows.userProperties.v;

        return this.$flows.chats.favChatIds
        .map(favId => this.allChats.find(chat => chat.id === favId))
        .filter(chat => chat);
      },
      unreadChats() {
        return this.allChats.filter(chat => chat.unread && !this.ignoreIds.includes(chat.id));
      },
      recentChats() {
        return this.$flows.chats.recentChatIds
        .filter(recentId => !this.ignoreIds.includes(recentId))
        .map(recentId => this.allChats.find(chat => chat.id === recentId))
        .filter(chat => chat && !chat.unread);
      },
    },
    methods: {
      toggleAllChats() {
        this.showAllChats = !this.showAllChats;
      },
      recentRemove(chatId) {
        this.$flows.chats.recentChatIds = this.$flows.chats.recentChatIds.filter(recentId => recentId !== chatId);
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

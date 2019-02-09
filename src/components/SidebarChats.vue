<template lang="pug">
  mixin sidebarChat(chatList)
    .chat(v-for="chat in " + chatList
    :class="{ unread: !!chat.unread, active: chat.id === $store.currentChatId }"
    @click="changeChat(chat.id)"
    class= chatList === "recentChats" ? "recentChat" : "")
      .chat-title.ellipsis {{ chat.name }}
      if chatList === "recentChats"
        .chat-removerecent(@click.stop="removeRecent(chat.id)")
          i.fa.fa-times
      .chat-unread(:class="{ important: !!chat.unreadImportant, atme: !!chat.unreadAtme }")
        | {{ (!!chat.unreadAtme ? '@' : '') + chat.unread }}

  .sidebar-chats(v-if="allChats.length")
    | {{ setDocumentTitleUnread }}
    template(v-if="!searchText && favouriteChats.length")
      h4.chats-section #[i.far.fa-star] Favorites
      +sidebarChat("favouriteChats")
    template(v-if="!searchText && recentChats.length")
      h4.chats-section #[i.far.fa-clock] Recent
      +sidebarChat("recentChats")
    h4.chats-section.clickable.is-unselectable(v-if="!searchText" @click="showAllChats = !showAllChats")
      i.fas(:class="{ 'fa-angle-down': !showAllChats, 'fa-angle-up': showAllChats }")
      | &nbsp;All chats
    template(v-if="showAllChats")
      +sidebarChat("allChats")
    template(v-if="searchText")
      div(style="height: 10px;")
      +sidebarChat("filteredChats")
</template>

<script>
  export default {
    name: "SidebarChats",
    props: ["allChats", "favouriteIds", "recentIds", "searchText"],
    data: function () {
      return {
        showAllChats: false
      };
    },
    mounted() {
      this.$root.updateFullHeight();
    },
    computed: {
      favouriteChats() {
        if (!this.allChats.length || !this.favouriteIds) return [];
        let favourites = [];
        this.favouriteIds.forEach(favId => {
          let chat = this.allChats.find(chat => chat.id === favId);
          if (chat) favourites.push(chat);
        });
        return favourites;
      },
      recentChats() {
        if (!this.allChats.length || !this.recentIds) return [];
        let recents = [];
        this.recentIds.filter(recentId => this.favouriteIds.indexOf(recentId) < 0).forEach(recentId => {
          let chat = this.allChats.find(chat => chat.id === recentId);
          if (chat && !chat.unread) recents.push(chat);
        });
        const unread = this.allChats.filter(chat => {
          return chat.unread && this.favouriteIds.indexOf(chat.id) < 0
        });
        return unread.concat(recents).slice(0, 15);
      },
      setDocumentTitleUnread() {
        if (this.allChats.length) {
          const unread = this.allChats.map((chat) => chat.unread).reduce((a, b) => a + b, 0);
          if (unread) {
            document.title = "(" + unread + ") RFlows";
            return;
          }
        }
        document.title = "RFlows";
      },
      filteredChats() {
        if (this.searchText) {
          const text = this.searchText.toLowerCase();
          return this.allChats.filter((chat) => {
            return chat.name.toLowerCase().includes(text);
          });
        }
      }
    },
    methods: {
      changeChat(chatId) {
        this.flows.openChat(chatId);
      },
      removeRecent(chatId) {
        this.flows.removeChatFromRecents(chatId);
      }
    }
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .sidebar-chats
    width $sidebar-width
    overflow hidden

  .chats-section
    padding 20px 10px 5px
    color $color-red-text

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

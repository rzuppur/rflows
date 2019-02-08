<template lang="pug">
  #app(v-cloak)
    notification
    login-form(v-if="!autoLogin && !currentUser && !reconnectTimeout")

    template(v-if="autoLogin || currentUser || reconnectTimeout")
      .main-container.alwaysFullHeight
        .sidebar
          .sidebar-content
            .connection-error(v-if="connectionError")
              div(style="margin-bottom: 5px;") {{ errorMsg }}
              div(v-if="loginLoading && connectionError" style="margin-bottom: 12px;") Reconnecting...
              button.button.is-info.is-fullwidth(v-if="!loginLoading" @click="reloadPage()") Reload page
            .user.user-with-name(v-if="currentUser && !connectionError")
              img.avatar.avatar-small(:src="flows.getAvatarFromUser(currentUser)")
              .text
                .name.ellipsis {{ flows.getFullNameFromUser(currentUser) }}
                .details.ellipsis {{ currentUser.email }}
              button.button.settings(v-tooltip.right="(openSection === 'SETTINGS') ? 'Close settings' : 'Settings'" @click="openSection = (openSection === 'SETTINGS') ? 'CHAT' : 'SETTINGS'")
                span.icon
                  i.fas(:class="`fa-${(openSection === 'SETTINGS') ? 'times' : 'cog'}`")
            .search(v.if="lastOpenChatCanBeOpened")
              .control.has-icons-right
                input.input(type="search" placeholder="Search chats" v-model="searchText")
                span.icon.is-small.is-right
                  i.fas.fa-search
            sidebar-chats(
            :allChats="allChats"
            :favouriteIds="favouriteIds"
            :recentIds="recentIds"
            :searchText="searchText")
        .mainbar(v-if="openSection === 'SAVED'")
          flagged-messages(@closeSavedMessages="openSection = 'CHAT'")
        .mainbar(v-if="openSection === 'SETTINGS'")
          settings(@closeSettings="openSection = 'CHAT'")
        .mainbar(v-show="openSection === 'CHAT'")
          div(v-if="!currentChatId || !topics.TopicItem" style="padding: 20px;")
            .title {{ loginLoading ? 'Loading...' : 'No connection' }}
            .buttons
              button.button(v-if="!loginLoading" @click="reloadPage()") Reload page
              button.button.is-outlined(@click="flows.logout") Log out
          template(v-if="currentChatId && topics.TopicItem")
            chat-messages(
            ref="messages"
            :favouriteIds="favouriteIds"
            :hidden="openSection !== 'CHAT'"
            @viewSavedMessages="openSection = 'SAVED'")
</template>

<script>
  import {CHAT_TOPICS, GLOBAL_TOPICS} from "@/js/consts"

  import ChatMessages from "@/components/ChatMessages"
  import SidebarChats from "@/components/SidebarChats"
  import FlaggedMessages from "@/components/FlaggedMessages"
  import Settings from "@/components/Settings"
  import LoginForm from "@/components/LoginForm"
  import Notification from "@/components/Notification"

  export default {
    name: 'App',
    components: {Notification, ChatMessages, SidebarChats, FlaggedMessages, Settings, LoginForm},
    store: ["currentChatId", "currentChatName", "currentUser", "topics", "loginLoading", "connectionError", "errorMsg", "reconnectTimeout"],
    data: function () {
      return {
        autoLogin: true,  // hide login form flash when session stored in localstorage
        openLastChat: true,

        showAllChats: false,
        favouriteIds: [],
        recentIds: [],
        searchText: "",
        openSection: "CHAT",
      };
    },
    created() {
      this.eventBus.$on("logout", () => {
        this.autoLogin = false;
        this.openLastChat = true;

        this.showAllChats = false;
        this.favouriteIds = [];
        this.recentIds = [];
        this.searchText = "";
        this.openSection = "CHAT";
      });
      this.eventBus.$on("currentChatChange", () => {
        this.searchText = "";
      });
    },
    mounted() {
      this.$root.updateFullHeight();
      const token = this.flows.getLoginToken();
      if (token) {
        this.flows.setLogin({token: token});
        this.loginLoading = true;
        this.flows.connect()
        .then((successful) => {
          this.loginLoading = false;
          if (!successful) this.connectionError = true;
          this.autoLogin = false;
        });
      } else {
        this.autoLogin = false;
      }
    },
    beforeDestroy() {
      this.flows.socket.close({type: "clientClose"});
    },
    computed: {
      allChats() {
        if (!this.topics.User || !this.topics.TopicUser || !this.currentUser || !this.topics.Topic) return [];
        if (this.flows) this.flows.enrichChats();
        return this.topics.Topic;
      },
      lastOpenChatCanBeOpened() {
        return !!(this.openLastChat && this.allChats && this.recentIds.length && this.currentUser);
      },
    },
    methods: {
      reloadPage() {
        location.reload()
      },
    },
    watch: {
      "lastOpenChatCanBeOpened": function (val) {
        if (!val) return;
        this._debug("Loading last opened chat: " + this.recentIds[0]);
        this.flows.openChat(this.recentIds[0]);
        this.openLastChat = false;
      },
      "topics.UserProperty": function (val) {
        if (!val) return;
        let favs = val.find(userProperty => userProperty.name === "favorites");
        this.favouriteIds = favs
          ? favs.value.map(v => v.id)
          : [];
        let recents = val.find(userProperty => userProperty.name === "recentTools");
        this.recentIds = recents
          ? recents.value.filter(recentTools => recentTools.type === "MEETING" && recentTools.id).map(v => v.id)
          : [];
      },
    }
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .main-container
    display flex
    overflow hidden

    .sidebar, .mainbar
      max-height 100%
      min-width 0

    .sidebar
      background $color-sidebar-background
      flex 0 0 $sidebar-width
      position relative
      overflow hidden
      color #fff

      @media (max-width 800px)
        flex 0 0 40px

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

      .connection-error, .user
        padding 10px 10px 0

      .user-links
        padding 20px 10px 10px

      .connection-error, .user, .user-links, .search
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

          &:focus
            background #fff
            color $color-text
            &::placeholder
              color $color-text

    .mainbar
      flex 4

</style>

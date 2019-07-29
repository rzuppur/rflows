<template lang="pug">

  .sidebar-content.scrollbar-style.scrollbar-style-light

    connection-status

    user-display(:user="currentUserDisplay" :withName="true")

      template(v-if="mqMobile" v-slot:avatar)
        btn.button.chat(tip="Chat" tloc="right" :action="() => { $events.$emit('hideSidebar') }")
          span.icon
            i.fas.fa-arrow-right

      btn.button.settings(tip="Settings" tloc="right" :action="() => { $events.$emit('openSettings') }")
        span.icon
          i.fas.fa-cog

    .search
      .control.has-icons-right
        input.input(type="search" placeholder="Search chats" v-model="searchText")
        span.icon.is-small.is-right
          i.fas.fa-search

    h4.chats-section.has-text-centered(v-if="$store.debugMode" style="padding-top: 15px; padding-bottom: 0; color: #fd0;" @click="$store.debugMode = false") ⭐⭐⭐ DEBUG MODE ⭐⭐⭐

    .workspace-filter(v-if="showWorkspaceFilter")
      popup-menu(menu-id="workspace-switcher" :actions="workspaceMenu")
        template(v-slot:trigger="open")
          button.button(type="button" @pointerdown.prevent @click.stop="open.menuOpenClickStop")
            .workspace
              img.logo(v-if="activeWorkspace.id" :src="$flows.utils.getLogoFromWorkspace(activeWorkspace)" :alt="activeWorkspace.name")
              .name {{ activeWorkspace.name }}
            span.icon.is-small
              i.fas.fa-angle-down

    .sidebar-chats


      div(v-if="searchText.length" style="height: 10px;")

      template(v-else)

        h4.chats-section #[i.far.fa-comment] RFlows
        chat-sidebar-chat-display(v-if="devChat" :chat="devChat" :store="$store" :action="() => { chatClick(devChat.id); }" :key="devChat.id")

        template(v-if="allChats.length === 0")
          h4.chats-section
          chat-sidebar-chat-display(v-for="i in 7" :style="{ opacity: 1 - (i*.11), pointerEvents: 'none' }" :key="i")

        h4.chats-section(v-if="favChats.length") #[i.far.fa-star] Favorites
        chat-sidebar-chat-display(v-for="chat in favChats" :chat="chat" :store="$store" :action="() => { chatClick(chat.id); }" :key="chat.id")

        h4.chats-section(v-if="unreadChats.length") #[i.far.fa-bell] Unread
        chat-sidebar-chat-display(v-for="chat in unreadChats" :chat="chat" :store="$store" :action="() => { chatClick(chat.id); }" :key="chat.id")

        h4.chats-section(v-if="recentChats.length") #[i.far.fa-clock] Recent
        chat-sidebar-chat-display.recentChat(v-for="chat in recentChats" :chat="chat" :store="$store" :recentRemove="recentRemove" :action="() => { chatClick(chat.id); }" :key="chat.id")

        h4.chats-section(v-if="allChats.length")
          btn.button-reset(:action="toggleAllChats" label="Toggle all chats")
            i.fas(:class="`fa-angle-${showAllChats ? 'up' : 'down'}`")
            | &nbsp;All chats{{ allChats.length ? ' (' + allChats.length + ')' : '' }}

      slide-in-out(:inDuration="90" :outDuration="90")
        div(v-if="showAllChats || searchText.length")
          chat-sidebar-chat-display(v-for="chat in allChats" :chat="chat" :store="$store" :action="() => { chatClick(chat.id); }" :key="chat.id + 10000000")

      h4.chats-section

</template>

<script>
  import { BLANK_DATA_SVG_IMAGE, DEVCHAT_ID } from "@/js/consts";
  import ChatSidebarChatDisplay from "@/components/Chat/ChatSidebarChatDisplay.vue";
  import PopupMenu from "@/components/UI/PopupMenu.vue";
  import UserDisplay from "@/components/UserDisplay.vue";
  import ConnectionStatus from "@/components/App/ConnectionStatus.vue";
  import SlideInOut from "@/components/UI/SlideInOut.vue";

  export default {
    name: "ChatSidebar",
    components: {
      SlideInOut,
      ConnectionStatus,
      UserDisplay,
      ChatSidebarChatDisplay,
      PopupMenu,
    },
    data() {
      return {
        showAllChats: false,
        searchText: "",
        filterWorkspaceId: null,
      };
    },
    computed: {
      currentUserDisplay() {
        return {
          avatar: this.$flows.utils.getAvatarFromUser(this.$store.currentUser),
          name: this.$flows.utils.getFullNameFromUser(this.$store.currentUser),
          email: this.mqMobile ? null : this.$store.currentUser?.email,
        };
      },
      showWorkspaceFilter() {
        this.$store.flows.userProperties.v;

        if (this.searchText.length) return false;
        if (this.workspaces.length <= 1) return false;
        return this.$flows.settings.getBooleanUserProp("showWorkspaceSwitcher");
      },
      workspaces() {
        this.$store.flows.workspaceAccesses.v;
        this.$store.flows.workspaces.v;

        return [{
          id: null,
          name: "All workspaces",
        }].concat(
          this.$flows.chats.userWorkspaceIds
            .map(id => this.$store.flows.workspaces.d.find(workspace => workspace.id === id))
            .filter(workspace => workspace)
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      },
      workspaceMenu() {
        const active = this.workspaces.find(workspace => workspace.id === this.filterWorkspaceId);
        const list = [{
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          func: () => {
            // eslint-disable-next-line vue/no-side-effects-in-computed-properties
            this.filterWorkspaceId = active.id;
          },
          text: active.name,
          image: active.id ? this.$flows.utils.getLogoFromWorkspace(active) : null,
        }];
        if (this.workspaces.length <= 1) return list;

        list.push({ hr: true });
        return list.concat(
          this.workspaces
            .filter(workspace => workspace.id !== this.filterWorkspaceId)
            .map(workspace => ( {
              // eslint-disable-next-line vue/no-side-effects-in-computed-properties
              func: () => {
                // eslint-disable-next-line vue/no-side-effects-in-computed-properties
                this.filterWorkspaceId = workspace.id;
              },
              text: workspace.name,
              image: workspace.id ? this.$flows.utils.getLogoFromWorkspace(workspace) : BLANK_DATA_SVG_IMAGE,
            } )),
        );
      },
      activeWorkspace() {
        return this.workspaces.find(workspace => workspace.id === this.filterWorkspaceId);
      },
      allChats() {
        this.$store.flows.chats.v;
        this.$store.flows.chatWorkspaces.v;

        if (this.searchText.length) {
          const text = this.searchText.toLowerCase();
          return this.$store.flows.chats.d.filter(chat => chat.name.toLowerCase().includes(text));
        }
        if (this.showWorkspaceFilter && this.filterWorkspaceId) {
          return this.$store.flows.chatWorkspaces.d
            .filter(chatWorkspace => chatWorkspace.workspaceId === this.filterWorkspaceId)
            .map(chatWorkspace => this.$store.flows.chats.d.find(chat => chat.id === chatWorkspace.chatId))
            .filter(chat => chat);
        }
        return this.$store.flows.chats.d;
      },
      devChat() {
        this.$store.flows.chats.v;

        const devChat = this.$store.flows.chats.d.find(chat => chat.id === DEVCHAT_ID);
        return devChat || {
          id: DEVCHAT_ID,
          name: "Updates & support",
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
        this.$store.flows.userProperties.v;

        return this.allChats.filter(chat => chat.unread && !this.ignoreIds.includes(chat.id));
      },
      recentChats() {
        this.$store.flows.userProperties.v;

        return this.$flows.chats.recentChatIds
          .filter(recentId => !this.ignoreIds.includes(recentId))
          .map(recentId => this.allChats.find(chat => chat.id === recentId))
          .filter(chat => chat && !chat.unread);
      },
    },
    created() {
      this.$events.$on("currentChatChange", () => {
        this.searchText = "";
      });
    },
    methods: {
      toggleAllChats() {
        this.showAllChats = !this.showAllChats;
      },
      recentRemove(chatId) {
        this.$flows.chats.recentChatIds = this.$flows.chats.recentChatIds.filter(recentId => recentId !== chatId);
      },
      chatClick(chatId) {
        this.$store.currentChatId = chatId;
        this.$events.$emit("hideSidebar");
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .sidebar-content
    overflow-y scroll
    height 100%
    margin-right -50px
    padding-right 50px

    @media (max-width $media-mobile-width)
      padding-top 56px

    @media (min-width $media-mobile-width + 1px)
      position absolute
      left 0
      right 0
      top 0
      bottom 0
      margin-right
    -50px
    padding-right 50px

    & /deep/ .connection-status
      width $sidebar-width

      @media (max-width $media-mobile-width)
        width 100%

    .user
      @media (max-width $media-mobile-width)
        position fixed
        top 0
        left 0
        right 0
        z-index 10
        padding-bottom 10px
        background alpha($color-sidebar-background, .95)

      & /deep/ .details
        color $color-gray-text-light

      .button
        color alpha(#fff, 0.5)

        &:hover
          background alpha(#fff, 0.1)

      .button.chat
        margin-left 0
        margin-right 4px

    .workspace-filter
      padding 10px 10px 0

      .button
        width 100%

      & /deep/ .popup-menu-container
        position relative
        top -50px

      @media (min-width $media-mobile-width + 1px)
        .button,
        & /deep/ .popup-menu
          width $sidebar-width - 20px
          max-width $sidebar-width - 20px

        & /deep/ .popup-menu-container
          width $sidebar-width - 20px

      .button
        padding-top 0
        padding-bottom 0
        height 48px
        border-color transparent
        background alpha(#fff, .08)
        color alpha(#fff, 0.6)
        justify-content space-between
        padding-left 9px

        &:hover
          background alpha(#fff, .12)
          color alpha(#fff, 0.8)

      .workspace
        margin 0

        .name
          margin-bottom -1px

        .logo
          margin-right 10px
          width 24px
          height @width

  .user
    padding 10px 10px 0

  @media (min-width $media-mobile-width + 1px)
    .user,
    .search
      width $sidebar-width

  .search
    padding 10px 10px 0

    @media (max-width $media-mobile-width)
      padding-top 0

      input
        height 48px

      .control.has-icons-right .icon
        top 6px

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

  @media (min-width $media-mobile-width + 1px)
    .sidebar-chats
      width $sidebar-width
      overflow hidden

  .chats-section
    padding 20px 10px 5px
    color $color-red-text

</style>

<template lang="pug">

  #app(v-cloak @click="documentClick")

    Controller

    .body-content(
      :tabindex="modalsOpen ? -1 : null"
      :inert="!!modalsOpen"
      :class="{ modalsOpen }"
      :aria-hidden="modalsOpen ? 'true' : false"
    )

      login(v-if="$store.route === 'login'")

      template(v-if="$store.route === 'chat'")
        .main-container.alwaysFullHeight
          .sidebar
            .sidebar-content(v-if="allChats && allChats.length")

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

              .search
                .control.has-icons-right
                  input.input(type="search" placeholder="Search chats" v-model="searchText")
                  span.icon.is-small.is-right
                    i.fas.fa-search

              .workspace-filter(v-if="flows.showWorkspaceSwitcher && userWorkspaces && userWorkspaces.length > 1")
                .popup-menu-container
                  button.button.menu-open(@click="workspaceMenuOpen = !workspaceMenuOpen")
                    span {{ workspaceFilter ? workspaceFilter.name : 'All workspaces' }}
                    span.icon.is-small
                      i.fas(:class="`fa-angle-${ workspaceMenuOpen ? 'up' : 'down'}`")
                  div(v-if="workspaceMenuOpen")
                    slide-in-out(:inDuration="100" :outDuration="0")
                      .popup-menu(v-if="workspaceMenuOpen")
                        .popup-menu-item(
                          @click="workspaceFilter = null"
                          :class="{ active: workspaceFilter === null }"
                          ) All workspaces
                        .popup-menu-item(
                          v-for="workspace in userWorkspaces"
                          @click="workspaceFilter = workspace.workspace"
                          :class="{ active: workspaceFilter && workspaceFilter.id === workspace.workspace.id }"
                          ) {{ workspace.workspace.name }}

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
            div(v-if="!currentChatId" style="padding: 20px;")
              h3 {{ loginLoading ? 'Loading...' : 'No connection' }}
              .buttons.space-top-small
                button.button(v-if="!loginLoading" @click="reloadPage()") Reload page
                button.button.is-outlined(@click="flows.logout") Log out
            template(v-if="currentChatId")
              chat-messages(
                ref="messages"
                :favouriteIds="favouriteIds"
                :hidden="openSection !== 'CHAT'"
                @viewSavedMessages="openSection = 'SAVED'")

    email-display

    overlays

</template>

<script>
  import Controller from "@/components/App/Controller.vue";
  import ChatMessages from "@/components/Views/ChatMessages.vue";
  import SidebarChats from "@/components/Views/SidebarChats.vue";
  import FlaggedMessages from "@/components/Views/FlaggedMessages.vue";
  import Settings from "@/components/Views/Settings.vue";
  import Login from "@/components/Views/Login.vue";
  import Overlays from "@/components/UI/Overlays.vue";
  import SlideInOut from "@/components/UI/SlideInOut.vue";
  import EmailDisplay from "@/components/Message/EmailDisplay.vue";

  export default {
    name: "App",
    components: {
      EmailDisplay,
      Controller,
      SlideInOut,
      ChatMessages,
      SidebarChats,
      FlaggedMessages,
      Settings,
      Login,
      Overlays,
    },
    store: ["currentChatId", "currentChatName", "currentUser", "topics", "loginLoading", "connectionError", "errorMsg", "reconnectTimeout"],
    data() {
      return {
        openLastChat: true,

        showAllChats: false,
        favouriteIds: [],
        recentIds: [],
        userWorkspaces: [],
        searchText: "",
        openSection: "CHAT",
        workspaceMenuOpen: false,
        workspaceFilter: null,
      };
    },
    computed: {
      allChats() {
        if (!this.topics.User || !this.topics.TopicUser || !this.currentUser || !this.topics.Topic) return [];
        if (this.flows) this.flows.enrichChats();
        if (this.flows.showWorkspaceSwitcher && this.workspaceFilter && this.userWorkspaces) {
          const workspaceChats = this.flows.getWorkspaceChats(this.workspaceFilter.id);
          return this.topics.Topic.filter(chat => workspaceChats.indexOf(chat.id) > -1);
        }
        return this.topics.Topic;
      },
      lastOpenChatCanBeOpened() {
        return !!(this.openLastChat && this.allChats && this.recentIds.length && this.currentUser);
      },
      modalsOpen() {
        return this.$store.modalsOpen.length;
      },
    },
    created() {
      this.eventBus.$on("logout", () => {
        this.openLastChat = true;

        this.showAllChats = false;
        this.favouriteIds = [];
        this.recentIds = [];
        this.searchText = "";
      });
      this.eventBus.$on("currentChatChange", () => {
        this.searchText = "";
      });
    },
    beforeDestroy() {
      this.flows.socket.close({type: "clientClose"});
    },
    methods: {
      reloadPage() {
        location.reload();
      },
      documentClick(event) {
        const path = event.composedPath();
        //this.eventBus.$emit("documentClick", path);
        if (!path.find(element => element.classList?.contains("menu-open"))) {
          this.workspaceMenuOpen = false;
        }
      },
    },
    watch: {
      lastOpenChatCanBeOpened (newVal) {
        if (!newVal) return;
        this._debug(`Loading last opened chat: ${  this.recentIds[0]}`);
        this.flows.openChat(this.recentIds[0]);
        this.openLastChat = false;
      },
      "topics.UserProperty": function (newVal) {
        if (!newVal) return;
        const favs = newVal.find(userProperty => userProperty.name === "favorites");
        this.favouriteIds = favs
          ? favs.value.map(v => v.id)
          : [];
        const recents = newVal.find(userProperty => userProperty.name === "recentTools");
        this.recentIds = recents
          ? recents.value.filter(recentTools => recentTools.type === "MEETING" && recentTools.id).map(v => v.id)
          : [];
      },
      "topics.Organization": function () {
        this.userWorkspaces = this.flows.getCurrentUserWorkspaces();
      },
      "topics.UserAccess": function () {
        this.userWorkspaces = this.flows.getCurrentUserWorkspaces();
      },
      allChats(newVal) {
        const workspace = this.workspaceFilter ? ` - ${this.workspaceFilter.name}` : "";
        if (newVal.length) {
          const unread = newVal.map(chat => chat.unread).reduce((a, b) => a + b, 0);
          if (unread) {
            document.title = `(${unread}) RFlows${workspace}`;
            return;
          }
        }
        document.title = `RFlows${workspace}`;
      },
    },
  };
</script>

<style lang="stylus" scoped src="./App.styl"></style>

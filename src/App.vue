<template lang="pug">

  #app(v-cloak @click="documentClick")

    controller

    .body-content(
      :tabindex="modalsOpen ? -1 : null"
      :inert="!!modalsOpen"
      :class="{ modalsOpen }"
      :aria-hidden="modalsOpen ? 'true' : false"
    )

      login(v-if="$store.route === 'login'")

      chat(v-if="$store.route === 'chat'")

    email-display

    settings

    overlays

</template>

<script>
  import Controller from "@/components/App/Controller.vue";
  import Chat from "@/components/Views/Chat.vue";
  import Login from "@/components/Views/Login.vue";
  import EmailDisplay from "@/components/Views/EmailDisplay.vue";
  import Settings from "@/components/Views/Settings.vue";
  import Overlays from "@/components/UI/Overlays.vue";

  export default {
    name: "App",
    components: {
      Controller,
      Chat,
      Login,
      EmailDisplay,
      Settings,
      Overlays,
    },
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
      this.$events.$on("logout", () => {
        this.openLastChat = true;

        this.showAllChats = false;
        this.favouriteIds = [];
        this.recentIds = [];
        this.searchText = "";
      });
      this.$events.$on("currentChatChange", () => {
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
      documentClick() {
        this.$store.openMenu = null;
      },
    },
  };
</script>

<style lang="stylus" scoped src="./App.styl"></style>

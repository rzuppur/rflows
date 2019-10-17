<template lang="pug">

  mixin settings(name)
    .setting-block
      checkbox-switch(:disabled=name + " === null" :value=name @input="valueUpdate('" + name + "', $event)" name=name)
        block

  .settings

    r-modal(v-if="$store.currentUser && !$store.connection.error" title="Settings" ref="settingsModal")

      template(v-if="settingsLoaded")
        h4.title-caps
          span Messages
        +settings("autoMarkAsRead")
          .label Auto-read
            .description {{ autoMarkAsRead ? "Mark messages as read when opened" : "Messages have to be marked as read manually" }}
        +settings("desktopNotifications")
          .label Browser notifications
            .description {{ notificationStatus }}

        h4.title-caps
          span Interface
        +settings("showWorkspaceSwitcher")
          .label Workspace filter
            .description {{ showWorkspaceSwitcher ? "Show" : "Hide" }} workspace filter on sidebar
        +settings("compactMode")
          .label Compact messages
            .description {{ compactMode ? "Maximize the number of messages displayed" : "More space around messages" }}

      p.text-muted.margin-top-medium(v-else) Settings not available

      h4.title-caps
        span Profile

      user-display(:user="currentUser" :withName="true")

      r-button.margin-top-medium(:action="$flows.connection.logout" tip="Log out" tloc="right" icon="log out") Log out

      template(v-if="$store.currentUser && $store.currentUser.id === 2352")

        h4.title-caps
          span About

        p
          b Current build: #{""}
          | {{ buildDate }}
          br
          b Latest build: #{""}
          | {{ latestBuildDate }}
          br
          b Build status: #{""}
          img(src="https://api.netlify.com/api/v1/badges/f1eec3f7-38ef-4a5a-946d-a5b00a4595e4/deploy-status" style="position: relative; top: 4px; display: inline-block;" alt="")

      template(v-slot:buttons)
        div(style="margin-bottom: 10px")

</template>

<script>
  import CheckboxSwitch from "@/components/UI/CheckboxSwitch.vue";
  import UserDisplay from "@/components/UserDisplay.vue";

  export default {
    name: "Settings",
    components: { UserDisplay, CheckboxSwitch },
    data() {
      return {
        autoMarkAsRead: null,
        desktopNotifications: null,
        showWorkspaceSwitcher: null,
        compactMode: null,

        buildDate: "Unknown",
        latestBuildDate: "Unknown",
      };
    },
    computed: {
      notificationStatus() {
        if (this.desktopNotifications) {
          switch (Notification.permission) {
            case "default":
              return "Permission needed";
            case "granted":
              return "Notifications enabled";
            case "denied":
              return "Notifications blocked, you can change this in site settings";
            default:
              return "Error";
          }
        }
        return "Notifications disabled";
      },
      currentUser() {
        return {
          avatar: this.$flows.utils.getAvatarFromUser(this.$store.currentUser),
          name: this.$flows.utils.getFullNameFromUser(this.$store.currentUser),
          email: this.$store.currentUser?.email,
        };
      },
      settingsLoaded() {
        this.$store.flows.userProperties.v;

        return !!this.$store.flows.userProperties.d.length;
      },
    },
    watch: {
      "$store.flows.userProperties.v": function () {
        this.updateProps();
      },
    },
    mounted() {
      this.$events.$on("openSettings", () => {
        this.$refs.settingsModal?.open();
        this.updateProps();
      });

      if (process?.env.NODE_ENV === "development") {
        this.buildDate = "Development";
        this.latestBuildDate = "Development";

      } else if (process?.env.BUILD_DATE) {
        this.buildDate = this.utils.dayjsDate(+process.env.BUILD_DATE).format("D MMM YYYY, HH:mm");
        this.checkLatestBuild();
      }

    },
    methods: {
      updateProps() {
        this.autoMarkAsRead = this.$flows.settings.getBooleanUserProp("autoMarkAsRead");
        this.desktopNotifications = this.$flows.settings.getBooleanUserProp("desktopNotifications");
        this.showWorkspaceSwitcher = this.$flows.settings.getBooleanUserProp("showWorkspaceSwitcher");
        this.compactMode = this.$flows.settings.getBooleanUserProp("compactMode");
      },
      valueUpdate(prop, value) {
        this.$flows.settings.setBooleanUserProp(prop, value);
        this[prop] = null;

        if (value && prop === "desktopNotifications") {
          if (Notification.permission === "default") {
            Notification.requestPermission().then((result) => {
              if (result === "default") this.$events.$emit("notify", "Notifications are disabled");
              if (result === "denied") this.$events.$emit("notify", "Notifications are blocked, you can change this in site settings");
              if (result === "granted") this.$events.$emit("notify", "Notifications enabled");
            });
          } else if (Notification.permission !== "granted") {
            this.$events.$emit("notify", "Can't enable notifications, possibly blocked from browser");
          }
        }
      },
      async checkLatestBuild() {
        try {
          const latest = await fetch(`/VERSION?v=${Date.now()}`);
          const latestDate = await latest.text();

          if (latestDate) {
            this.latestBuildDate = this.utils.dayjsDate(+latestDate).format("D MMM YYYY, HH:mm");

            if (process?.env.BUILD_DATE && (+process.env.BUILD_DATE + 1000 * 60) < +latestDate) {
              const refresh = await this.$root.rModalConfirm("Update available", "Refresh page", "Later", "New version of RFlows has been published.");
              // eslint-disable-next-line no-restricted-globals
              if (refresh) location.reload(true);
            } else {
              setTimeout(this.checkLatestBuild, 1000 * 60 * 2);
            }
          }
        } catch {
          this.latestBuildDate = "Error";
        }
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  h4
    position relative

    &:before
      content ""
      height 2px
      background $color-light-border
      position absolute
      left 0
      right 0
      top 8px

    span
      position relative
      z-index 1
      background #fff
      padding-right 5px

  .setting-block
    margin-bottom 20px

</style>

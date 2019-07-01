<template lang="pug">

  mixin settings(name)
    .setting-block
      checkbox-switch(:disabled=name + " === null" :value=name @input="valueUpdate('" + name + "', $event)" name=name)
        block

  .settings

    modal(v-if="$store.currentUser && !$store.connection.error" title="Settings" ref="settingsModal")

      h4
        span Profile

      user-display(:user="currentUser" :withName="true")
        btn.button(:action="$flows.connection.logout" tip="Log out" tloc="right" icon)
          span.icon
            i.fas.fa-sign-out-alt

      template(v-if="settingsLoaded")
        h4
          span Messages
        +settings("autoMarkAsRead")
          .label Auto-read
            .description {{ autoMarkAsRead ? "Mark messages as read when opened" : "Messages have to be marked as read manually" }}
        +settings("desktopNotifications")
          .label Browser notifications
            .description {{ notificationStatus }}

        h4
          span Interface
        +settings("showWorkspaceSwitcher")
          .label Workspace filter
            .description {{ showWorkspaceSwitcher ? "Show" : "Hide" }} workspace filter on sidebar
        +settings("compactMode")
          .label Compact messages
            .description {{ compactMode ? "Maximize the number of messages displayed" : "More space around messages" }}

      p.text-muted.space-top-medium(v-else) Settings not available
      .space-top-small

      template(v-slot:buttons)
        span

</template>

<script>
  import Modal from "@/components/UI/Modal.vue";
  import CheckboxSwitch from "@/components/UI/CheckboxSwitch.vue";
  import UserDisplay from "@/components/UserDisplay.vue";

  export default {
    name: "Settings",
    components: { UserDisplay, CheckboxSwitch, Modal },
    data() {
      return {
        autoMarkAsRead: null,
        desktopNotifications: null,
        showWorkspaceSwitcher: null,
        compactMode: null,
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
    mounted() {
      this.$events.$on("openSettings", () => {
        this.$refs.settingsModal?.open();
        this.updateProps();
      });
    },
    methods: {
      updateProps() {
        this.autoMarkAsRead = this.$flows.settings.getBooleanUserProp("autoMarkAsRead");
        this.desktopNotifications = this.$flows.settings.getBooleanUserProp("desktopNotifications");
        this.showWorkspaceSwitcher = this.$flows.settings.getBooleanUserProp("showWorkspaceSwitcher");
        this.compactMode = this.$flows.settings.getBooleanUserProp("compactMode");
      },
      valueUpdate(prop, value) {
        this.$flows.settings.setBooleanUserProperty(prop, value);
        this[prop] = null;

        if (value && prop === "desktopNotifications") {
          if (Notification.permission === "default") {
            Notification.requestPermission().then((result) => {
              if (result === "default") this.$events.$emit("notify", "Notifications are disabled");
              if (result === "denied") this.$events.$emit("notify", "Notifications are blocked, you can change this in site settings");
              if (result === "granted") this.$events.$emit("notify", "Notifications enabled");
            });
          } else {

          }
        }
      },
    },
    watch: {
      "$store.flows.userProperties.v": function () {
        this.updateProps();
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  h4
    margin-bottom 10px
    position relative

    &:not(:first-of-type)
      margin-top 30px

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

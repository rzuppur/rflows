<template lang="pug">

  mixin settings(name)
    .setting-block
      checkbox-switch(:disabled=name + " === null" :value=name @input="valueUpdate('" + name + "', $event)" name=name)
        block

  .settings

    modal(v-if="$store.currentUser && !$store.connectionError" title="Settings" ref="settingsModal")

      h4
        span Profile
      .user.user-with-name
        img.avatar.avatar-small(:src="$flows.utils.getAvatarFromUser($store.currentUser)")
        .text
          .name.ellipsis {{ $flows.utils.getFullNameFromUser($store.currentUser) }}
          .details.ellipsis {{ $store.currentUser.email }}
        btn.button(:action="$flows.connection.logout" rtip="Log out" icon)
          span.icon
            i.fas.fa-sign-out-alt

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

      template(v-slot:buttons)
        span

</template>

<script>
  import Modal from "@/components/UI/Modal.vue";
  import CheckboxSwitch from "@/components/UI/CheckboxSwitch";

  export default {
    name: "Settings",
    components: { CheckboxSwitch, Modal },
    data() {
      return {
        autoMarkAsRead: null,
        desktopNotifications: null,
        showWorkspaceSwitcher: null,
        compactMode: null,
      };
    },
    mounted() {
      this.$events.$on("openSettings", () => {
        this.$refs.settingsModal?.open();
        this.updateProps();
      });
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
          }
        }
        return "Notifications disabled";
      },
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
            Notification.requestPermission().then(result => {
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
      "$store.flows.userProperties.v": function() {
        this.updateProps();
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  h4
    margin-bottom 10px
    margin-top 30px
    position relative

    &:before
      content ""
      height 2px
      background $color-light-border
      position absolute
      left 0
      right 0
      top 7px

    span
      position relative
      z-index 1
      background #fff
      padding-right 5px

  .setting-block
    margin-bottom 20px

</style>

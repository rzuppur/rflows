<template lang="pug">

  .settings-section.alwaysFullHeight

    .title-bar

      .name.ellipsis {{ loaded ? 'Settings' : 'Loading...' }}

      button.button.is-white(v-tooltip="'Close'" @click="$emit('closeSettings')" style="margin-right: 5px;")
        span.icon
          i.fas.fa-times.text-muted

    .settings.scrollbar-style
      .settings-container(v-if="loaded")

        template(v-if="!nameEdit")
          .user-with-name
            img.avatar.avatar-small(:src="flows.getAvatarFromUser(currentUser)" style="margin-right: 20px;")
            .text
              .name.ellipsis {{ flows.getFullNameFromUser(currentUser) }}
              .details.text-muted.ellipsis {{ currentUser.email }}
            button.button(v-if="currentUser.avatarUrl" v-tooltip="'Remove avatar'" @click="removeAvatar()")
              span.icon
                i.fas.fa-user-times
            button.button(v-tooltip="'Change name'" @click="openNameEdit()")
              span.icon
                i.fas.fa-edit
        template(v-if="nameEdit")
          .field.is-grouped
            .control.is-expanded
              .label First name
              input.input(type="text" v-model="user.firstName")
            .control.is-expanded
              .label Last name
              input.input(type="text" v-model="user.lastName")
          .buttons
            button.button.is-primary(@click="saveNameEdit()") Save
            button.button(@click="nameEdit = false") Cancel

        .field
          .control
            checkbox-switch(v-model="autoMarkAsRead" :checked="autoMarkAsRead")
              .label Mark messages as read automatically
                .description(v-if="autoMarkAsRead") Messages will be marked as read when opened
                .description(v-else) Messages have to be marked as read manually
        .field
          .control
            checkbox-switch(v-model="desktopNotifications" :checked="desktopNotifications")
              .label Notifications
                template(v-if="desktopNotifications")
                  .description(v-if="notificationGranted()") Notifications enabled
                  .description(v-else) Notifications are disabled from browser
                .description(v-else) Notifications are turned off
        .field
          .control
            checkbox-switch(v-model="showWorkspaceSwitcher" :checked="showWorkspaceSwitcher")
              .label Show workspace filter on sidebar
        .field
          .control
            checkbox-switch(v-model="compactMode" :checked="compactMode")
              .label Compact message display
                .description(v-if="compactMode") Maximize number of messages displayed
                .description(v-else) More space around messages

        div(style="height: 30px")
        button.button.is-outlined(@click="flows.logout") Log out

</template>

<script>
  import CheckboxSwitch from "@/components/UI/CheckboxSwitch"

  export default {
    name: "Settings",
    components: {CheckboxSwitch},
    store: ["currentUser", "topics"],
    data: function () {
      return {
        autoMarkAsRead: null,
        desktopNotifications: null,
        showWorkspaceSwitcher: null,
        compactMode: null,
        user: {
          firstName: "",
          lastName: "",
        },
        nameEdit: false,
      };
    },
    created() {
      this.$events.$on("currentChatChange", () => {this.$emit('closeSettings')});
      if (this.topics.UserProperty) {
        this.autoMarkAsRead = this.flows.autoMarkAsRead;
        this.desktopNotifications = this.flows.desktopNotifications;
        this.showWorkspaceSwitcher = this.flows.showWorkspaceSwitcher;
        this.compactMode = this.flows.compactMode;
      }
      if (this.currentUser) {
        this.user.firstName = this.currentUser.firstName;
        this.user.lastName = this.currentUser.lastName;
      }
    },
    computed: {
      loaded() {
        return this.currentUser && this.autoMarkAsRead !== null && this.desktopNotifications !== null;
      },
    },
    methods: {
      openNameEdit() {
        this.user.firstName = this.currentUser.firstName;
        this.user.lastName = this.currentUser.lastName;
        this.nameEdit = true;
      },
      saveNameEdit() {
        if (this.user.firstName.length && this.user.lastName.length) {
          this.flows.setUserName(this.user.firstName, this.user.lastName);
          this.nameEdit = false;
        } else {
          this.$events.$emit("notify", "Name can't be empty");
        }
      },
      async removeAvatar() {
        if (await this.$root.confirm("Delete avatar?", "Delete", "Cancel")) this.flows.removeAvatar();
      },
      notificationGranted() {
        return window.Notification.permission === "granted";
      },
    },
    watch: {
      autoMarkAsRead(val, oldVal) {
        if (oldVal !== null) this._debug(`autoMarkAsRead ${oldVal} => ${val}`);
        if (val === null || oldVal === null) return;
        if (this.flows.autoMarkAsRead !== val) this.flows.autoMarkAsRead = val;
      },
      showWorkspaceSwitcher(val, oldVal) {
        if (oldVal !== null) this._debug(`showWorkspaceSwitcher ${oldVal} => ${val}`);
        if (val === null || oldVal === null) return;
        if (this.flows.showWorkspaceSwitcher !== val) this.flows.showWorkspaceSwitcher = val;
      },
      desktopNotifications(val, oldVal) {
        if (oldVal !== null) this._debug(`desktopNotifications ${oldVal} => ${val}`);
        if (val === null || oldVal === null) return;
        if (this.flows.desktopNotifications !== val) this.flows.desktopNotifications = val;
        if (val === true) {
          if (Notification.permission === "default") {
            Notification.requestPermission().then(result => {
              if (result === "default") this.$events.$emit("notify", "Notifications are disabled");
              if (result === "denied") this.$events.$emit("notify", "Notifications are blocked, you can change this in site settings");
              if (result === "granted") this.$events.$emit("notify", "Notifications enabled");
            });
          }
        }
      },
      compactMode(val, oldVal) {
        if (oldVal !== null) this._debug(`compactMode ${oldVal} => ${val}`);
        if (val === null || oldVal === null) return;
        if (this.flows.compactMode !== val) this.flows.compactMode = val;
      },
      "topics.UserProperty": function (val) {
        if (val) {
          this.autoMarkAsRead = this.flows.autoMarkAsRead;
          this.desktopNotifications = this.flows.desktopNotifications;
          this.showWorkspaceSwitcher = this.flows.showWorkspaceSwitcher;
          this.compactMode = this.flows.compactMode;
        } else {
          this._debug("userProp watch reset to null");
          this.autoMarkAsRead = null;
          this.desktopNotifications= null;
          this.showWorkspaceSwitcher = null;
          this.compactMode= null;
        }
      },
      currentUser(val, oldVal) {
        if (val && (val.firstName !== oldVal.firstName || val.lastName !== oldVal.lastName)) {
          this.user.firstName = this.currentUser.firstName;
          this.user.lastName = this.currentUser.lastName;
        } else {
          this.user.firstName = "";
          this.user.lastName = "";
        }
      },
    },
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .settings-section
    height 100%
    display flex
    flex-direction column

  .title-bar
    background #fff
    box-shadow 0 1px 3px rgba(0, 0, 0, 0.1)
    overflow hidden
    z-index 1
    max-height 56px
    min-height 56px
    display flex
    align-items center
    padding 0 20px

    .name
      flex 1
      margin-right 20px
      text-title-20()
      margin-top -1px

  .settings
    flex 1
    overflow-y auto
    background $color-light-gray-background

    .settings-container
      max-width 700px
      margin 0 auto
      padding 20px
      background #fff
      box-shadow 0 0 0 2px rgba(0, 0, 0, 0.05)

      .user-with-name
        margin-bottom 30px

        .button:not(:last-child)
          margin-right -6px

      .field:not(:last-child)
        margin-bottom 20px

</style>

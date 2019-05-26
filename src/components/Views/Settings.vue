<template lang="pug">

  mixin settings(name)
    .setting-block
      checkbox-switch(v-if=name + " !== null" v-model=name name=name)
        .label=name
      .label.loading-dots(v-else) Loading


  .settings

    modal(title="Settings" ref="settingsModal")

      +settings("autoMarkAsRead")
      +settings("desktopNotifications")
      +settings("showWorkspaceSwitcher")
      +settings("compactMode")




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
    methods: {
      updateProps() {
        this.autoMarkAsRead = this.$flows.settings.getBooleanUserProp("autoMarkAsRead");
        this.desktopNotifications = this.$flows.settings.getBooleanUserProp("desktopNotifications");
        this.showWorkspaceSwitcher = this.$flows.settings.getBooleanUserProp("showWorkspaceSwitcher");
        this.compactMode = this.$flows.settings.getBooleanUserProp("compactMode");
      }
    },
    watch: {
      "$store.flows.userProperties.v": function() {
        this.updateProps();
      }
    }
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .setting-block
    margin-bottom 20px

</style>

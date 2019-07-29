<template lang="pug">

  .side.scrollbar-style(:class="{ collapsed: sideCollapsed }")

    template(v-if="chatWorkspaces.length")
      .workspace(v-for="workspace in chatWorkspaces")
        .text.show-wide
          b {{ workspace.name }}
          .text-small.text-muted {{ workspace.type.toLowerCase() | capitalize }} workspace · {{ workspace.role.toLowerCase() | capitalize }}
        img.logo(:src="$flows.utils.getLogoFromWorkspace(workspace)" :alt="workspace.name")

    .workspace(v-else)
      .text.show-wide
      .logo

    hr

    button.side-button(@click="sideCollapsed = !sideCollapsed" v-tooltip.left="{ content: sideCollapsed ? 'Expand side' : null, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }")
      span.icon.is-small
        i.fas.has-text-grey(:class="'fa-chevron-' + (sideCollapsed ? 'left' : 'right')")
      span(v-if="!sideCollapsed") #{""} Collapse side

</template>

<script>

  import { computed, onCreated, value, watch } from "vue-function-api";

  // eslint-disable-next-line no-unused-vars
  const main = (props, context) => {
    const sideCollapsed = value(false);

    watch(sideCollapsed, (newVal, oldVal) => {
      if (typeof oldVal === "undefined") return;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newVal));
    });

    onCreated(() => {
      try {
        const sideIsCollapsed = localStorage.getItem("sidebarCollapsed");
        if (sideIsCollapsed && JSON.parse(sideIsCollapsed)) sideCollapsed.value = true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
      }
    });

    return {
      sideCollapsed,
    };
  };

  // eslint-disable-next-line no-unused-vars
  const workspace = (props, context) => {

    const chatWorkspaceIds = computed(() => {
      context.root.$store.flows.chatWorkspaces.v;

      return context.root.$store.flows.chatWorkspaces.d.filter(chatWorkspace => chatWorkspace.chatId === props.chatId).map(chatWorkspace => chatWorkspace.workspaceId);
    });

    const chatUserWorkspaces = computed(() => {
      context.root.$store.flows.workspaceAccesses.v;

      const currentUserId = context.root.$store.currentUser?.id;

      return context.root.$store.flows.workspaceAccesses.d.filter(workspaceAccess => chatWorkspaceIds.value.includes(workspaceAccess.workspaceId) && workspaceAccess.userId === currentUserId);
    });

    const chatWorkspaces = computed(() => {
      context.root.$store.flows.workspaces.v;
      if (!chatUserWorkspaces.value.length) return [];

      return chatUserWorkspaces.value.map((workspaceAccess) => {
        // eslint-disable-next-line no-shadow
        const workspace = context.root.$store.flows.workspaces.d.find(workspace => workspace.id === workspaceAccess.workspaceId);
        if (!workspace) return false;
        workspace.role = workspaceAccess.role;
        return workspace;
        // eslint-disable-next-line no-shadow
      }).filter(workspace => workspace);
    });

    return {
      chatWorkspaces,
    };
  };

  //const leavingOrJoining = value(false);

  export default {
    name: "ChatMainbarSide",
    props: {
      chatId: Number,
    },
    setup(props, context) {
      return {
        ...main(props, context),
        ...workspace(props, context),
      };
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .side
    overflow-y auto
    height 100%
    min-width 260px
    padding 20px
    flex 0
    box-shadow inset 3px 0 3px -3px rgba(0, 0, 0, 0.1)
    position relative
    z-index 200

    @media (max-width $media-mobile-width)
      display none

    &.collapsed
      max-width 76px
      min-width @max-width

      .show-wide
        display none

      .side-button
        text-align center

      .workspace .logo
        width 36px
        height @width

    .workspace .logo
      background $color-light-gray-background

    .flagged h4
      margin-bottom 10px
      margin-top 20px

    .workspace
      margin 0 0 10px

    hr
      margin 10px 0

    .side-button
      text-uppercase-13()
      display block
      width 100%
      padding 0 10px
      margin-bottom 7px
      height 36px
      background alpha($color-light-blue-background, 0.6)
      border-radius $border-radius
      border none
      outline none
      cursor pointer
      transition all 0.1s
      text-align left

      &:hover,
      &:focus
        background darken($color-light-blue-background, 1)
        outline none

      &[disabled]
        opacity 0.5
        background none
        pointer-events none

    /deep/ .chat-message.side-saved
      margin-bottom 8px
      padding 2px 10px 6px
      background alpha($color-light-blue-background, 0.6)
      border-radius $border-radius

      .avatar-container
        display none


</style>

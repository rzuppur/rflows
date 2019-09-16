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

    button.side-button(@click="sideCollapsed = !sideCollapsed" v-rtip.left="sideCollapsed ? 'Expand side' : null")
      span.icon.is-small
        i.fas.has-text-grey(:class="'fa-chevron-' + (sideCollapsed ? 'left' : 'right')")
      span(v-if="!sideCollapsed") #{""} Collapse side

    button.side-button(:disabled="!flowsEmail" @click="flowsEmailCopy" v-rtip.left="sideCollapsed ? 'Copy forward email' : null")
      span.icon.is-small
        i.fas.fa-envelope.has-text-grey
      span(v-if="!sideCollapsed") #{""} Copy forward email

    button.side-button(v-if="isMemberOfCurrentChat" :disabled="leavingOrJoining || !chatId" @click="leaveChat" v-rtip.left="sideCollapsed ? 'Leave chat' : null")
      span.icon.is-small
        i.fas.fa-user-alt-slash.has-text-grey
      span(v-if="!sideCollapsed") #{""} Leave chat

    button.side-button(v-else :disabled="leavingOrJoining || !chatId" @click="joinChat" v-rtip.left="sideCollapsed ? 'Join chat' : null")
      span.icon.is-small
        i.fas.fa-user-alt.has-text-info
      span(v-if="!sideCollapsed") #{""} Join chat

    hr

    .show-wide
      h4.space-bottom-small(v-if="flaggedMessages.length") #[i.fas.fa-thumbtack.has-text-info] Saved messages

      message-display.sidebar-saved(
        v-for="message in flaggedMessages"
        :key="message.id + '_flagged_preview'"
        :message="message"
        :compact="true"
        :showReplyMessage="false"
      )

        template(v-slot:buttons)

          .control
            button.button.is-outlined.has-text-info(
              @click.stop="$events.$emit('scrollToMessage', message.id)"
              v-tooltip="'Scroll to message'"
            )
              span.icon.is-small
                i.fas.fa-arrow-left

          .control
            button.button.is-outlined.has-text-grey(
              @click.stop="$flows.messages.setMessageFlagged(message.id, false)"
              v-tooltip="'Remove from saved'"
            )
              span.icon.is-small
                i.fas.fa-times

</template>

<script>

  import { computed, ref, watch } from "@vue/composition-api";
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  // eslint-disable-next-line no-unused-vars
  const main = (props, context) => {
    const currentUserId = computed(() => context.root.$store.currentUser?.id);

    const sideCollapsed = ref(false);

    try {
      const sideIsCollapsed = localStorage.getItem("sidebarCollapsed");
      if (sideIsCollapsed && JSON.parse(sideIsCollapsed)) sideCollapsed.value = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error);
    }

    const leavingOrJoining = ref(false);

    watch(sideCollapsed, (newVal, oldVal) => {
      if (typeof oldVal === "undefined") return;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newVal));
    });

    const isMemberOfCurrentChat = computed(() => {
      context.root.$store.flows.chatUsers.v;

      return !!context.root.$store.flows.chatUsers.d.find(chatUser => chatUser.chatId === props.chatId && chatUser.userId === currentUserId.value);
    });

    const leaveChat = async () => {
      const confirm = await context.root.confirm("Leave chat?", "Leave", "Cancel", `You won't get new notifications from ${context.root.$store.currentChatName}.`);
      if (confirm) {
        leavingOrJoining.value = true;
        try {
          await context.root.$flows.chats.leaveChat(props.chatId);
          context.root.$events.$emit("notify", `Left '${context.root.$store.currentChatName}'`);
        } catch (error) {
          context.root.$events.$emit("notify", `Could not leave '${context.root.$store.currentChatName}'`);
          // eslint-disable-next-line no-console
          console.error(error);
        }
        leavingOrJoining.value = false;
      }
    };

    const joinChat = async () => {
      leavingOrJoining.value = true;
      try {
        await context.root.$flows.chats.joinChat(props.chatId);
        context.root.$events.$emit("notify", `Joined '${context.root.$store.currentChatName}'`);
      } catch (error) {
        context.root.$events.$emit("notify", `Could not join '${context.root.$store.currentChatName}'`);
        // eslint-disable-next-line no-console
        console.error(error);
      }
      leavingOrJoining.value = false;
    };

    return {
      sideCollapsed,
      leaveChat,
      joinChat,
      leavingOrJoining,
      isMemberOfCurrentChat,
    };
  };

  const flagged = (props, context) => {
    const flaggedMessages = computed(() => {
      context.root.$store.flows.messagesFlagged.v;
      context.root.$store.flows.messages[props.chatId].v;

      const currentUserId = context.root.$store.currentUser?.id;

      const flaggedMessageIds = context.root.$store.flows.messagesFlagged.d
        .filter(flaggedMessage => flaggedMessage.chatId === props.chatId && flaggedMessage.userId === currentUserId)
        .map(flaggedMessage => flaggedMessage.messageId);

      const chatMessages = context.root.$store.flows.messages[props.chatId].d;

      return flaggedMessageIds.map(
        messageId => chatMessages.find(message => message.id === messageId),
      ).filter(message => message).sort((a, b) => a.id - b.id);
    });

    return {
      flaggedMessages,
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

  const guidEmail = (props, context) => {
    const flowsEmail = computed(() => {
      context.root.$store.flows.chats.v;

      const guid = context.root.$store.flows.chats.d.find(chat => chat.id === props.chatId)?.guid;

      if (guid) return `${guid}@flow.contriber.com`;
      return false;
    });

    const flowsEmailCopy = async () => {
      if (flowsEmail.value) {
        try {
          await navigator.clipboard.writeText(flowsEmail.value);
          context.root.$events.$emit("notify", `Copied chat email to clipboard (${flowsEmail.value})`);
        } catch (error) {
          context.root.$events.$emit("notify", "Copying failed");
        }
      }
    };

    return {
      flowsEmail,
      flowsEmailCopy,
    };
  };


  export default {
    name: "ChatMainbarSide",
    components: { MessageDisplay },
    props: {
      chatId: Number,
    },
    setup(props, context) {
      return {
        ...main(props, context),
        ...flagged(props, context),
        ...workspace(props, context),
        ...guidEmail(props, context),
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
    padding 15px 20px
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
      margin 15px -20px

    .side-button
      text-uppercase-small()
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

    .sidebar-saved
      margin-bottom 8px
      padding 4px 10px 6px
      background alpha($color-light-blue-background, 0.6)
      border-radius $border-radius

      &.isEmail
        padding 10px

        & /deep/ .event-content
          margin-left 0
          margin-top 0
          margin-bottom 3px

      $_avatar_size = 18px

      & /deep/

        .avatar-container
          width $_avatar_size
          min-width @width
          max-width @width
          margin-right 5px
          padding-top 5px

          .sticky-avatar
            height $_avatar_size
            overflow hidden
            border-radius 10px

          img
            position relative
            top -3px
            width $_avatar_size
            height auto

        .text-clamped,
        .event-content,
        .file-content
          margin-left -23px
          margin-top 3px

        .file-content a
          margin-bottom 3px


</style>

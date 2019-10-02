<template lang="pug">

  .side.scrollbar-style(:class="{ collapsed: showCollapsedSidebar }")

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

    .buttons

      r-button(v-if="!mqSideCollapse" fullwidth :action="() => { sideCollapsed = !sideCollapsed; }" v-rtip.left="showCollapsedSidebar ? 'Expand side' : null" :icon="showCollapsedSidebar ? 'chevron left' : 'chevron right'")
        template(v-if="!showCollapsedSidebar") #{""} Collapse side

      r-button(:disabled="!flowsEmail" fullwidth :action="flowsEmailCopy" v-rtip.left="showCollapsedSidebar ? 'Copy forward email' : null" icon="mail")
        template(v-if="!showCollapsedSidebar") #{""} Copy forward email

      r-button(v-if="!autoReadEnabled" fullwidth :disabled="unreadMessages.length === 0 || !chatId" :action="markAllMessagesAsRead" v-rtip.left="showCollapsedSidebar ? 'Mark chat as read' : null" icon="check" icon-color="green")
        template(v-if="!showCollapsedSidebar") #{""} Mark chat as read

      r-button(v-if="isMemberOfCurrentChat" fullwidth :disabled="leavingOrJoining || !chatId" :action="leaveChat" v-rtip.left="showCollapsedSidebar ? 'Leave chat' : null"  icon="user leave")
        template(v-if="!showCollapsedSidebar") #{""} Leave chat

      r-button(v-else :disabled="leavingOrJoining || !chatId" fullwidth :action="joinChat" v-rtip.left="showCollapsedSidebar ? 'Join chat' : null" icon="user join" icon-color="blue")
        template(v-if="!showCollapsedSidebar") #{""} Join chat

    hr

    .show-wide
      h4.space-bottom-small(v-if="flaggedMessages.length")
        r-icon.blue.icon-text(icon="pin")
        | #{""} Saved messages

      message-display.sidebar-saved(
        v-for="message in flaggedMessages"
        :key="message.id + '_flagged_preview'"
        :message="message"
        :compact="true"
        :textClamp="true"
        :showReplyMessage="false"
      )

        template(v-slot:buttons)

          r-button(
            :action="() => { $events.$emit('scrollToMessage', message.id); }"
            v-rtip="'Scroll to message'"
            icon="search file"
            icon-color="blue")

          r-button(
            :action="() => { $flows.messages.setMessageFlagged(message.id, false); }"
            v-rtip="'Remove from saved'"
            icon="close")

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

    const showCollapsedSidebar = computed(() => {
      return context.root.mqSideCollapse || sideCollapsed.value;
    });

    const isMemberOfCurrentChat = computed(() => {
      context.root.$store.flows.chatUsers.v;

      return !!context.root.$store.flows.chatUsers.d.find(chatUser => chatUser.chatId === props.chatId && chatUser.userId === currentUserId.value);
    });

    const unreadMessages = computed(() => {
      if (!props.chatId) return [];

      context.root.$store.flows.messagesRead.v;
      context.root.$store.flows.messages[props.chatId].v;

      return context.root.$store.flows.messages[props.chatId].d.filter(message => message.unread);
    });

    const leaveChat = async () => {
      const confirm = await context.root.confirm("Leave chat?", "Leave", "Cancel", `You won't get new notifications from '${context.root.$store.currentChatName}'.`);
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

    const autoReadEnabled = computed(() => {
      context.root.$store.flows.userProperties.v;

      return context.root.$flows.settings.getBooleanUserProp("autoMarkAsRead");
    });

    const markAllMessagesAsRead = () => {
      context.root.$flows.messages.markMessagesAsRead(unreadMessages.value.map(message => message.id), props.chatId);
    };

    return {
      sideCollapsed,
      showCollapsedSidebar,
      leaveChat,
      joinChat,
      leavingOrJoining,
      isMemberOfCurrentChat,
      autoReadEnabled,
      unreadMessages,
      markAllMessagesAsRead,
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
    flex 0
    box-shadow inset 3px 0 3px -3px rgba(0, 0, 0, 0.1)
    position relative
    z-index 200
    padding 15px 20px

    @media (max-width 1000px)
      padding 10px 10px

    &.collapsed
      max-width 80px
      min-width @max-width

      @media (max-width 1000px)
        max-width 60px
        min-width @max-width

      .show-wide
        display none

      .side-button
        text-align center

      .workspace .logo
        width 40px
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

      @media (max-width 1000px)
        margin 10px -10px


    .buttons
      margin-bottom 0

    .r-button.fullwidth:not(.icon-only)
      justify-content flex-start

    .sidebar-saved
      margin-bottom 8px
      padding 8px 10px 6px
      background alpha($color-light-blue-background, 0.6)
      border-radius $border-radius

      & /deep/ .buttons-container
        right 0

</style>

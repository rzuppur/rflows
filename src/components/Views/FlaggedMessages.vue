<template lang="pug">

  .flagged.alwaysFullHeight

    .title-bar

      .name.ellipsis {{ loaded ? 'Saved messages' : 'Loading...' }}

      button.button.is-white(v-tooltip="'Close'" @click="$emit('closeSavedMessages')" style="margin-right: 5px;")
        span.icon
          i.fas.fa-times.text-muted

    .messages.scrollbar-style
      .workspace-container(v-for="workspace in workspaces")
        .workspace
          img.logo(:src="workspace.logo" :alt="workspace.workspace.name")
          .text
            .name {{ workspace.workspace.name }}
            .desc {{ workspace.workspace.type.toLowerCase() }} workspace

        .chat(v-for="flagged, chatId in getFlaggedByWorkspaceId(workspace.workspace.id)")
          .chat-title(@click="openChat(chatId)") {{ flows.getChatName(chatId) }}

          message-display(
            v-for="message in flagged.messageIds.sort().map(getMessage)"
            :utils="utils"
            :flows="flows"
            :key="message.id"
            :message="message"
          )

      .workspace-container(v-if="flaggedMessages !== undefined && Object.keys(flaggedMessages).length === 0")
        h3 No saved messages
        p You can save a message using the&nbsp; #[i.fas.fa-thumbtack.has-text-info(style="font-size: 14px")] &nbsp;button

</template>

<script>
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  export default {
    name: "FlaggedMessages",
    components: { MessageDisplay },
    store: ["currentUser", "topics"],
    data() {
      return {
        loaded: false,
      };
    },
    computed: {
      flaggedMessages() {
        if (this.topics.TopicItemUserProperty && this.topics.TopicUser) {
          this._debug("flaggedMessages [computed]");

          let allPromises = [];
          this.topics.TopicUser
            .filter(topicUser => topicUser.userId === this.currentUser.id && topicUser.flaggedItemsCount)
            .map(topicUser => topicUser.topicId)
            .forEach(chatId => {
              if (this.userPropsRequestedChatIds.indexOf(chatId) < 0) {
                this.userPropsRequestedChatIds.push(chatId);
                allPromises.push(this.flows.getChatMessages(chatId , {sticky: true}));
                allPromises.push(this.flows.getChatUserProps(chatId , {sticky: true}));
              }
            });
          Promise.all(allPromises).then(() => {this.loaded = true});

          // Get saved message ids from chats
          const savedChatMessages = {};
          this.topics.TopicItemUserProperty
            .filter(topicItemUserProperty => topicItemUserProperty.flag && (topicItemUserProperty.userId === this.currentUser.id))
            .forEach((saved) => {
              if (savedChatMessages[saved.topicId]) {
                savedChatMessages[saved.topicId].messageIds.push(saved.itemId);
              } else {
                savedChatMessages[saved.topicId] = {
                  messageIds: [saved.itemId],
                  workspaceId: this.flows.getChatWorkspace(saved.topicId).workspace.id,
                };
              }
            });

          return savedChatMessages;
        }
      },
      workspaces() {
        if (this.flaggedMessages) {
          const workspaces = {};

          Object.keys(this.flaggedMessages).forEach((chatId) => {
            if (!workspaces[this.flaggedMessages[chatId].workspaceId]) {
              workspaces[this.flaggedMessages[chatId].workspaceId] = this.flows.getChatWorkspace(chatId);
            }
          });

          return workspaces;
        }
      },
    },
    created() {
      this.userPropsRequestedChatIds = [];
      this.eventBus.$on("currentChatChange", () => { this.$emit("closeSavedMessages"); });
    },
    methods: {
      openChat(chatId) {
        this.flows.openChat(chatId);
      },
      getFlaggedByWorkspaceId(workspaceId) {
        const flaggedMessages = {};
        Object.keys(this.flaggedMessages).forEach((key) => {
          if (this.flaggedMessages[key].workspaceId === workspaceId) {
            flaggedMessages[key] = this.flaggedMessages[key];
          }
        });

        return flaggedMessages;
      },
      getMessage(messageId) {
        return this.flows.getChatMessage(messageId);
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .flagged
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

  .messages
    flex 1
    overflow-y auto
    background $color-light-gray-background
    padding 15px 0 60px

    .workspace-container
      max-width 850px
      margin 0 auto

      &:not(:last-child)
        margin-bottom 30px

      .workspace
        margin-top 0
        margin-bottom 20px
        margin-left 13px

        .text
          padding-left 10px
          padding-right 0

        .logo
          box-shadow 0 0 0 1px rgba(0, 0, 0, 0.05)

      .chat
        padding 10px 0
        box-shadow 0 0 0 2px rgba(0, 0, 0, 0.05)
        border-radius $border-radius
        background #fff

        &:not(:last-child)
          margin-bottom 10px

        .chat-title
          text-bold-24()
          margin-bottom 8px
          margin-left 20px
          cursor pointer

          &:hover
            text-decoration underline

        /deep/ .chat-message
          border-top 1px solid $color-light-border
          padding-bottom 8px

</style>

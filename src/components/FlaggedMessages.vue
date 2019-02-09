<template lang="pug">

  .flagged.alwaysFullHeight

    .title-bar

      .name.ellipsis {{ loaded ? 'Saved messages' : 'Loading...' }}

      button.button.is-white(v-tooltip="'Close'" @click="$emit('closeSavedMessages')" style="margin-right: 5px;")
        span.icon
          i.fas.fa-times.text-muted

    .messages.scrollbar-style
      .messages-container

        .chat(v-for="messageIds, chatId in flaggedMessages")
          .chat-title(@click="openChat(chatId)") {{ flows.getChatName(chatId) }}

          message-preview(
            v-for="messageId in messageIds.sort()"
            :messageId="messageId"
            :key="messageId"
            :clickable="false")

        template(v-if="flaggedMessages !== undefined && Object.keys(flaggedMessages).length === 0")
          .chat-title No saved messages
          p You can save a message using the&nbsp; #[i.fas.fa-thumbtack.has-text-info(style="font-size: 14px")] &nbsp;button

</template>

<script>
  import MessagePreview from "@/components/MessagePreview"

  export default {
    name: "FlaggedMessages",
    components: {MessagePreview},
    store: ["currentUser", "topics"],
    data: function () {
      return {
        loaded: false,
      };
    },
    created() {
      this.userPropsRequestedChatIds = [];
      this.eventBus.$on("currentChatChange", () => {this.$emit('closeSavedMessages')});
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
          let savedChatMessages = {};
          this.topics.TopicItemUserProperty
            .filter(topicItemUserProperty => topicItemUserProperty.flag && (topicItemUserProperty.userId === this.currentUser.id))
            .forEach(saved => {
              if (savedChatMessages[saved.topicId]) {
                savedChatMessages[saved.topicId].push(saved.itemId);
              } else {
                savedChatMessages[saved.topicId] = [saved.itemId];
              }
            });

          return savedChatMessages;
        }
      },
    },
    methods: {
      openChat(chatId) {
        this.flows.openChat(chatId);
      }
    },
  }
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

    .messages-container
      max-width 900px
      margin 0 auto
      padding 20px
      background #fff
      box-shadow 0 0 0 2px rgba(0, 0, 0, 0.05)

    .chat:not(:last-child)
      margin-bottom 20px

    .chat-title
      text-title-20()
      margin-bottom 5px
      cursor pointer

    .message-preview
      margin-bottom 7px


</style>

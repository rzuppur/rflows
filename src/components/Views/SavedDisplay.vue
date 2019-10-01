<template lang="pug">

  .saved-display

    modal(v-if="open" title="Saved messages" :sizeMedium="true" ref="savedModal" @close="open = false")

      .text-muted.space-bottom-medium(v-if="!messages") Loading
        r-button.icon-only(borderless small loading style="position: relative; top: -4px;")

      .text-muted.space-bottom-medium(v-else-if="messages.length === 0") No saved messages

      .messages(v-else)

        .chat(v-for="chat in chatsWithSaved")

          .title-4.text-bold {{ chat.name }}

          message-display(v-for="message in messages[chat.id]" :message="message" :showReplyMessage="false" :showFullDate="true")

          r-button.icon-only(v-if="messages[chat.id].length === 0" borderless small loading style="position: relative; top: -4px; left: -6px")

      template(v-slot:buttons)
        span

</template>

<script>
  import Modal from "@/components/UI/Modal.vue";
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  export default {
    name: "SavedDisplay",
    components: { MessageDisplay, Modal },
    data() {
      return {
        open: false,
        loading: false,
      };
    },
    computed: {
      chatsWithSaved() {
        this.$store.flows.chats.v;

        return this.$store.flows.chats.d.filter(chat => chat.flagged);
      },
      messages() {
        this.$store.flows.messagesFlagged.v;

        if (this.loading) return null;

        const currentUserId = this.$store.currentUser?.id;

        const flaggedMessageIds = this.$store.flows.messagesFlagged.d
          .filter(flaggedMessage => flaggedMessage.userId === currentUserId)
          .map(flaggedMessage => flaggedMessage.messageId);

        const savedMessagesByChat = {};

        this.chatsWithSaved.forEach((chatWithSaved) => {
          const savedMessages = this.$store.flows.messages[chatWithSaved.id].d.filter(message => message.flagged);
          savedMessagesByChat[chatWithSaved.id] = savedMessages;
        });

        return savedMessagesByChat;
      },
    },
    mounted() {
      this.$events.$on("openAllSavedMessages", () => {
        this.open = true;
        this.getSaved();
        this.$nextTick(() => {
          this.$refs.savedModal?.open();
        });
      });
    },
    methods: {
      getSaved() {

      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .chat
    box-shadow inset 0 0 0 2px $color-gray-border
    border-radius $border-radius * 2px
    padding 20px
    margin-bottom 10px

    .chat-message
      margin-left -20px
      margin-right -20px

      & /deep/ .saved-icon
        display none !important

</style>

<template lang="pug">

  .saved-display

    r-modal(v-if="open" title="Saved messages" size="medium" ref="savedModal" @close="open = false" :buttons="false")

      .text-muted.margin-bottom-medium(v-if="!messages") Loading
        r-button.icon-only(borderless small loading style="position: relative; top: -4px;")

      .text-muted.margin-bottom-medium(v-else-if="messages.length === 0") No saved messages

      .messages(v-else)

        .chat(v-for="chat in chatsWithSaved")

          h2.title-6 {{ chat.name }}

          message-display(v-for="message in messages[chat.id]" :message="message" :showReplyMessage="false" :showFullDate="true" :compact="true" :key="message.id")

            template(v-slot:buttons)

              r-button(
                :action="() => { $flows.messages.setMessageFlagged(message.id, false); }"
                v-rtip="'Remove from saved'"
                icon="close")

          //-r-button.margin-top-medium(small borderless gray) Open chat

          r-button.icon-only(v-if="messages[chat.id].length === 0" borderless small loading style="position: relative; top: -4px; left: -6px")

</template>

<script>
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  export default {
    name: "SavedDisplay",
    components: { MessageDisplay },
    data() {
      return {
        open: false,
      };
    },
    computed: {
      chatsWithSaved() {
        this.$store.flows.chats.v;

        return this.$store.flows.chats.d.filter(chat => chat.flagged);
      },
      messages() {
        this.$store.flows.messagesFlagged.v;

        const savedMessagesByChat = {};
        this.chatsWithSaved.forEach((chatWithSaved) => {
          savedMessagesByChat[chatWithSaved.id] = this.$store.flows.messages[chatWithSaved.id].d.filter(message => message.flagged);
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
        this.chatsWithSaved.forEach((chat) => {
          this.$flows.messages.getChatFlagged(chat.id);
          this.$flows.messages.getChatMessages(chat.id, { sticky: true });
        });
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
      padding-top 7px

</style>

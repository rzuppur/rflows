<template lang="pug">

  .search-messages

    r-modal(v-if="$store.currentUser && !$store.connection.error" :title="false" ref="searchModal" :buttons="false" size="medium")

      .r-flex-container.r-margin-top-medium
        .r-flex-1
          r-text-input(v-model="searchText" placeholder="Search messages" :invalid-message="searchText.length > 0 && searchText.length < 3 ? 'Too short' : null" ref="searchBox" autofocus)
        .r-flex-0.r-margin-left-tiny
          r-button(icon="close" :action="closeAndClear")

      .r-margin-top-medium(v-if="results.length")

      .chat(v-for="messages, chatId in resultsByChat")
        h2.r-title-6 {{ $store.flows.chats.d.find(x => x.id === +chatId) && $store.flows.chats.d.find(x => x.id === +chatId).name || '?' }}

        message-display(v-for="message in messages" :message="message" :showReplyMessage="false" :showFullDate="true" :compact="true" :key="message.id")
          template(v-if="['CHAT', 'EVENT', 'NOTE'].includes(message.type)" v-slot:content)
            highlighter.highlighted-text.text-content(v-if="message.type === 'NOTE'" :searchWords="searchWords" :textToHighlight="$flows.messages.getMessageTextRepresentation(message.text)" :autoEscape="true")
            highlighter.highlighted-text.event-content.r-text-color-quiet(v-else-if="message.type === 'EVENT'" :searchWords="searchWords" :textToHighlight="$flows.messages.getMessageTextRepresentation(message.text)" :autoEscape="true")
            highlighter.highlighted-text.text-content(v-else :searchWords="searchWords" :textToHighlight="message.text" :autoEscape="true")

      p.r-text-color-quiet.r-margin-top-medium(v-if="notFound") No messages found

</template>

<script>
  import Highlighter from "vue-highlight-words";
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";
  import { mapMessage } from "@/js/model/Message";

  export default {
    name: "Search",
    components: { MessageDisplay, Highlighter },
    data() {
      return {
        searchText: "",
        results: [],
        searchTimeout: null,
        notFound: false,
      };
    },
    computed: {
      searchWords() {
        const words = this.searchText.split(" ").map(x => x.trim());
        words.forEach((word) => {
          if (word.length > 2) {
            words.push(word.substring(0, word.length - 1));
          }
        });
        return words;
      },
      resultsByChat() {
        const byChat = {};
        this.results.forEach((message) => {
          if (byChat[message.chatId]) {
            byChat[message.chatId].push(message);
          } else {
            byChat[message.chatId] = [message];
          }
        });
        return byChat;
      },
    },
    watch: {
      searchText: {
        handler(val, lastVal) {
          if (val === lastVal) {
            return;
          }
          if (val.trim() === "") {
            this.clear();
            return;
          }
          if (!this.searchTimeout) {
            this.notFound = false;
            this.searchTimeout = setTimeout(() => {
              this.searchTimeout = null;
              this.updateResults();
            }, 300);
          }
        },
      },
    },
    mounted() {
      this.$events.$on("openSearch", () => {
        this.$refs.searchModal?.open();
        setTimeout(() => {
          this.$refs.searchBox?.$el.children[0].focus();
        }, 50);
      });
    },
    methods: {
      clear() {
        this.results = [];
        this.searchText = "";
        this.notFound = false;
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
      },
      closeAndClear() {
        this.clear();
        this.$refs.searchModal?.close();
      },
      async updateResults() {
        const text = this.searchText.trim();
        if (this.searchTimeout) {
          return;
        }
        if (text.length < 3) {
          this.results = [];
          this.searchTimeout = null;
          return;
        }
        const result = await this.$flows.connection.messageWithResponse("/app/TopicItem.search", { text });

        if (this.searchTimeout) {
          return;
        }
        this.results = result.body.map(mapMessage);
        this.notFound = result.body.length === 0;
        this.searchTimeout = null;
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

    .darkMode &
      box-shadow inset 0 0 0 2px $color-border-medium-darkmode

    .chat-message
      margin-left -20px
      margin-right -20px
      padding-top 7px

  .highlighted-text
    display block
    white-space pre-line


</style>

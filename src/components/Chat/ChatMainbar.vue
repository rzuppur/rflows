<template lang="pug">

  .chat

    .mainbar

      .chat-title

        btn.button.is-white(
          v-if="mqMobile"
          tip="Change chat"
          tloc="right"
          :action="() => { $events.$emit('showSidebar') }"
        )
          span.icon.text-muted(v-if="!$store.unreadMessagesTotal")
            i.fas.fa-bars
          span.icon.unread-total(v-else) {{ $store.unreadMessagesTotal.replace(/\(|\)/g, "") }}

        btn.button.fav-toggle.is-white(
          v-if="!isDevChat"
          :tip="isStarred ? 'Remove from favorites' : 'Add to favorites'"
          :action="toggleFavourite"
        )
          span.icon
            i.fa-star(:class="{ fas: isStarred, far: !isStarred }")

        .name.ellipsis {{ $store.currentChatName }}
          .placeholder(v-if="!$store.currentChatName")

        .flex0
          portal-target(name="scrollToShortcuts")

        user-list(:users="chatMembers")

      connection-status(v-if="mqMobile")

      chat-mainbar-message-list(:chatId="chatId" :chatMembersWriting="chatMembersWriting")

      .chat-bottom

        .text-small.top-info-text(v-if="!mqMobile && !showEditorToolbar && editorFocused") ↵ Enter for new line &nbsp;·&nbsp; Shift + Enter to send

        .flex.chat-inputs

          .field.is-grouped.flex1

            .control.is-expanded(v-show="!uploadExpanded")

              editor(
                ref="editor"
                :showButtons="showEditorToolbar ? 'ALWAYS' : 'HIDE'"
                :onlyText="false"
                :placeholder="messageInputPlaceholder"
                :initEmpty="true"
                @submit="sendChatMessage()"
                @update="editorUpdate"
                @focus="editorFocused = true"
                @blur="editorFocused = false"
                @keydown.native.capture.esc="replyCancel"
                @keydown.38.native.exact.capture="editLastMessage"
                @keydown.ctrl.38.native.exact.capture="replyLastMessage")

            .control(v-show="!uploadExpanded && (showEditorToolbar || !mqMobile)")

              btn.expand-button(
                :class="{ expanded: showEditorToolbar }"
                :action="() => { showEditorToolbar = !showEditorToolbar; }"
                :tip="showEditorToolbar ? 'Hide editing toolbar' : 'Show editing toolbar'")

            file-upload(
              ref="fileUpload"
              :class="{ flex0: !uploadExpanded, flex1: uploadExpanded}"
              :chatId="chatId"
              :replyToId="replyToId"
              @expandChange="uploadExpanded = $event"
              @fileUploaded="replyCancel()")

            template(v-if="!uploadExpanded")

              .control(v-if="replyToId")
                r-button(:action="replyCancel" :icon="mqMobile ? 'close' : null")
                  template(v-if="!mqMobile") Cancel

              .control
                r-button(:primary="!!replyToId" :action="sendChatMessage" :icon="mqMobile ? 'send' : null")
                  template(v-if="!mqMobile") Send

    chat-mainbar-side(:chatId="chatId")

</template>

<script>

  import { DEVCHAT_ID } from "@/js/consts";
  import ChatMainbarMessageList from "@/components/Chat/ChatMainbarMessageList.vue";
  import ChatMainbarSide from "@/components/Chat/ChatMainbarSide.vue";
  import Editor from "@/components/UI/Editor.vue";
  import FileUpload from "@/components/FileUpload.vue";
  import UserList from "@/components/Chat/UserList.vue";
  import ConnectionStatus from "@/components/App/ConnectionStatus.vue";

  import members from "./ChatMainbarMembers";
  import starred from "./ChatMainbarStarred";
  import saveRestore from "./ChatMainbarSaveRestoreEditor";

  export default {
    name: "ChatMainbar",
    components: { ChatMainbarSide, ConnectionStatus, ChatMainbarMessageList, Editor, FileUpload, UserList },
    data() {
      return {
        showEditorToolbar: false,
        editorFocused: false,
        uploadExpanded: false,
        isTyping: false,
      };
    },
    computed: {
      replyToId() {
        return this.$store.currentChatReplyToId;
      },
      chatId() {
        return this.$store.currentChatId;
      },
      isDevChat() {
        return this.chatId === DEVCHAT_ID;
      },
      messageInputPlaceholder() {
        this.$store.flows.users.v;

        if (this.replyToId) {
          const replyingToMessage = this.$store.flows.messages[this.chatId].d.find(message => message.id === this.replyToId);
          if (replyingToMessage?.userId) {
            const replyingToUser = this.$store.flows.users.d.find(user => user.id === replyingToMessage.userId);
            if (replyingToUser) return `Reply to ${this.$flows.utils.getFullNameFromUser(replyingToUser)}`;
          }
          if (this.$store.currentChatName.length) return `Reply to ${this.$store.currentChatName}`;
          return "Reply";
        }
        if (this.$store.currentChatName.length) return `Message ${this.$store.currentChatName}`;
        return "";
      },
    },
    watch: {
      "$store.currentChatId": {
        immediate: true,
        handler(val, oldVal) {
          if (val === oldVal) return;
          if (val) {
            this.$flows.chats.getChatUsers(val);
            this.$flows.chats.setChatOpen(val, true);
          }
          if (oldVal) {
            this.$flows.chats.setChatOpen(oldVal, false);
          }
          this.isTyping = false;
        },
      },
    },
    mounted() {
      this.$events.$on("replyStart", this.replyStart);
      this.$events.$on("replyCancel", this.replyCancel);
    },
    methods: {
      sendChatMessage() {
        const text = this._getEditorContent();
        const { replyToId } = this;
        if (this.chatId && this.utils.editorTextNotEmpty(text)) {
          this.replyCancel();
          this.editorClear();
          const textCleared = text.replace(/<p>/g, "").replace(/<br>|<\/p>/g, "\n").trim();
          const isHTML = /<[a-z][\s\S]*>/i.test(textCleared);
          this.$flows.messages.sendMessage({
            type: isHTML ? "NOTE" : "CHAT",
            text: isHTML ? text : this.utils.unEscapeHTML(textCleared),
            referenceFromTopicItemId: replyToId,
          }, this.chatId);
        }
      },
      replyStart(messageId) {
        this.$store.currentChatReplyToId = messageId;
        if (this.$refs.editor) {
          this.$refs.editor.focus();
        }
      },
      // eslint-disable-next-line no-unused-vars
      replyCancel(messageId) {
        this.$store.currentChatReplyToId = null;
      },
      editorClear() {
        if (this.$refs.editor) {
          this.$refs.editor.empty();
        }
        this.showEditorToolbar = false;
        setTimeout(() => { this.$flows.chats.setTypingStatus(false, this.chatId); }, 0);
      },
      _getEditorContent() {
        return this.$refs.editor ? this.$refs.editor.getHTML() : "";
      },
      editorUpdate(text) {
        const isTyping = this.utils.editorTextNotEmpty(text);

        if (isTyping !== this.isTyping) {
          if (isTyping) {
            this.$events.$emit("MESSAGELIST_scrollToBottomInstant");
          }
          try {
            this.$flows.chats.setTypingStatus(isTyping, this.chatId);
          } catch (e) {
            this._debug("Could not set typing status:", e);
          }
          this.isTyping = isTyping;
        }
      },
      editLastMessage(event) {
        const text = this._getEditorContent();
        if (text === "<p></p>") {
          event.stopPropagation();
          const myMessages = this.$store.flows.messages[this.chatId].d.filter(message => message.userId === this.$store.currentUser.id);
          if (myMessages.length) {
            const messageId = myMessages[myMessages.length - 1].id;
            this.$events.$emit("editMessage", messageId);
          }
        }
      },
      replyLastMessage(event) {
        event.stopPropagation();
        const messages = this.$store.flows.messages[this.chatId].d;
        if (messages.length) {
          const messageId = messages[messages.length - 1].id;
          this.replyStart(messageId);
        }
      },
    },
    setup(props, context) {
      return {
        ...members(props, context),
        ...starred(props, context),
        ...saveRestore(props, context),
      };
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .data
    white-space pre
    font-sans($font-size-small)
    font-size 12px
    line-height 1.15

  .chat
    display flex
    height 100%

  .mainbar
    flex 3
    min-width 0
    height 100%
    display flex
    flex-direction column

  .chat-title
    position relative
    z-index 100
    background #fff
    box-shadow 0 1px 0 alpha(#000, .05)
    height 56px
    min-height 56px
    max-height 56px
    overflow hidden
    display flex
    align-items center
    padding 0 20px 0 17px

    @media (max-width $media-mobile-width)
      padding 0 10px

    .button
      margin-right 10px

    .fav-toggle
      .far
        color $color-gray-text-light

      .fas
        color $color-gold

    .name
      font-sans($font-size-medium-1, $font-weight-sans-bold)
      margin-left 1px
      margin-right 10px
      min-width 125px
      flex 1 1 auto

      .placeholder
        background alpha(#000, .05)
        height 18px
        border-radius @height
        max-width 170px

    .unread-total
      background $color-blue
      border-radius $border-radius
      color #fff
      font-sans($font-size-normal, $font-weight-sans-bold)

  .chat-bottom
    position relative
    z-index 20
    background #fff
    padding 10px 20px 8px
    box-shadow 0 -1px 0 alpha(#000, .05)

    .top-info-text
      position absolute
      top -15px
      padding 2px 6px 5px
      border-top-left-radius $border-radius
      border-top-right-radius $border-radius
      background #fff
      color $color-gray-text

    .chat-inputs
      margin-bottom 6px

      .flex0,
      .control
        align-self flex-end

      .field
        min-width 0
        margin-bottom 0

        .expand-button
          margin-left 0
          margin-right 0

    .control.is-expanded
      min-width 0

    .editor

      /deep/ .menubar .buttons
        overflow-y auto
        flex-wrap nowrap

      /deep/ .ProseMirror // @stylint ignore
        max-height 250px
        overflow-y auto

</style>

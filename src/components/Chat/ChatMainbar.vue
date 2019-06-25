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
          span.icon.text-muted
            i.fas.fa-bars

        btn.button.fav-toggle.is-white(
          v-if="!isDevChat"
          :tip="isStarred ? 'Remove from favorites' : 'Add to favorites'"
          :action="toggleFavourite"
        )
          span.icon
            i.fa-star(:class="{ fas: isStarred, far: !isStarred }")

        .name.ellipsis {{ $store.currentChatName }}
          .placeholder(v-if="!$store.currentChatName")

        user-list(:users="chatMembers")

      connection-status(v-if="mqMobile")

      chat-mainbar-message-list(:replyToId="replyToId" :chatId="chatId" :chatMembersWriting="chatMembersWriting")

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
                @update="checkTypingStatus()"
                @focus="editorFocused = true"
                @blur="editorFocused = false"
                @keydown.38.native.exact.capture="editLastMessage")

            .control(v-show="!uploadExpanded")

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

            .control(v-if="replyToId" v-show="!uploadExpanded")
              btn.button.is-outlined(:action="replyCancel")
                span(v-if="!mqMobile") Cancel
                span.icon(v-if="mqMobile")
                  i.fas.fa-times

            .control(v-show="!uploadExpanded")
              btn.button(:class="{ 'is-primary': replyToId }" :action="sendChatMessage")
                span(v-if="!mqMobile") Send
                span.icon(v-if="mqMobile")
                  i.fas.fa-paper-plane

</template>

<script>

  import { DEVCHAT_ID } from "@/js/consts";
  import ChatMainbarMessageList from "@/components/Chat/ChatMainbarMessageList.vue";
  import Editor from "@/components/UI/Editor.vue";
  import FileUpload from "@/components/FileUpload.vue";
  import UserList from "@/components/Chat/UserList.vue";
  import ConnectionStatus from "@/components/App/ConnectionStatus.vue";

  export default {
    name: "ChatMainbar",
    components: { ConnectionStatus, ChatMainbarMessageList, Editor, FileUpload, UserList },
    data() {
      return {
        replyToId: null,

        showEditorToolbar: false,
        editorFocused: false,
        uploadExpanded: false,
      };
    },
    computed: {
      chatId() {
        return this.$store.currentChatId;
      },
      isDevChat() {
        return this.chatId === DEVCHAT_ID;
      },
      isStarred() {
        this.$store.flows.userProperties.v;

        return this.$flows.chats.favChatIds.includes(this.chatId);
      },
      chatMembers() {
        this.$store.flows.chatUsers.v;
        this.$store.flows.users.v;

        return this.$store.flows.chatUsers.d.filter(chatUser => chatUser.chatId === this.chatId).map((chatUser) => {
          const user = this.$store.flows.users.d.find(user_ => user_.id === chatUser.userId);
          if (!user) {
            return {
              ...chatUser,
              name: "",
              avatar: this.$flows.utils.getAvatarFromUser(),
              userStatus: "?",
            };
          }
          return {
            ...chatUser,
            name: this.$flows.utils.getFullNameFromUser(user),
            avatar: this.$flows.utils.getAvatarFromUser(user),
            userStatus: user.status,
          };
        });
      },
      chatMembersWriting() {
        return this.chatMembers.filter(chatMember => chatMember.status === "TYPING").map((user) => {
          return {
            avatar: user.avatar,
            name: user.name,
            userId: user.userId,
          };
        });
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
        },
      },
    },
    mounted() {
      this.$events.$on("replyStart", this.replyStart);
      this.$events.$on("replyCancel", this.replyCancel);
    },
    methods: {
      toggleFavourite() {
        if (this.isStarred) {
          this.$flows.chats.favChatIds = this.$flows.chats.favChatIds.filter(favId => favId !== this.chatId);
          return;
        }
        this.$flows.chats.favChatIds = this.$flows.chats.favChatIds.concat([this.chatId]);
      },
      sendChatMessage() {
        console.log("todo: sendChatMessage");
      },
      replyStart(messageId) {
        this.replyToId = messageId;
      },
      // eslint-disable-next-line no-unused-vars
      replyCancel(messageId) {
        this.replyToId = null;
      },
      checkTypingStatus() {
        console.log("todo: checkTypingStatus");
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .data
    white-space pre
    text-regular-13()
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
      padding 0 10px 0 17px

    .button
      margin-right 12px

    .fav-toggle
      .far
        color $color-gray-text-light

      .fas
        color $color-gold

    .name
      text-title-20()
      margin-right 10px
      min-width 150px
      flex 1 1 auto

      .placeholder
        background alpha(#000, .05)
        height 18px
        border-radius @height
        max-width 170px

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

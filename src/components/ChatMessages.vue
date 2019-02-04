<template lang="pug">
  .chat
    .mainbar(:class="{focusMode: replyToId}")
      .chat-title
        button.button.favToggle.is-white(v-tooltip="isStarred ? 'Remove from favorites' : 'Add to favorites'" @click="toggleFavourite()")
          span.icon
            i.fa-star(:class="{ fas: isStarred, far: !isStarred }")
        .name.ellipsis {{ currentChatName }}
        template(v-if="topicUsers")
          template(v-for="user in topicUsers")
            .user(v-if="user"
            v-tooltip="flows.getFullName(user.userId) + ' (' + user.role.toLowerCase() + ')'"
            :status="flows.getUserStatus(user.userId)")
              img.avatar.avatar-small(:src="flows.getAvatar(user.userId)" :status="user.status")
              .online-status
              .unreads(v-if="user.unreadItemsCount") {{ user.unreadItemsCount }}
      .messages-container.scrollbar-style(ref="messages" @scroll="scrollTrack")
        .messages(v-if="!hidden && sortedMessages && topics.User" v-images-loaded:on.progress="scrollUpdate")
          template(v-for="(message, i) in sortedMessages" v-if="message && topics.User && sortedMessages")
            .day-separator(v-if="!i || !utils.datesAreSameDay(sortedMessages[i-1].createDate, message.createDate)")
              .text {{ utils.weekdayDateTimeAddOtherYear(message.createDate) | capitalize }}
            .unread-separator(
            ref="unread"
            v-if="firstUnreadMessageId === message.id"
            :class="{ rised: !!(!i || !utils.datesAreSameDay(sortedMessages[i-1].createDate, message.createDate)) }")
              .text new messages

            message(
            :message="message"
            :i="i"
            :replyToId="replyToId"
            :sortedMessages="sortedMessages"
            :isAdmin="isAdmin"
            :autoMarkAsRead="flows.autoMarkAsRead"
            :firstUnreadMessageId="firstUnreadMessageId"
            :key="message.id"
            :ref="'message-' + message.id"
            @replyStart="replyStart($event)"
            @replyCancel="replyCancel()")
        .typing(v-if="typingUsersText" v-html="typingUsersText")
        div(ref="messagesEnd")


      .chat-bottom

        .flex.chat-inputs

          .field.is-grouped.flex1
            .control.is-expanded(v-show="!uploadExpanded")
              editor(ref="editor"
              showButtons="ALWAYS"
              :onlyText="false"
              :placeholder="messageInputPlaceholder"
              :initEmpty="true"
              @submit="sendChatMessage()"
              @update="checkTypingStatus()"
              @focus="editorFocused = true"
              @blur="editorFocused = false"
              @keydown.38.native.exact.capture="editLastMessage")

            file-upload(
              ref="fileUpload"
              :class="{ flex0: !uploadExpanded, flex1: uploadExpanded}"
              :chatId="currentChatId"
              v-on:expandChange="uploadExpanded = $event")

            .control(v-if="replyToId" v-show="!uploadExpanded")
              button.button.is-outlined(@click="replyCancel()") Cancel
              //- TODO: on mobile buttons above each other
            .control(v-show="!uploadExpanded")
              button.button(:class="{ 'is-primary':  replyToId}" @click="sendChatMessage()") Send


        .has-text-grey.text-small.bottom-info-text(v-if="!editorFocused && flowsEmail")
          | Forward emails to chat:&nbsp;
          span.ellipsis(@click="flowsEmailCopy()" v-tooltip="'Copy to clipboard'" style="text-decoration: underline; cursor: pointer;") {{ flowsEmail }}
        .has-text-grey.text-small.bottom-info-text(v-if="editorFocused") ↵ Enter for new line &nbsp;·&nbsp; Shift + Enter to send

    .sidebar.scrollbar-style(style="overflow-y: auto; height: 100%;")
      .flagged(v-if="!hidden && flaggedMessageIds")
        h4 #[i.fas.fa-thumbtack.has-text-info] Saved messages
        div(v-for="messageIds, userId in flaggedMessageIds" v-if="+userId === currentUser.id")
          message-preview.sidebar-saved(
          v-for="messageId in messageIds.sort()"
          :messageId="messageId"
          :key="messageId + '-currentUser'")
        //-div(v-for="messageIds, userId in flaggedMessageIds" v-if="userId != currentUser.id") #[h4.other {{ flows.getFirstName(userId) }}:]
          message-preview.sidebar-saved(v-for="messageId in messageIds" :messageId="messageId" :key="messageId + '-' + userId")
      div(style="margin: 10px 0;")
        a(@click="$emit('viewSavedMessages')" style="display: block; margin-top: 4px;") All saved messages
        a(v-if="firstUnreadMessageId !== -1" @click="flows.markCurrentChatRead()" style="display: block;") Mark all as read
        a(v-if="firstUnreadMessageId !== -1" @click="scrollToNew()" style="display: block;") First unread
        a(v-if="!scroll.keepScrollBottom" @click="scrollToBottom()" style="display: block;") Scroll to bottom
      p.has-text-grey(v-if="isAdmin") You have administrator rights<br>
      button.button.is-fullwidth.is-outlined(@click="flows.logout" style="margin-top: 20px") Log out
</template>

<script>
  import imagesLoaded from "vue-images-loaded"

  import {SCROLL_DEBOUNCE_TIME} from "@/js/consts";

  import Message from "@/components/Message"
  import MessagePreview from "@/components/MessagePreview"
  import Editor from "@/components/Editor"
  import FileUpload from "@/components/FileUpload"

  export default {
    name: 'ChatMessages',
    directives: {imagesLoaded},
    components: {Message, MessagePreview, Editor, FileUpload},
    props: ["favouriteIds", "hidden"],
    store: ["currentChatId", "currentChatName", "currentUser", "topics"],
    data() {
      return {
        replyToId: null,
        newChat: true,
        scrolledToNew: false,
        scroll: {
          keepScrollBottom: true,
          height: null,
          top: null,
        },
        isTyping: false,
        editorFocused: false,
        uploadExpanded: false,
        unreadId: null, // for autoUnread to keep new indicator in place
      }
    },
    created() {
      this.eventBus.$on("messagesScrollUpdate", this.scrollUpdate);
      this.eventBus.$on("scrollToMessage", messageId => this.scrollToMessage(messageId));
      this.eventBus.$on("currentChatChange", this.markNewChat);
    },
    mounted() {
      this.$root.updateFullHeight();
    },
    computed: {
      sortedMessages() {
        if (this.topics.TopicItem && this.currentUser) {
          this.newChatScrollToBottom();
          this.scrollUpdate();
          const currentChatMessages = this.topics.TopicItem.filter(msg =>
            msg.topicId === this.currentChatId
              //&& (msg.parentTopicItemId && topic.TopicItem.find(m => m.id == msg.parentTopicItemId).type == 'NOTE')) TODO: display email childs, hide note childs
              && !msg.parentTopicItemId
              && !msg.deleted);
          let sorted = currentChatMessages.sort((a, b) => a.id - b.id);
          for (let i = 0; i < sorted.length; i++) {

            // Load referenced messages
            if (!sorted[i].refsLoaded && sorted[i].referenceFromTopicItemId) {
              sorted[i].refsLoaded = true;
              setTimeout(() => {
                this.findOrLoadMessage(sorted[i].referenceFromTopicItemId);
              }, 2000);
            }

            // Check if message is unread
            if (!sorted[i].shadow && this.chatUser && this.messagesRead) {
              let unread = true;
              this.messagesRead.forEach(readRange => {
                if (readRange.itemFrom <= sorted[i].id && readRange.itemTo >= sorted[i].id) unread = false;
              });
              sorted[i].unread = unread;
            } else {
              sorted[i].unread = false;
            }

            // Check if message is flagged
            sorted[i].flagged = false;
            if (this.flaggedMessageIds && this.flaggedMessageIds[this.currentUser.id] && this.flaggedMessageIds[this.currentUser.id].length) {
              const flagged = this.flaggedMessageIds[this.currentUser.id].find(messageId => messageId === sorted[i].id);
              if (flagged) sorted[i].flagged = true;
            }

          }
          return sorted;
        }
      },
      messagesRead() {
        this.scrollUpdate();
        return this.topics.TopicItemRead.filter(TopicItemRead => {
          return TopicItemRead.topicId === this.currentChatId && TopicItemRead.userId === this.currentUser.id;
        });
      },
      firstUnreadMessageId() {
        if (this.messagesRead && this.sortedMessages) {
          if (this.flows.autoMarkAsRead) {
            if (!this.unreadId) {
              let firstUnread = this.sortedMessages.find(message => message.unread);
              if (firstUnread) this.unreadId = firstUnread.id;
            }
            this.flows.markCurrentChatRead();
            return this.unreadId;
          } else {
            let firstUnread = this.sortedMessages.find(message => message.unread);
            return firstUnread ? firstUnread.id : -1;
          }
        }
      },
      flaggedMessageIds() {
        if (this.topics.TopicItemUserProperty && this.topicUsers) {
          let flagged = {};
          this.topics.TopicItemUserProperty
            .filter(x => x.flag && x.topicId === this.currentChatId)
            .forEach(flaggedMessage => {
              const userId = flaggedMessage.userId;
              if (this.topicUsers.map(user => user.userId).indexOf(userId) >= 0) {
                const messageId = flaggedMessage.itemId;
                this.$nextTick(() => this.findOrLoadMessage(messageId));
                if (flagged[userId]) {
                  flagged[userId].push(messageId);
                } else {
                  flagged[userId] = [messageId];
                }
              }
            });
          return flagged;
        }
      },
      topicUsers() {
        if (this.topics.TopicUser && this.topics.User) {
          return this.topics.TopicUser.filter(topicUser => topicUser.topicId === this.currentChatId).sort((a, b) => a.createDate - b.createDate);
        }
      },
      messageInputPlaceholder() {
        if (this.replyToId) {
          const message = this.topics.TopicItem.find(ti => ti.id === this.replyToId);
          return 'Reply to ' + (message.creatorUserId
            ? this.flows.getFullName(message.creatorUserId)
            : this.currentChatName);
        } else {
          return 'Message ' + this.currentChatName;
        }
      },
      isStarred() {
        if (this.currentChatId) {
          return (this.favouriteIds.indexOf(this.currentChatId) > -1)
        } else {
          return false;
        }
      },
      typingUsersText() {
        if (this.topicUsers && this.currentUser) {
          let users = this.topicUsers
            .filter(topicUser => topicUser.userId !== this.currentUser.id && topicUser.status === "TYPING")
            .map(user => this.flows.getFirstName(user.userId));
          if (users.length) {
            if (users.length > 1) {
              return `${users.splice(0, users.length - 1).join(", ")} and ${users[users.length - 1]} are typing<span class='loading-dots'></span>`;
            }
            return `${users[0]} is typing a message<span class='loading-dots'></span>`;
          }
          this.scrollUpdate();
        }
      },
      flowsEmail() {
        if (this.topics.Topic && this.currentChatId) {
          const chat = this.topics.Topic.find(chat => chat.id === this.currentChatId);
          if (chat && chat.guid) return `${chat.guid}@flow.contriber.com`;
        }
      },
      chatUser() {
        if (this.topicUsers && this.currentUser) {
          return this.topicUsers.find(topicUser => topicUser.userId === this.currentUser.id);
        }
      },
      isAdmin() {
        if (this.topicUsers && this.currentUser) {
          const user = this.chatUser;
          return user ? user.role === "ADMIN" : false;
        }
      },
    },
    methods: {
      /**
       * @param messageId {number}
       * @returns {Promise<Object|SocketResponse>}
       */
      findOrLoadMessage(messageId) {
        const existingMessage = this.sortedMessages.find(message => message.id === messageId);
        if (existingMessage) {
          return new Promise(resolve => resolve(existingMessage));
        } else {
          return this.flows.getChatMessages(this.currentChatId, {from: {id: messageId}, amount: 1});
        }
      },
      checkTypingStatus() {
        const text = this.$refs.editor ? this.$refs.editor.getHTML() : "";
        const isTyping = text.replace(/<p>|<\/p>|<br>|<br\/>/g, "").trim() !== "";

        if (isTyping !== this.isTyping) {
          this.flows.setTypingStatus(isTyping);
          this.isTyping = isTyping;
        }
      },
      sendChatMessage() {
        const text = this.$refs.editor ? this.$refs.editor.getHTML() : "";
        const replyToId = this.replyToId;
        if (text.replace(/<p>|<\/p>|<br>|<br\/>/g, "").trim() !== "") {
          setTimeout(this.scrollToBottomSmooth, 100);
          this.replyCancel();
          this.editorClear();
          const textCleared = text.replace(/<p>/g, "").replace(/<br>|<\/p>/g, "\n").trim();
          const isHTML = /<[a-z][\s\S]*>/i.test(textCleared);
          this.flows.sendChatMessage({
            type: isHTML ? "NOTE" : "CHAT",
            text: isHTML ? text : this.utils.unEscapeHTML(textCleared),
            referenceFromTopicItemId: replyToId,
          });
        }
      },
      toggleFavourite() {
        if (this.isStarred) {
          this.flows.removeChatFromStarred(this.currentChatId)
          .then(() => this.eventBus.$emit("notify", this.currentChatName + " removed from favorites"));
        } else {
          this.flows.addChatToStarred(this.currentChatId)
          .then(() => this.eventBus.$emit("notify", this.currentChatName + " added to favorites"));
        }
      },
      editorFocus() {
        if (this.$refs.editor) this.$refs.editor.focus();
      },
      editorClear() {
        if (this.$refs.editor) this.$refs.editor.empty();
        this.isTyping = false;
        this.flows.setTypingStatus(false);
      },
      replyStart(id) {
        this.replyToId = id;
        this.scrollUpdate();
        this.editorFocus();
      },
      replyCancel() {
        this.replyToId = null;
      },
      markNewChat() {
        if (this.DEBUG) this._logDebug("Marking new chat", "markNewChat");
        this.newChat = true;
        this.scrolledToNew = false;
        this.scroll.height = 0;
        this.scroll.top = 0;
        this.unreadId = null;
        this.newChatScrollToBottom();
      },
      scrollToNewOnce() {
        if (!this.scrolledToNew) {
          this.scrollToNew();
        }
      },
      scrollToNew() {
        if (this.$refs.unread && this.$refs.unread[0]) {
          this.scroll.keepScrollBottom = false;
          this._debug("Scrolling to new");
          this.$refs.unread[0].scrollIntoView({behavior: "smooth", block: "start"});
          this.scrolledToNew = true;
          if (this.scrollToNewCheckBottomTimeout) clearTimeout(this.scrollToNewCheckBottomTimeout);
          this.scrollToNewCheckBottomTimeout = setTimeout(this._checkScrollBottom, 500);
        }
      },
      scrollToMessage(messageId, instant) {
        this.scroll.keepScrollBottom = false;
        const message = this.$refs['message-' + messageId] && this.$refs['message-' + messageId][0]
          ? this.$refs['message-' + messageId][0]
          : null; // this.findOrLoadMessage(messageId);
        if (message && message.$el) {
          message.$el.scrollIntoView({behavior: (instant ? "auto" : "smooth"), block: "start"});
          message.highlight();
        }
      },
      scrollToBottom() {
        this.scroll.keepScrollBottom = true;
        if (this.$refs.messages) {
          this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
        }
      },
      scrollToBottomSmooth() {
        if (this.$refs.messagesEnd) {
          this.scroll.keepScrollBottom = true;
          this.$refs.messagesEnd.scrollIntoView({behavior: "smooth", block: "start"});
        }
      },
      scrollUpdate()  {
        if (!this.scrollUpdateTimer) {
          this.scrollUpdateTimer = setTimeout(this._scrollUpdate, SCROLL_DEBOUNCE_TIME);
        }
      },
      _scrollUpdate()  {
        this._debug("Scroll height update");
        this.scrollUpdateTimer = null;
        this.$nextTick(this.scrollToNewOnce);

        if (this.$refs.messages) {
          this.scroll.height = Math.round(this.$refs.messages.scrollHeight - this.$refs.messages.clientHeight);
          if (this.scroll.keepScrollBottom) {
            this.scrollToBottom();
          }
        }
      },
      scrollTrack() {
        if (!this.scrollTrackTimer) {
          this.scrollTrackTimer = setTimeout(this._scrollTrack, SCROLL_DEBOUNCE_TIME);
        }
      },
      _scrollTrack() {
        this.scrollTrackTimer = null;
        if (this.$refs.messages) {
          this.scroll.top = Math.round(this.$refs.messages.scrollTop);
        }
      },
      _checkScrollBottom() {
        this.scroll.keepScrollBottom = (this.scroll.height - 20 <= this.scroll.top)
      },
      newChatScrollToBottom() {
        if (this.newChat) {
          setTimeout(this.scrollToBottom, 10);
          this.scroll.keepScrollBottom = true;
          this.newChat = false;
        }
      },
      flowsEmailCopy() {
        navigator.clipboard.writeText(this.flowsEmail)
        .then(() => {this.eventBus.$emit("notify", "Copied chat email to clipboard")})
        .catch(() => {this.eventBus.$emit("notify", "Copying failed")});
      },
      editLastMessage(event) {
        const text = this.$refs.editor ? this.$refs.editor.getHTML() : "";
        if (text === "<p></p>") {
          event.stopPropagation();
          const myMessages = this.sortedMessages.filter(message => message.creatorUserId === this.currentUser.id);
          if (myMessages.length) {
            const messageId = myMessages[myMessages.length - 1].id;
            const message = this.$refs['message-' + messageId] && this.$refs['message-' + messageId][0]
              ? this.$refs['message-' + messageId][0]
              : null;
            if (message) {
              setTimeout(() => this.scrollToMessage(messageId, true), 10);
              message.openEdit();
              event.stopPropagation();
            }
          }
        }
      },
    },
    watch: {
      "scroll.top": function () {
        this._checkScrollBottom();
      }
    }
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .chat
    display flex
    height 100%

  .sidebar
    min-width 200px
    padding 20px
    flex 1
    box-shadow inset 3px 0 3px -3px rgba(0, 0, 0, 0.1)
    position relative
    z-index 200
    @media (max-width: $chat-sidebar-hide)
      display none
    .flagged
      margin-bottom 10px
      h4
        margin-bottom 10px
        &.other
          margin 10px 0 3px

  .mainbar
    max-width 1200px
    flex 3
    min-width 0
    height 100%
    display flex
    flex-direction column
    &.focusMode
      background $color-light-gray-background
      .day-separator, .unread-separator
        &::before
          background $color-gray-border
        .text
          background $color-light-gray-background
          color $color-gray-text
      & /deep/ .chat-message:not(.message-highlight)
        background none !important
        .avatar
          filter saturate(0)
          opacity 0.5
        .content-container
          color $color-gray-text
          filter saturate(0)
    .chat-title
      position relative
      z-index 100
      background #fff
      box-shadow 0 1px 3px rgba(0, 0, 0, 0.1)
      height 56px
      min-height 56px
      max-height 56px
      overflow hidden
      display flex
      align-items center
      padding 0 20px
      .favToggle
        .far
          color $color-gray-text-light
        .fas
          color $color-gold
        margin-right 5px
      .name
        flex 1
        margin-right 20px
        text-title-20()
      .user
        text-regular-13()
        position relative
        min-width 40px
        top 1px
        &[status="OFFLINE"] .avatar
          opacity 0.5
          filter saturate(0)
        .online-status
          width 10px
          height @width
          border-radius 50%
          position absolute
          right -3px
          top -2px
          border 2px solid #fff
          display none
        &[status="AWAY"] .online-status
          background #ffc843
          display block
        &[status="ONLINE"]
          .online-status
            background #83c844
            display block
          .avatar[status="OPEN"],
          .avatar[status="TYPING"]
            box-shadow 0 0 0 1px #fff, 0 0 0 3px #83c843
        .unreads
          position absolute
          bottom 0
          right -4px
          background $color-blue
          text-shadow 0 -1px rgba(0, 0, 0, 0.5)
          color #fff
          padding 0 4px
          border-radius $border-radius
          text-bold-13()
        .avatar
          margin 0 0 0 10px

    .messages-container
      flex 1
      overflow-y scroll

      .typing
        color $color-gray-text
        margin -5px 20px 10px 65px

    .messages
      padding 20px 0
      position relative

    .chat-bottom
      position relative
      background #fff
      padding 15px 20px 8px
      box-shadow 0 -1px 3px rgba(0, 0, 0, 0.1)

      .chat-inputs
        margin-bottom 6px

        .flex0,
        .control
          align-self flex-end

        .field
          min-width 0
          margin-bottom 0

      .file-upload
        @media (max-width: $hide-file-upload)
            display none

      .control.is-expanded
        min-width 0

      .editor
        margin-top -6px

        /deep/
          .menubar .buttons
            overflow-y auto
            flex-wrap nowrap

          .ProseMirror
            max-height 250px
            overflow-y auto

  .day-separator, .unread-separator
    position relative
    margin-top 10px
    .text
      background #fff
      display inline-block
      padding 0 10px
      text-bold-13()
      z-index 1
      position relative
    &::before
      content ""
      position absolute
      left 0
      right 0
      top 12px
      height 2px
      z-index 0

  .day-separator
    text-align center
    .text
      color $color-blue
    &::before
      background #eee

  .unread-separator
    text-align center
    &.rised
      text-align right
      margin-top -24px
      .text
        margin 0 15px
    .text
      color $color-red-text
      position relative
      top -1px
    &::before
      background $color-red

</style>

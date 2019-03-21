<template lang="pug">
  .chat
    .mainbar(:class="{ focusMode: replyToId, 'extra-space': !flows.compactMode }")
      .chat-title
        button.button.fav-toggle.is-white(v-tooltip="isStarred ? 'Remove from favorites' : 'Add to favorites'" @click="toggleFavourite()")
          span.icon
            i.fa-star(:class="{ fas: isStarred, far: !isStarred }")
        .name.ellipsis {{ currentChatName }}
        template(v-if="chatUsers")
          template(v-for="user in chatUsers")
            .user(v-if="user"
            v-tooltip="flows.getFullName(user.userId) + ' (' + user.role.toLowerCase() + ')'"
            :status="flows.getUserStatus(user.userId)"
            :class="{ outside: user.role === 'NOTIFICATION_RECEIVER' }")
              img.avatar.avatar-small(:src="flows.getAvatar(user.userId)" :status="user.status")
              .online-status
              .unreads(v-if="user.unreadItemsCount") {{ user.role === 'NOTIFICATION_RECEIVER' ? '@' : user.unreadItemsCount }}
      .messages-container.scrollbar-style(ref="messages" @scroll="scrollTrack")
        .messages(v-if="!hidden && sortedMessages && topics.User" v-images-loaded:on.progress="scrollUpdate")
          template(v-for="(message, i) in sortedMessages" v-if="message && topics.User && sortedMessages")
            .day-separator(v-if="!i || !utils.datesAreSameDay(sortedMessages[i-1].createDate, message.createDate)")
              .text {{ utils.weekdayDateAddOtherYear(message.createDate) | capitalize }}
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
              :showButtons="editorToolbar ? 'ALWAYS' : 'HIDE'"
              :onlyText="false"
              :placeholder="messageInputPlaceholder"
              :initEmpty="true"
              @submit="sendChatMessage()"
              @update="checkTypingStatus()"
              @focus="editorFocused = true"
              @blur="editorFocused = false"
              @keydown.38.native.exact.capture="editLastMessage")

            .control(v-show="!uploadExpanded")
              button.expand-button(
                :class="{ expanded: editorToolbar }"
                @pointerdown.prevent
                @pointerup="editorToolbar = !editorToolbar"
                @keyup.enter="editorToolbar = !editorToolbar"
                v-tooltip="editorToolbar ? 'Hide editing toolbar' : 'Show editing toolbar'")

            file-upload(
              v-show="!mqMobile"
              ref="fileUpload"
              :class="{ flex0: !uploadExpanded, flex1: uploadExpanded}"
              :chatId="currentChatId"
              :replyToId="replyToId"
              @expandChange="uploadExpanded = $event"
              @fileUploaded="replyCancel()")

            .control(v-if="replyToId" v-show="!uploadExpanded")
              button.button.is-outlined(@pointerdown.prevent @pointerup="replyCancel()" @keyup.enter="replyCancel()")
                span(v-if="!mqMobile") Cancel
                span.icon(v-if="mqMobile")
                  i.fas.fa-times
            .control(v-show="!uploadExpanded")
              button.button(:class="{ 'is-primary':  replyToId}" @pointerdown.prevent @pointerup="sendChatMessage()" @keyup.enter="sendChatMessage()")
                span(v-if="!mqMobile") Send
                span.icon(v-if="mqMobile")
                  i.fas.fa-paper-plane


        template(v-if="!mqMobile")
          .has-text-grey.text-small.bottom-info-text(v-if="!editorFocused && flowsEmail")
            | Forward emails to chat:&nbsp;
            span.ellipsis(@click="flowsEmailCopy()" v-tooltip="'Copy to clipboard'" style="text-decoration: underline; cursor: pointer;") {{ flowsEmail }}
          .has-text-grey.text-small.bottom-info-text(v-if="editorFocused") ↵ Enter for new line &nbsp;·&nbsp; Shift + Enter to send

    .sidebar.scrollbar-style(:class="{ collapsed: sidebarCollapsed }")
      .workspace(v-if="workspace")
        .text.show-wide
          .name {{ workspace.workspace.name }}
          .desc {{ workspace.workspace.type.toLowerCase() }} workspace
        img.logo(:src="workspace.logo" :alt="workspace.workspace.name")

      button.sidebar-button(@click="sidebarCollapsed = !sidebarCollapsed" v-tooltip.left="{ content: sidebarCollapsed ? 'Expand sidebar' : null, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }")
        span.icon.small
          i.fas.has-text-grey(:class="'fa-chevron-' + (sidebarCollapsed ? 'left' : 'right')")
        span.show-wide Collapse sidebar

      button.saved-view-all.sidebar-button(@click="$emit('viewSavedMessages')" v-tooltip.left="{ content: sidebarCollapsed ? 'Saved messages' : null, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }")
        span.icon.small
          i.fas.fa-thumbtack.has-text-info
        span.show-wide All saved messages

      button.sidebar-button(
        @click="flows.markCurrentChatRead()"
        :disabled="firstUnreadMessageId === -1"
        v-tooltip.left="{ content: sidebarCollapsed ? 'Mark all as read' : null, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }"
      )
        span.icon.small
          i.fas.fa-check.has-text-success
        span.show-wide Mark all as read

      button.sidebar-button(
        @click="scrollToBottom()"
        :disabled="scroll.keepScrollBottom"
        v-tooltip.left="{ content: sidebarCollapsed ? 'Scroll to bottom' : null, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }"
      )
        span.icon.small
          i.fas.fa-arrow-down.has-text-grey
        span.show-wide Scroll to bottom

      .flagged(v-if="!hidden && flaggedMessageIds && flaggedMessageIds.length")
        h4
          .show-wide #[i.fas.fa-thumbtack.has-text-info] Saved messages
        message-preview.sidebar-saved(
          v-for="messageId in flaggedMessageIds"
          :messageId="messageId"
          :superCompact="sidebarCollapsed"
          :key="messageId"
        )

      //-a(v-if="firstUnreadMessageId !== -1" @click="scrollToNew()" style="display: block;") First unread
      .show-wide(v-tooltip="'Upper left corner next to your name. This button will be removed in future.'")
        button.button.is-fullwidth.is-outlined(disabled style="margin-top: 20px") Log out moved to settings

      p.show-wide.has-text-grey(style="margin-top: 10px;")
        template(v-if="chatUser")
          template(v-if="isAdmin") You have administrator rights<br>
          template(v-if="chatUser.role === 'USER'") You have user rights<br>
          template(v-if="chatUser.role === 'NOTIFICATION_RECEIVER'") You are mentioned in this chat<br>
        template(v-else) You are not a member of this chat<br>
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
    store: ["currentChatId", "currentChatName", "currentUser", "topics", "lastUpdateChat", "draftMessages"],
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
        editorToolbar: false,
        uploadExpanded: false,
        unreadId: null, // for autoUnread to keep new indicator in place

        sortedMessages: null,
        messagesRead: null,
        flaggedMessageIds: null,

        sidebarCollapsed: false,
      }
    },
    created() {
      this.eventBus.$on("messagesScrollUpdate", this.scrollUpdate);
      this.eventBus.$on("scrollToMessage", messageId => this.scrollToMessage(messageId));
      this.eventBus.$on("currentChatChange", this.markNewChat);
      this.eventBus.$on("currentChatChange", this.saveRestoreMessage);

      const sidebarIsCollapsed = JSON.parse(localStorage.getItem("sidebarCollapsed"));
      if (sidebarIsCollapsed) this.sidebarCollapsed = true;
    },
    mounted() {
      this.$root.updateFullHeight();
    },
    computed: {
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
      messageInputPlaceholder() {
        if (this.replyToId) {
          const message = this.flows.chatMessages().find(ti => ti.id === this.replyToId);
          return 'Reply to ' + (message?.creatorUserId
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
        if (this.chatUsers && this.currentUser) {
          let users = this.chatUsers
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
          if (chat?.guid) return `${chat.guid}@flow.contriber.com`;
        }
      },
      chatUsers() {
        if (this.topics.User) return this.flows.getChatUsers(this.currentChatId);
      },
      chatUser() {
        if (this.chatUsers && this.currentUser) {
          return this.flows.currentChatUser();
        }
      },
      isAdmin() {
        if (this.chatUsers && this.currentUser) {
          const user = this.chatUser;
          return user ? user.role === "ADMIN" : false;
        }
      },
      workspace() {
        return this.flows.getChatWorkspace(this.currentChatId);
      },
    },
    methods: {
      _getEditorContent() {
        return this.$refs.editor ? this.$refs.editor.getHTML() : "";
      },
      /**
       * @param messageId {number}
       * @returns {Promise<Object|SocketResponse>}
       */
      findOrLoadMessage(messageId) {
        if (!this.sortedMessages) return;
        const existingMessage = this.sortedMessages.find(message => message.id === messageId);
        if (existingMessage) {
          return new Promise(resolve => resolve(existingMessage));
        } else {
          return this.flows.getChatMessages(this.currentChatId, {from: {id: messageId}, amount: 1});
        }
      },
      checkTypingStatus() {
        const text = this._getEditorContent();
        const isTyping = text.replace(/<p>|<\/p>|<br>|<br\/>/g, "").trim() !== "";

        if (isTyping !== this.isTyping) {
          this.flows.setTypingStatus(isTyping);
          this.isTyping = isTyping;
        }
      },
      sendChatMessage() {
        const text = this._getEditorContent();
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
        this.editorToolbar = false;
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
        this._debug("Marking new chat");
        this.newChat = true;
        this.scrolledToNew = false;
        this.scroll.height = 0;
        this.scroll.top = 0;
        this.unreadId = null;

        this.sortedMessages = null;
        this.messagesRead = null;
        this.flaggedMessageIds = null;
        this.$nextTick(() => {
          this.sortedMessages = this.flows.chatMessages();
          this.messagesRead = this.flows.chatMessagesRead();
          this.flaggedMessageIds = this.flows.chatMessagesFlagged();
        });

        this.newChatScrollToBottom();
      },
      scrollToNewOnce() {
        if (!this.scrolledToNew) {
          this.scrollToNew();
        }
      },
      scrollToNew() {
        if (this.$refs.unread?.[0]) {
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
        const message = this.$refs['message-' + messageId]?.[0]
          ? this.$refs['message-' + messageId][0]
          : null; // this.findOrLoadMessage(messageId);
        if (message?.$el) {
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
        //this._debug("Scroll height update");
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
        const text = this._getEditorContent();
        if (text === "<p></p>") {
          event.stopPropagation();
          const myMessages = this.sortedMessages.filter(message => message.creatorUserId === this.currentUser.id);
          if (myMessages.length) {
            const messageId = myMessages[myMessages.length - 1].id;
            const message = this.$refs['message-' + messageId]?.[0]
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
      saveRestoreMessage(prevChatId, newChatId) {
        console.log(prevChatId, newChatId);
        const text = this._getEditorContent();
        if (this.replyToId || text.replace(/<p>|<\/p>|<br>|<br\/>/g, "").trim() !== "") {
          if (prevChatId) {
            this._debug("Saving draft message in chat " + this.currentChatName);
            this.draftMessages[prevChatId] = {
              text: text,
              replyToId: this.replyToId,
            };
          }
          this.replyCancel();
          this.editorClear();
        }

        if (this.draftMessages[newChatId]) {
          if (this.draftMessages[newChatId].text && this.$refs.editor) this.$refs.editor.setContent(this.draftMessages[newChatId].text);
          if (this.draftMessages[newChatId].replyToId) this.replyToId = this.draftMessages[newChatId].replyToId;

          delete this.draftMessages[newChatId];
        }
      },
      lastUpdateChatWatcher() {
        this._debug("lastUpdateChat watcher");
        this.lastUpdateChatTimeout = null;
        this.newChatScrollToBottom();
        this.scrollUpdate();
        this.sortedMessages = this.flows.chatMessages();
        this.messagesRead = this.flows.chatMessagesRead();
        this.flaggedMessageIds = this.flows.chatMessagesFlagged();
      },
    },
    watch: {
      "scroll.top": function () {
        this._checkScrollBottom();
      },
      "lastUpdateChat": function (newVal, oldVal) {
        if (oldVal === newVal) return;
        if (this.lastUpdateChatTimeout) return;
        this.lastUpdateChatTimeout = setTimeout(this.lastUpdateChatWatcher, 100);
      },
      "editorToolbar": function (newVal, oldVal) {
        if (oldVal === newVal) return;
        this.$nextTick(this._scrollUpdate);
      },
      "sidebarCollapsed": function (newVal, oldVal) {
        localStorage.setItem("sidebarCollapsed", newVal);
        this.$nextTick(this._scrollUpdate);
      },
    }
  }
</script>

<style lang="stylus" scoped src="./ChatMessages.styl"></style>

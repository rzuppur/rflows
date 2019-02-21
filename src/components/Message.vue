<template lang="pug">

  .chat-message(:class="messageClass" @click="editorFocus()")
    //-:title="Object.keys(message).reduce((a, k) => (a + k + `: ${message[k]} \n`), '')"
    .avatar-container
      .sticky-avatar
        img.avatar.avatar-small(:src="flows.getAvatar(message.creatorUserId)")
      .date(v-tooltip="messageIsEdited ? 'Edited ' + utils.fullDateTime(message.modifiedDate) : ''")
        | {{ utils.time(message.createDate) + (messageIsEdited ? '*' : '') }}
      .icon.is-small.has-text-info.saved-icon(v-if="message.flagged")
        i.fas.fa-thumbtack
    .content-container
      //-b {{message.id}}
      //-b(v-if="message.customData !== null" style="color: red") customData: {{ message.customData }}
      b.text-error.text-small(v-if="message.error") Message was not sent #{""}
      //- TODO: resend
      .name {{ flows.getFullName(message.creatorUserId) }}
        span.icon.is-small.has-text-info.saved-icon(v-if="message.flagged" v-tooltip="'Message is in saved messages'")
          i.fas.fa-thumbtack
      .date {{ utils.time(message.createDate) }}
        span(v-if="messageIsEdited") , edited {{ utils.dateTime(message.modifiedDate) }}
      message-preview.reply-original(v-if="message.referenceFromTopicItemId" :messageId="message.referenceFromTopicItemId")
      .edit(v-show="editMode")
        editor(ref="editor"
        :show-buttons="(['NOTE', 'EMAIL'].indexOf(message.type) > -1) ? 'ALWAYS' : 'NEVER'"
        :onlyText="['NOTE', 'EMAIL'].indexOf(message.type) < 0"
        :placeholder="'Delete message?'"
        :initEmpty="false")
        .field.is-grouped.edit-buttons
          .control
            button.button.is-outlined(@click.stop="saveEdit()")
              span.icon.is-small.has-text-success
                i.fas.fa-check
              span Save
          .control
            button.button.is-outlined(@click.stop="cancelEdit()")
              span.icon.is-small.has-text-grey
                i.fas.fa-times
              span Cancel
      template(v-if="!editMode")
        .file-content(v-if="message.type === 'FILE'")
          a.file-preview(:href="flows.getFilePath(message.url)" target="_blank" rel="noopener noreferrer nofollow")
            .file-title.ellipsis #[i.fas.fa-paperclip] {{ message.text }}
            .image-preview(v-if="imagePreviewUrl")
              img(:src="imagePreviewUrl")
        p.text-content(v-if="message.type === 'EVENT'") {{ message.text }}
        p.text-content(v-if="message.type === 'CHAT'" v-html="flows.chatTextParse(message.text)")
        .note-content(v-if="message.type === 'NOTE'" v-html="flows.noteTextParse(message.text)")
        template(v-if="message.type === 'EMAIL'")
          .email-meta
            | From: {{ message.from.address }}<br>
            | To: {{ message.to.map(to => to.address).join(", ") }}<br>
            | #[b {{ message.subject }}]
          .email-frame-container(v-if="(message.contentType && message.contentType.toLowerCase()) === 'text/html'")
            iframe.email-frame(
            ref="emailframe"
            :srcdoc="getEmailText(message.text)"
            @load="setEmailFrameHeight()")
          p.text-content.email-plain(v-if="!message.contentType || message.contentType.toLowerCase() !== 'text/html'" v-html="utils.textToHTML(message.text)")
        p.text-content(v-if="['CHAT', 'NOTE', 'EMAIL', 'EVENT', 'FILE'].indexOf(message.type) < 0") #[b(style="color: #c00;") Unknown message type:] {{ message.type }}
    .buttons-container(v-if="!editMode")
      .field.has-addons
        .control(v-if="!autoMarkAsRead && message.unread")
          button.button.is-small.is-outlined.has-text-success(
          @click.stop="markRead(message.id)"
          v-tooltip="'Mark as read'")
            span.icon.is-small
              i.fas.fa-check
        .control(v-if="message.creatorUserId === currentUser.id && ['EMAIL', 'EVENT'].indexOf(message.type) < 0")
          button.button.is-small.is-outlined.has-text-link(
          @click.stop="openEdit()"
          v-tooltip="'Edit'")
            span.icon.is-small
              i.fas.fa-edit
        .control(v-if="canDelete")
          button.button.is-small.is-outlined.has-text-danger(
          @click.stop.exact="deleteChatMessage(false)"
          @click.stop.ctrl.exact="deleteChatMessage(true)"
          v-tooltip="'Delete'")
            span.icon.is-small
              i.fas.fa-times
        .control
          button.button.is-small.is-outlined(
          @click.stop="flagToggle()"
          :class="message.flagged ? 'has-text-grey-light' : 'has-text-info'"
          v-tooltip="message.flagged ? 'Remove from saved' : 'Save for later'")
            span.icon.is-small
              i.fas.fa-thumbtack
        .control(v-if="replyToId !== message.id")
          button.button.is-small.is-outlined.has-text-primary(
          @click.stop="$emit('replyStart', message.id)"
          v-tooltip="'Reply'")
            span.icon.is-small
              i.fas.fa-reply
        .control(v-if="replyToId === message.id")
          button.button.is-small.is-outline(
          @click.stop="$emit('replyCancel')"
          v-tooltip="'Cancel reply'")
            span.icon.is-small
              i.fas.fa-times
</template>

<script>
  import MessagePreview from "@/components/MessagePreview"
  import Editor from "@/components/Editor"


  export default {
    name: "Message",
    components: {MessagePreview, Editor},
    props: ["message", "i", "replyToId", "sortedMessages", "isAdmin", "autoMarkAsRead", "firstUnreadMessageId"],
    store: ["currentUser"],
    data() {
      return {
        editMode: false,
        editBackup: null,

        highlighted: false,
        highlightTimeout: null,
      }
    },
    computed: {
      messageClass() {
        return {
          event: this.message.type === 'EVENT',
          noauthor: (this.i > 0)
            && this.sortedMessages[this.i - 1]
            && (this.sortedMessages[this.i - 1].creatorUserId === this.message.creatorUserId)
            && this.utils.datesAreSameDay(this.sortedMessages[this.i - 1].createDate, this.message.createDate)
            && this.firstUnreadMessageId !== this.message.id,
          'message-highlight': this.replyToId === this.message.id,
          'message-unread': this.message.unread,
          'message-edit': this.editMode,
          'message-softhighlight': this.highlighted,
          'message-shadow': !this.editMode && !!this.editBackup || this.message.shadow,
          'message-error': this.message.error,
          'message-saved': this.message.flagged,
        }
      },
      messageIsEdited() {
        return this.message.modifiedDate !== this.message.createDate
      },
      referenceMessage() {
        return this.getMessage(this.message.referenceFromTopicItemId);
      },
      canDelete() {
        if (this.currentUser) {
          return this.message.creatorUserId === this.currentUser.id && this.message.type !== "EVENT";
        }
      },
      imagePreviewUrl() {
        if (!this.message.url) return false;
        const previewUrl = this.flows.getFilePath(this.message.url);
        if (this.message.originalFileName === "mime") return previewUrl;
        let ext = this.message.url.split(".");
        ext = ext[ext.length - 1] + "";
        if (["png", "jpg", "gif", "jpeg", "svg"].indexOf(ext.toLowerCase()) > -1) return previewUrl;
      },
    },
    methods: {
      editorFocus() {
        if (this.editMode && this.$refs.editor) {
          this.$refs.editor.focus();
        }
      },
      highlight() {
        this.highlighted = false;
        clearTimeout(this.highlightTimeout);
        setTimeout( () => this.highlighted = true, 10);
        this.highlightTimeout = setTimeout( () => this.highlighted = false, 5010);
      },
      openEdit() {
        this.$refs.editor.setMessage(this.message);
        this.editMode = true;
      },
      cancelEdit() {
        this.editMode = false;
        this.eventBus.$emit("messagesScrollUpdate");
      },
      saveEdit() {
        const text = this.$refs.editor.getHTML();
        this.cancelEdit();

        if (text.replace(/<p>|<\/p>/g, "").trim() === "") {
          this.flows.deleteChatMessage(this.message.id);
          return;
        }
        const textCleared = text.replace(/<p>/g, "").replace(/<br>|<\/p>/g, "\n").trim();
        const isHTML = ["NOTE", "EMAIL"].indexOf(this.message.type) > -1;

        if (isHTML && this.message.text === text || !isHTML && this.message.text === textCleared) {
          this._debug("nothing changed");
          return;
        }

        this.editBackup = {...this.message};
        let editedMessage = {...this.message};
        editedMessage.text = isHTML ? text : this.utils.unEscapeHTML(textCleared);

        this.$nextTick(() => {
          this.flows.editChatMessage(editedMessage)
            .then((response) => {
              this.editBackup = null;
            }).catch((error) => {
              this._debug("Error editing message: " + error);
              window.alert("Error editing message (see console for details)");
              this.flows.replaceLocalMessage(this.editBackup);
              this.editBackup = null;
            });
        });
      },
      flagToggle() {
        const isFlagged = this.message.flagged;
        if (isFlagged !== undefined) {
          this.flows.setFlag(this.message.id, !isFlagged);
        }
      },
      markRead(id) {
        this.flows.markChatMessageRead(id);
        this.eventBus.$emit("messagesScrollUpdate");
      },
      deleteChatMessage(instant) {
        if (instant || window.confirm("Delete message? You can ctrl+click for instant delete.")) {
          this.flows.deleteChatMessage(this.message.id);
        }
      },
      getMessage(messageId) {
        if (this.sortedMessages) {
          let message = this.sortedMessages.find(message => message.id === messageId);
          if (message) return message;
        }
      },
      getEmailText(text) {
        text = text.replace(/(<img.*?(?:src=)["']?)((?:.(?!["']?\\s+(?:\S+)=|[>"']))+.)(["']?[^>]*>)/g, "<img src='" + window.location + "/img_placeholder.svg' width=40 title='Image removed - RFlows'>");
        if (text.includes("<head>")) {
          return text.replace('<head>', '<head><base href="https://flows.contriber.com"><style>body { font-family: sans-serif; }</style>');
        }
        return '<html><head><base href="https://flows.contriber.com"><style>body { font-family: sans-serif; }</style></head><body>' +
          text + '</body></html>';
      },
      setEmailFrameHeight() {
        const el = this.$refs.emailframe;
        if (el) {
          el.height = el.contentWindow.document.body.scrollHeight + 17 + "px";
        }
      },
    }
  }
</script>

<style lang="stylus">
  @import "~@/shared.styl"

  $verticalPadding = 12px

  .extra-space .chat-message
    padding $verticalPadding 30px !important

    &.message-highlight
      padding $verticalPadding 17px !important

    @media (max-width $media-sidebar-hide)
      padding $verticalPadding 20px !important

    p
      line-height 1.6

</style>
<style lang="stylus" scoped src="./Message.styl"></style>

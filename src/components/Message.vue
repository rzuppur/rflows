<template lang="pug">

  .chat-message-container

    message-display(
      :key="message.id"
      :message="message"
      :class="messageClass"
    )

      template(v-if="editMode" v-slot:content)

        editor(
          ref="editor"
          :show-buttons="(['NOTE', 'EMAIL'].indexOf(message.type) > -1) ? 'ALWAYS' : 'NEVER'"
          :onlyText="['NOTE', 'EMAIL'].indexOf(message.type) < 0"
          :placeholder="'Delete message?'"
          :initEmpty="false"
          @keydown.ctrl.83.native.exact.capture.prevent="saveEdit"
          @keydown.native.capture.esc="cancelEdit"
        )

        .field.is-grouped.edit-buttons
          .control
            button.button.is-outlined(@click.stop="saveEdit")
              span.icon.is-small.has-text-success
                i.fas.fa-check
              span Save

          .control
            button.button.is-outlined(@click.stop="cancelEdit")
              span.icon.is-small.has-text-grey
                i.fas.fa-times
              span Cancel

      template(v-if="!editMode" v-slot:buttons)
        .control(v-if="!autoMarkAsRead && message.unread")
          button.button.is-outlined.has-text-success(
          @click.stop="markRead(message.id)"
          v-tooltip="'Mark as read'")
            span.icon.is-small
              i.fas.fa-check

        .control(v-if="message.creatorUserId === currentUser.id && ['EMAIL', 'EVENT'].indexOf(message.type) < 0")
          button.button.is-outlined.has-text-link(
          @click.stop="openEdit()"
          v-tooltip="'Edit'")
            span.icon.is-small
              i.fas.fa-edit

        .control(v-if="canDelete")
          button.button.is-outlined.has-text-danger(
          @click.stop.exact="deleteChatMessage(false)"
          @click.stop.ctrl.exact="deleteChatMessage(true)"
          v-tooltip="'Delete'")
            span.icon.is-small
              i.fas.fa-times

        .control
          button.button.is-outlined(
          @click.stop="flagToggle()"
          :class="message.flagged ? 'has-text-grey-light' : 'has-text-info'"
          v-tooltip="message.flagged ? 'Remove from saved' : 'Save for later'")
            span.icon.is-small
              i.fas.fa-thumbtack

        .control(v-if="replyToId !== message.id")
          button.button.is-outlined.has-text-primary(
          @click.stop="$emit('replyStart', message.id)"
          v-tooltip="'Reply'")
            span.icon.is-small
              i.fas.fa-reply

        .control(v-if="replyToId === message.id")
          button.button.is-outline(
          @click.stop="$emit('replyCancel')"
          v-tooltip="'Cancel reply'")
            span.icon.is-small
              i.fas.fa-times


</template>

<script>
  import Editor from "@/components/UI/Editor.vue";
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";
  import Modal from "@/components/UI/Modal.vue";


  export default {
    name: "Message",
    components: { Editor, MessageDisplay, Modal },
    props: ["message", "i", "replyToId", "sortedMessages", "isAdmin", "autoMarkAsRead", "firstUnreadMessageId"],
    store: ["currentUser"],
    data() {
      return {
        editMode: false,
        editBackup: null,

        highlighted: false,
        highlightTimeout: null,
      };
    },
    computed: {
      noAuthor() {
        const prevMessage = this.sortedMessages[this.i - 1];
        return (this.i > 0)
          && prevMessage?.creatorUserId === this.message.creatorUserId
          && this.utils.datesAreSameDay(prevMessage.createDate, this.message.createDate)
          && this.firstUnreadMessageId !== this.message.id;
      },
      messageClass() {
        return {
          noauthor: this.noAuthor,
          "message-highlight": this.replyToId === this.message.id,
          "message-unread": this.message.unread,
          "message-edit": this.editMode,
          "message-softhighlight": this.highlighted,
          "message-shadow": (!this.editMode && !!this.editBackup) || this.message.shadow,
          "message-error": this.message.error,
          "message-saved": this.message.flagged,
        };
      },
      messageIsEdited() {
        return this.message.modifiedDate !== this.message.createDate;
      },
      referenceMessage() {
        return this.getMessage(this.message.referenceFromTopicItemId);
      },
      canDelete() {
        if (this.currentUser) {
          return this.message.creatorUserId === this.currentUser.id && this.message.type !== "EVENT";
        }
        return false;
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
        setTimeout(() => {
          this.highlighted = true;
        }, 10);
        this.highlightTimeout = setTimeout(() => {
          this.highlighted = false;
        }, 5010);
      },
      openEdit() {
        this.editMode = true;
        setTimeout(() => {
          if (!this.$refs.editor) {
            this.eventBus.$emit("notify", "Could not open message editor");
            this._debug("! Editor missing");
            return;
          }
          this.$refs.editor.setMessage(this.message);
        }, 0);
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

        this.editBackup = { ...this.message };
        const editedMessage = { ...this.message };
        editedMessage.text = isHTML ? text : this.utils.unEscapeHTML(textCleared);

        this.$nextTick(() => {
          this.flows.editChatMessage(editedMessage)
            .then(() => {
              this.editBackup = null;
            }).catch((error) => {
              this._debug(`Error editing message: ${error}`);
              this.eventBus.$emit("notify", "Error editing message");
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
      async deleteChatMessage(instant) {
        if (instant || await this.$root.confirm("Delete message? You can ctrl+click for instant delete.", "Delete", "Cancel")) {
          this.flows.deleteChatMessage(this.message.id);
        }
      },
      getMessage(messageId) {
        if (this.sortedMessages) {
          const message = this.sortedMessages.find(sortedMessage => sortedMessage.id === messageId);
          if (message) return message;
        }
      },
    },
  };
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
<style lang="stylus" scoped>
  @import "~@/shared.styl"

  @keyframes highlight-soft
    0%
      background alpha($color-gold, 0.2)
    20%
      background alpha($color-gold, 0.2)
    100%
      background alpha($color-gold, 0.05)

  .chat-message
    /*
     HOVER, HIGHLIGHTS
     */

    &.message-shadow
      .text-content,
      .note-content
        opacity 0.4

    &.message-unread
      background alpha($color-unread-background, 0.1)

    &.message-saved
      background alpha(#409df1, 0.05)

      &:hover
        background alpha(#409df1, 0.08)

    &.message-highlight
      box-shadow 0 1px 3px 1px rgba(0, 0, 0, 0.15), 0 5px 13px rgba(0, 0, 0, 0.1), 0 0 0 4000px rgba(68, 85, 114, 0.2)
      margin 0 13px
      padding 5px 7px
      border-radius $border-radius
      background #fff !important
      z-index 10

    &.message-softhighlight
      animation highlight-soft 5s

    &.message-error
      background alpha($color-red, 0.05)

      &:hover,
      &:focus-within
        background alpha($color-red, 0.08)

    /*
     EDITOR
     */

    .editor
      margin 5px 0 10px

    .edit-buttons
      margin-bottom 5px

    &.message-edit .buttons-container
      display none

    .unread-separator + &.noauthor
      &:hover .avatar-container .date
        display none

      .sticky-avatar,
      .content-container > .name,
      .content-container > .date
        display inline-block

</style>

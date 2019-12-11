<template lang="pug">

  .chat-message-container

    //- @dblclick.native="!editMode && $events.$emit('replyStart', message.id)"
    message-display(:message="message" :key="message.id" :class="classListWithHighlight")

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

        .r-buttons

          r-button(primary :action="saveEdit" icon="check") Save

          r-button(borderless :action="cancelEdit") Cancel

      template(v-if="showButtons" v-slot:buttons)

        r-button(
          v-if="$store.debugMode"
          :action="() => { $flows.notifications.showMessageNotification(message); }"
          v-rtip="'Notify'"
          icon="notification"
        )

        r-button(
          v-if="!autoReadEnabled && message.unread"
          :action="() => { markRead(message.id); }"
          v-rtip="'Mark as read'"
          icon="check"
          icon-color="green")

        r-button(
          v-if="canEdit"
          :action="openEdit"
          v-rtip="'Edit'"
          icon="edit")

        r-button(
          v-if="canDelete"
          :action="() => { deleteChatMessage(false); }"
          :actionWithModifier="() => { deleteChatMessage(true) }"
          v-rtip="'Delete'"
          icon="delete"
          icon-color="red")

        r-button(
          :action="flagToggle"
          v-rtip="message.flagged ? 'Remove from saved' : 'Save for later'"
          :icon="message.flagged ? 'pin off' : 'pin'"
          :icon-color="message.flagged ? '' : 'blue'")

        r-button(
          v-if="replyToId !== message.id"
          :action="() => { $events.$emit('replyStart', message.id) }"
          v-rtip="'Reply'"
          icon="reply")

        r-button(
          v-if="replyToId === message.id"
          :action="() => { $events.$emit('replyCancel', message.id) }"
          v-rtip="'Cancel reply'"
          icon="close")


</template>

<script>
  import Editor from "@/components/UI/Editor.vue";
  import MessageDisplay from "@/components/Message/MessageDisplay.vue";

  export default {
    name: "Message",
    components: { Editor, MessageDisplay },
    props: {
      message: Object,
      replyToId: Number,
      classList: Array,
    },
    data() {
      return {
        editMode: false,
        editBackup: null,

        highlighted: false,
        highlightTimeout: null,
      };
    },
    computed: {
      classListWithHighlight() {
        const add = [];
        if (this.highlighted) {
          add.push("message-softhighlight");
        }
        return this.classList.concat(add);
      },
      autoReadEnabled() {
        this.$store.flows.userProperties.v;

        return this.$flows.settings.getBooleanUserProp("autoMarkAsRead");
      },
      /* messageClass() {
        return {
          noauthor: this.noAuthor,
          "message-highlight": this.replyToId === this.message.id,
          "message-unread": this.message.unread,
          "message-edit": this.editMode,
          "message-softhighlight": this.highlighted,
          "message-shadow": this.isShadow,
          "message-error": this.message.error,
          "message-saved": this.message.flagged,
        };
      }, */
      messageIsEdited() {
        return this.message.modifiedDate !== this.message.createDate;
      },
      currentUser() {
        return this.$store.currentUser;
      },
      canEdit() {
        if (this.$store.debugMode) return true;
        if (this.currentUser) {
          return this.message.userId === this.currentUser.id && !["EMAIL", "EVENT"].includes(this.message.type);
        }
        return false;
      },
      canDelete() {
        if (this.$store.debugMode) return true;
        if (this.currentUser) {
          return this.message.userId === this.currentUser.id && this.message.type !== "EVENT";
        }
        return false;
      },
      isShadow() {
        return this.message.shadow;
      },
      showButtons() {
        return !this.isShadow && !this.editMode;
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
            this.$events.$emit("notify", "Could not open message editor");
            this._debug("! Editor missing");
            return;
          }
          this.$refs.editor.setMessage(this.message);
        }, 0);
      },
      cancelEdit() {
        this.editMode = false;
      },
      saveEdit() {
        const text = this.$refs.editor.getHTML();
        this.cancelEdit();

        if (text.replace(/<p>|<\/p>/g, "").trim() === "") {
          this.$flows.messages.deleteMessage(this.message);
          return;
        }
        const textCleared = text.replace(/<p>/g, "").replace(/<br>|<\/p>/g, "\n").trim();
        const isHTML = ["NOTE", "EMAIL"].indexOf(this.message.type) > -1;

        if ((isHTML && this.message.text === text) || (!isHTML && this.message.text === textCleared)) {
          this._debug("Nothing changed");
          return;
        }

        // this.editBackup = { ...this.message };
        const editedMessage = { ...this.message };
        editedMessage.text = isHTML ? text : this.utils.unEscapeHTML(textCleared);

        this.$nextTick(() => {
          this.$flows.messages.editMessage(editedMessage)
            .then(() => {})
            .catch((error) => {
              this._debug(`Error editing message: ${error}`);
              this.$events.$emit("notify", "Error editing message");
              // this.flows.replaceLocalMessage(this.editBackup);
            })
            .finally(() => {
              // this.editBackup = null;
            });
        });
      },
      flagToggle() {
        const isFlagged = !!this.message.flagged;
        this.$flows.messages.setMessageFlagged(this.message.id, !isFlagged);
      },
      markRead(id) {
        this.$flows.messages.markMessagesAsRead([id], this.message.chatId);
      },
      async deleteChatMessage(instant) {
        if (instant || await this.$root.rModalConfirm("Delete message?", "Delete", "Cancel", "You can ctrl+click for instant delete.")) {
          this.$flows.messages.deleteMessage(this.message);
        }
      },
    },
  };
</script>
<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .chat-message
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

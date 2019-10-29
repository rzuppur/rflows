import { computed, watch } from "@vue/composition-api";
import utils from "@/js/utils";

function saveRestore(props, context) {
  const draftMessages = {};
  const replyToId = computed(() => context.root.$store.currentChatReplyToId);
  const getEditorContent = () => ( context.refs.editor ? context.refs.editor.getHTML() : "" );

  const saveRestoreMessage = (newChatId, prevChatId) => {
    if (prevChatId === newChatId) return;

    const text = getEditorContent();

    if (replyToId.value || utils.editorTextNotEmpty(text)) {
      if (prevChatId) {
        draftMessages[prevChatId] = {
          text,
          replyToId: replyToId.value,
        };

        if (context.refs.editor) context.refs.editor.empty();
        context.root.$store.currentChatReplyToId = null;
      }
    }

    if (draftMessages[newChatId]) {
      if (draftMessages[newChatId].text && context.refs.editor) {
        context.refs.editor.setContent(draftMessages[newChatId].text);
      }
      if (draftMessages[newChatId].replyToId) {
        context.root.$store.currentChatReplyToId = draftMessages[newChatId].replyToId;
      }
      delete draftMessages[newChatId];
    }
  };

  watch(() => context.root.$store.currentChatId, saveRestoreMessage);

  return {};
}

export default saveRestore;

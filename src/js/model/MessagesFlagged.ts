import Id from "@/js/model/Id";

interface MessageFlagged extends Id {
  userId: number;
  chatId: number;
  messageId: number;
}

export default MessageFlagged;

export function mapMessageFlagged(messageFlagged: any): MessageFlagged {
  return {
    id: messageFlagged.id,
    userId: messageFlagged.userId,
    chatId: messageFlagged.topicId,
    messageId: messageFlagged.itemId,
  };
}

import Id from "@/js/model/Id";

interface MessagesRead extends Id {
  userId: number;
  chatId: number;
  messageFrom: number;
  messageTo: number;
}

export default MessagesRead;

export function mapMessagesRead(messagesRead: any): MessagesRead {
  return {
    id: messagesRead.id,
    userId: messagesRead.userId,
    chatId: messagesRead.topicId,
    messageFrom: messagesRead.itemFrom,
    messageTo: messagesRead.itemTo,
  };
}

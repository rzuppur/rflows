import Id from "@/js/model/Id";

interface MessagesRead extends Id {
  userId: number;
  chatId: number;
  messageFrom: number;
  messageTo: number;
}

export default MessagesRead;

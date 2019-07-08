import IdDate from "@/js/model/IdDate";

interface ChatUser extends IdDate {
  userId: number;
  chatId: number;
  role: ("NOTIFICATION_RECEIVER" | "ADMIN" | "USER");
  status: ("TYPING" | "OPEN" | "NONE");
  atItemsToMeCount: number;
  flaggedItemsCount: number;
  unreadItemsCount: number;
  unreadItemsToMeCount: number;
}

export default ChatUser;

export function mapChatUser(chatUser: any): ChatUser {
  return {
    id: chatUser.id,
    createDate: chatUser.createDate,
    modifiedDate: chatUser.modifiedDate,
    userId: chatUser.userId,
    chatId: chatUser.topicId,
    role: chatUser.role,
    status: chatUser.status,
    atItemsToMeCount: chatUser.atItemsToMeCount,
    flaggedItemsCount: chatUser.flaggedItemsCount,
    unreadItemsCount: chatUser.unreadItemsCount,
    unreadItemsToMeCount: chatUser.unreadItemsToMeCount,
  };
}

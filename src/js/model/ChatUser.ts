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

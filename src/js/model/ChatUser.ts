import IdDate from "@/js/model/IdDate";

interface ChatUser extends IdDate {
  userId: number;
  topicId: number;
  role: string;
  status: ("TYPING" | "OPEN" | "NONE");
  atItemsToMeCount: number;
  flaggedItemsCount: number;
  unreadItemsCount: number;
  unreadItemsToMeCount: number;
}

export default ChatUser;

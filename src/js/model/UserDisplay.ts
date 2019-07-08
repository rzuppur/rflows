import Id from "@/js/model/Id";

interface UserDisplay extends Id {
  name: string;
  avatar: string;
  email?: string;
  userId?: number;
  status?: ("TYPING" | "OPEN" | "NONE");
  userStatus?: ("TYPING" | "OPEN" | "ONLINE" | "AWAY" | "OFFLINE");
  role?: ("NOTIFICATION_RECEIVER" | "ADMIN" | "USER");
  atItemsToMeCount?: number;
  unreadItemsCount?: number;
  unreadItemsToMeCount?: number;
  workspaceId?: number;
}

export default UserDisplay;

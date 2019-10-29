import Id from "@/js/model/Id";
import ChatProperty from "@/js/model/ChatProperty";

interface Chat extends Id {
  guid: string;
  description: string;
  name: string;
  ownerId: number;
  visibility: string;
  unread?: number;
  unreadImportant?: number;
  unreadAtme?: number;
  flagged?: number;
  props?: ChatProperty;
}

export default Chat;

export function mapChat(chat: any): Chat {
  return {
    id: chat.id,
    guid: chat.guid,
    description: chat.description,
    name: chat.name,
    ownerId: chat.ownerId,
    visibility: chat.visibility,
  };
}

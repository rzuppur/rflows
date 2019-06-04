import Id from "@/js/model/Id";

interface Message extends Id {
  createDate: number;
  modifiedDate: number;
  userId: number;
  chatId: number;
  type: ("CHAT" | "NOTE" | "EMAIL" | "FILE" | "EVENT" | "CLEARING");
  text: string;
  replyTo?: null;
  url?: string;
  subject?: string;
  from?: EmailFrom;
  to?: EmailTo[];
  contentType?: string;
  customData?: any;
  error?: any;
  unread?: boolean;
  flagged?: boolean;
}

export default Message;

type EmailFrom = { address: string };

type EmailTo = { address: string };

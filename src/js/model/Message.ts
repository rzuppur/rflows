import Id from "@/js/model/Id";

interface Message extends Id {
  createDate: number;
  modifiedDate: number;
  userId: number;
  chatId: number;
  type: ("CHAT" | "NOTE" | "EMAIL" | "FILE" | "EVENT" | "CLEARING");
  text: string;
  replyTo?: number;
  parentTopicItemId?: number;
  url?: string;
  subject?: string;
  from?: EmailFrom;
  to?: EmailTo[];
  contentType?: string;
  originalFileName?: string;
  customData?: any;
  unread?: boolean;
  flagged?: boolean;
  shadow?: boolean,
  error?: any,
}

export default Message;

type EmailFrom = { address: string };

type EmailTo = { address: string };

export function mapMessage(message: any): Message {
  return {
    id: message.id,
    createDate: message.createDate,
    modifiedDate: message.modifiedDate,
    userId: message.creatorUserId,
    chatId: message.topicId,
    type: message.type,
    text: message.text,
    replyTo: message.referenceFromTopicItemId,
    parentTopicItemId: message.parentTopicItemId,
    url: message.url,
    subject: message.subject,
    from: message.from,
    to: message.to,
    contentType: message.contentType,
    customData: message.customData,
    originalFileName: message.originalFileName,
  };
}

export function messageToDB(message: Message): any {
  return {
    id: message.id,
    createDate: message.createDate,
    modifiedDate: message.modifiedDate,
    creatorUserId: message.userId,
    topicId: message.chatId,
    type: message.type,
    text: message.text,
    referenceFromTopicItemId: message.replyTo,
    parentTopicItemId: message.parentTopicItemId,
    url: message.url,
    subject: message.subject,
    from: message.from,
    to: message.to,
    contentType: message.contentType,
    customData: message.customData,
    originalFileName: message.originalFileName,
  }
}

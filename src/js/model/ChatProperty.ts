import Id from "@/js/model/Id";

interface ChatProperty extends Id {
  name: string;
  value: number;
  chatId: number;
}

export default ChatProperty;

export function mapChatProperty(chatProperty: any): ChatProperty {
  return {
    id: chatProperty.id,
    name: chatProperty.name,
    value: chatProperty.value,
    chatId: chatProperty.topicId,
  };
}

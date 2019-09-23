import Id from "@/js/model/Id";

interface ChatWorkspace extends Id {
  chatId: number;
  workspaceId: number;
  createDate: number;
}

export default ChatWorkspace;

export function mapChatWorkspace(chatWorkspace: any): ChatWorkspace {
  return {
    id: chatWorkspace.id,
    workspaceId: chatWorkspace.orgId,
    chatId: chatWorkspace.topicId,
    createDate: chatWorkspace.createDate,
  };
}

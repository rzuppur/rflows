import User from "@/js/model/User";
import Chat from "@/js/model/Chat";
import ChatUser from "@/js/model/ChatUser";
import UserProperty from "@/js/model/UserProperty";
import Workspace from "@/js/model/Workspace";
import ChatWorkspace from "@/js/model/ChatWorkspace";
import WorkspaceAccess from "@/js/model/WorkspaceAccess";
import Message from "@/js/model/Message";
import MessagesRead from "@/js/model/MessagesRead";

class STORE {
  currentChatId: null | number = null;
  currentChatName: string =  "";
  currentUser: null | User = null;

  loginLoading: boolean = false;
  connectionError: boolean = false;
  errorMsg: string = "";

  modalsOpen: string[] = [];
  openMenu: string | null = null;
  route: string = "login";

  flows: StoreFlows = {
    chats: {
      v: 0,
      d: [],
    },
    chatUsers: {
      v: 0,
      d: [],
    },
    users: {
      v: 0,
      d: [],
    },
    userProperties: {
      v: 0,
      d: [],
    },
    workspaces: {
      v: 0,
      d: [],
    },
    chatWorkspaces: {
      v: 0,
      d: [],
    },
    workspaceAccesses: {
      v: 0,
      d: [],
    },
    messagesRead: {
      v: 0,
      d: [],
    },
    messages: {},
    _messages: {},
  };
}

interface StoreFlows {
  chats: { v: number, d: Chat[] };
  chatUsers: { v: number, d: ChatUser[] };
  users: { v: number, d: User[] };
  userProperties: { v: number, d: UserProperty[] };
  workspaces: { v: number, d: Workspace[] };
  chatWorkspaces: { v: number, d: ChatWorkspace[] };
  workspaceAccesses: { v: number, d: WorkspaceAccess[] };
  messagesRead: { v: number, d: MessagesRead[] };
  messages: {
    [index: string]: { v: number, d: Message[] },
  };
  _messages: {
    [index: string]: { v: number, d: Message[] },
  };
}

export default STORE;

export type StoreKeyVersionNumber = ("chats" | "chatUsers" | "users" | "userProperties" | "workspaces" | "chatWorkspaces" | "workspaceAccesses" | "messagesRead" | "messagesFlagged");

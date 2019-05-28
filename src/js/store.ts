import User from "@/js/model/User";
import Chat from "@/js/model/Chat";
import ChatUser from "@/js/model/ChatUser";
import UserProperty from "@/js/model/UserProperty";
import Workspace from "@/js/model/Workspace";
import ChatWorkspace from "@/js/model/ChatWorkspace";
import WorkspaceAccess from "@/js/model/WorkspaceAccess";

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
}

export default STORE;

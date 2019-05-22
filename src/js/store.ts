import User from "@/js/model/User";
import Chat from "@/js/model/Chat";
import ChatUser from "@/js/model/ChatUser";

class STORE {
  currentChatId: null | number = null;
  currentChatName: string =  "";
  currentUser: null | User = null;

  loginLoading: boolean = false;
  connectionError: boolean = false;
  errorMsg: string = "";

  modalsOpen: string[] = [];
  route: string = "login";

  flows: StoreFlows = {
    chats: {
      v: 0,
      chats: [],
    },
    chatUsers: {
      v: 0,
      chatUsers: [],
    }
  };
}

interface StoreFlows {
  chats: { v: number, chats: Chat[] };
  chatUsers: { v: number, chatUsers: ChatUser[] };
}

export default STORE;

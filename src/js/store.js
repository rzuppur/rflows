import { ALL_TOPICS } from "@/js/consts";

const store = {
  currentChatId: null,
  currentChatName: "",
  currentUser: null,

  loginLoading: false,
  connectionError: null,
  errorMsg: "",
  reconnectTimeout: null,

  topics: (function () {
    const topics = {};
    ALL_TOPICS.forEach((t) => {
      topics[t] = null;
    });
    return topics;
  }()),

  lastUpdateChat: null, // for reactivity, stores the latest chat related update id
  draftMessages: {},

  modalsOpen: [],
  route: "login",
};

export default store;

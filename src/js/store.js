import {ALL_TOPICS} from "@/js/consts";

const store = {
  currentChatId: null,
  currentChatName: "",
  currentUser: null,

  loginLoading: false,
  connectionError: null,
  errorMsg: "",
  reconnectTimeout: null,

  topics: function () {
    let topics = {};
    ALL_TOPICS.forEach(t => {
      topics[t] = null;
    });
    return topics;
  }(),
};

export default store;

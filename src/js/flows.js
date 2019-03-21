import autoBind from "auto-bind";
import Vue from 'vue';
import utils from "@/js/utils";
import Socket from "@/js/socket";
import { GLOBAL_TOPICS, CHAT_TOPICS, ALL_TOPICS, DEBUG, FILE_UPLOAD_URL, FILE_DELETE_URL } from "@/js/consts";


class Flows {
  constructor(store, eventBus) {
    this.store = store;
    this.eventBus = eventBus;
    this.socket = null;

    this.loginData = {
      clientType: "WEB",
      clientInfo: "RFlows",
    };

    this.notifiedMessageIds = [];
    this.shadowMessageId = 10000000;
    window.addEventListener('online', this.reconnectIfNeeded.bind(this));

    this.debug = DEBUG;
    autoBind(this);
  }

  _debug(text, ...extra) {
    if (this.debug) {
      const caller = new Error().stack.split('\n')[2].replace(/ \(.+/g, "").replace(/\s.+at [^.]*\./g, "");
      this._logDebug(text, caller);
      if (extra) console.log(...extra);
    }
  }

  _logDebug(text, caller) {
    text = text.toString();
    const time = utils.debugDateTime();
    const error = !text.indexOf("! ");
    if (error) text = text.substring(2);
    console.log(time + " %c" + this.constructor.name + " (" + caller + "): %c" + text, "color: #3273dc; font-weight: bold", "color: " + ( error ? "#f00" : "inherit" ));
  }

  /*
  SOCKET
   */

  socketFrameHandler(frame) {
    const frameType = frame.headers.cl;
    const type = frameType.replace("[]", "");
    const frameBody = JSON.parse(frame.body);
    const frameDestination = frame.headers.destination.split(".");

    if (frameDestination[frameDestination.length - 1] === "deleted") {
      let itemIndex = this.store.topics[frameType].findIndex(item => item.id === parseInt(frameBody.id));
      this._debug("Delete", frameType, frameBody);
      if (itemIndex > -1) {
        Vue.delete(this.store.topics[frameType], itemIndex);
      }
    }

    if (["ServerInfo", "SubscribeResponse"].indexOf(frameType) > -1) return;
    if (frameType === "LoginResponse") {
      if (frameBody.token) {
        localStorage.setItem("session", JSON.stringify({ token: frameBody.token }));
      }
      this.store.currentUser = frameBody.user;
      frameBody.user ? this._debug(`log in ${frameBody.user.email}`) : this._debug("log out");
      return;
    }

    if (ALL_TOPICS.map(t => t + "[]").indexOf(frameType) > -1) {
      if (this.store.topics[type]) {
        const newIds = frameBody.map(o => o.id);
        Vue.set(this.store.topics, type, this.store.topics[type].filter(o => newIds.indexOf(o.id) < 0).concat(frameBody));
      } else {
        Vue.set(this.store.topics, type, frameBody);
      }
    } else if (ALL_TOPICS.indexOf(frameType) > -1) {
      let old = this.store.topics[frameType]
        ? this.store.topics[frameType].find(topic => topic.id === frameBody.id)
        : false;
      if (old) {
        let index = this.store.topics[frameType].indexOf(old);
        Vue.set(this.store.topics[frameType], index, frameBody);
      } else {
        if (!this.store.topics[frameType]) Vue.set(this.store.topics, frameType, []);
        this.store.topics[frameType].push(frameBody);
      }
    } else {
      if (frameType === "Error") {
        this._debug("! Socket error", frameBody);
      } else {
        this._debug("! UNHANDLED MESSAGE: " + frameType, frame.headers, frameBody);
      }
    }

    if (["TopicItem", "TopicItemRead", "TopicItemUserProperty", "TopicUser"].indexOf(type) > -1) {
      this.store.lastUpdateChat = frame.headers["message-id"];

      if (type === "TopicItem" && !frame.headers["response-id"]) {
        if (typeof frameBody === "object" && !frameBody.deleted && frameBody.creatorUserId !== this.store.currentUser.id) {
          this._messageNotification(frameBody);
        }
      }
    }
  }

  reconnectIfNeeded() {
    if (this.store.reconnectTimeout) {
      this._debug("Trying to reconnect...");
      this.store.errorMsg = "Reconnecting...";
      this.reconnectToFlows(true);
    }
  }

  /**
   * Start trying to reconnect
   */
  startReconnectTimer() {
    if (this.store.reconnectTimeout) return;
    this._debug("Starting reconnect timer");
    this.reconnectWaitSeconds = 2;
    this.reconnectTimer();
  }

  /**
   * Increase timer length and call reconnectToFlows
   */
  reconnectTimer() {
    const wait = this.reconnectWaitSeconds * 1000;
    this._debug("Retrying after " + wait / 1000 + " seconds");
    this.reconnectWaitSeconds = Math.min(Math.round(this.reconnectWaitSeconds * 1.5), 60 * 15);
    this.store.reconnectTimeout = setTimeout(() => {
      this.reconnectToFlows(false);
    }, wait);
  }

  /**
   * @param once {boolean} if false, calls reconnectTimer on failure
   * @returns {Promise<void>}
   */
  async reconnectToFlows(once) {
    const _debug = (text) => {
      if (this.debug) this._logDebug(text, "reconnectToFlows");
    };
    _debug("Reconnecting");
    this.store.errorMsg = "Reconnecting...";
    const connectionSuccessful = await this.connect();
    if (connectionSuccessful) {
      _debug("Reconnect successful");
      clearTimeout(this.store.reconnectTimeout);
      this.store.connectionError = false;
      this.store.reconnectTimeout = null;
      this.store.errorMsg = "";
      if (this.store.currentChatId) this.openChat(this.store.currentChatId);
    } else {
      _debug("Reconnect failed, " + ( once ? "not trying again" : "setting new timer" ));
      if (!once) this.reconnectTimer();
    }
  }

  /**
   * @private
   */
  _socketClose(CloseEvent) {
    this.store.connectionError = true;

    this._debug("", CloseEvent);
    if (this.store.loginLoading) {
      this._debug("! Socket closed while logging in");
      this.store.loginLoading = false;
      this.store.connectionError = true;
    }

    if (!CloseEvent) {
      this._debug("No CloseEvent");
      this.store.errorMsg = "Socket closed";
      return;
    }

    if ([1000, 1002, 1006].indexOf(CloseEvent.code) > -1) {
      this.startReconnectTimer();
    }
    if (CloseEvent.reason?.length) {
      this.store.errorMsg = CloseEvent.reason;
    } else {
      if (CloseEvent.code && CloseEvent.code === 1006) this.store.errorMsg = "Connection lost";
    }
  }

  /**
   * @returns {Promise<Object>} socket open response frame or {error:true, errorFrame: {}}
   * @private
   */
  async _openSocket() {
    const _debug = (text) => {
      if (this.debug) this._logDebug(text, "_openSocket");
    };
    if (!this.socket) {
      _debug("Creating new socket");
      this.socket = new Socket(this.socketFrameHandler, (CloseEvent) => {
        this._socketClose(CloseEvent);
      });
    }

    try {
      _debug("Opening socket and subscribing to common");
      const openFrame = await this.socket.open();
      this.socket.subscribe("/user/queue/response");
      this.socket.subscribe("/topic/common");
      this.reconnect = true;
      return openFrame;

    } catch (errorData) {
      _debug("! Error while opening socket");
      return {
        error: true,
        errorData: errorData,
      };
    }
  }

  /*
  LOGIN
   */

  /**
   * Opens a socket connection to Contriber Flows
   * Logs in using loginData if necessary (needs to be set before using setLogin)
   * Subscribes to and reads all global topics (TopicUser, UserProperty, Topic, User)
   *
   * @returns {Promise<boolean>} indicating a successful connection
   */
  async connect() {
    const _debug = (text) => {
      if (this.debug) this._logDebug(text, "connect");
    };

    _debug("Connecting...");
    const openFrame = await this._openSocket();
    if (openFrame.error) {
      _debug("! Error while connecting");
      return false;
    }
    if (!openFrame.alreadyOpen) _debug("Socket opened");

    // check if log in required
    if (!openFrame["user-name"]) {
      _debug("Log in required");
      await this.socket.message("/app/Login.logout", {}, true);
      try {
        await this.socket.message("/app/Login.login", this.loginData, true);
      } catch (error) {
        _debug("! Log in error: " + error.body.shortName);
        if (error.body.description !== "You are already logged in. Please logoff or disconnect first (refreshing the page helps)!") this.logout();
        return false;
      }

      delete this.loginData.password;  // delete password from memory after log in
      _debug("Log in done");
    }

    const currentUserId = this.store.currentUser?.id;

    if (currentUserId) {
      _debug("Subscribing to global topics");
      GLOBAL_TOPICS.forEach(topic => ["modified", "deleted"].forEach(type =>
        this.socket.subscribe("/topic/User." + currentUserId + "." + topic + "." + type)));
      _debug("Reading global topics");
      await Promise.all(GLOBAL_TOPICS.map(topic =>
        this.socket.message("/app/" + topic + ".findByUser", { id: currentUserId }, true),
      ));
      _debug("Global topics done");

      const chatUsers = this.store.topics.TopicUser.filter(chatUser => chatUser.userId === this.store.currentUser.id);
      chatUsers.forEach((chatUser) => this.socket.subscribe("/topic/Topic." + chatUser.topicId + ".TopicItem.modified"));
      _debug("Subscribed to " + chatUsers.length + " chats");

      if (this.desktopNotifications && Notification.permission === "default") {
        Notification.requestPermission().then(result => {
          if (result === "default") this.eventBus.$emit("notify", "Notifications are disabled");
          if (result === "denied") this.eventBus.$emit("notify", "Notifications are blocked, you can change this in site settings");
          if (result === "granted") this.eventBus.$emit("notify", "Notifications enabled");
        });
      }

      return true;

    } else {
      _debug("! No currentUser in store");
      return false;
    }
  }

  setLogin(loginData) {
    let debugData = { ...loginData };
    if (debugData.password) debugData.password = debugData.password.replace(/./g, "*");
    if (debugData.token) debugData.token = debugData.token.replace(/./g, "*");
    this._debug("Setting log in data", debugData);
    this.loginData = { ...loginData, ...this.loginData };
  }

  getLoginToken() {
    const session = JSON.parse(localStorage.getItem("session"));
    if (session?.token) {
      this._debug("Login token found");
      return session.token;
    }
    this._debug("No login token found");
  }

  logout() {
    this._debug("Clearing session and loginData");
    localStorage.removeItem("session");
    delete this.loginData.email;
    delete this.loginData.password;
    delete this.loginData.token;

    this._debug("Removing user data");
    ALL_TOPICS.forEach(topic => {
      this.store.topics[topic] = null;
    });

    if (this.socket?.connected) {
      this._debug("Unsubscribing");
      this.socket.unsubscribeAll();
      this._debug("Sending log out message");
      this.socket.message("/app/Login.logout", {}, true);
    } else {
      this._debug("Socket not connected");
    }
    this.store.currentUser = null;
    this.store.currentChatId = null;
    this.store.currentChatName = "";
    this.store.loginLoading = false;
    this.store.draftMessages = {};
    this.eventBus.$emit("logout");
  }


  /*
  USERS
   */

  getFullNameFromUser(user) {
    if (user?.firstName) return user.firstName + " " + user.lastName;
    return "?";
  }

  getFullName(userId) {
    if (this.store.topics.User) {
      const user = this.store.topics.User.find(user => user.id === userId);
      return this.getFullNameFromUser(user);
    }
    return this.getFullNameFromUser();
  }

  getFirstName(userId) {
    if (this.store.topics.User) {
      const user = this.store.topics.User.find(user => user.id === +userId);
      if (user?.firstName) return user.firstName;
    }
    return "?";
  }

  getAvatarFromUser(user) {
    if (user?.avatarUrl) {
      return this.getFilePath(user.avatarUrl);
    }
    let char = user?.firstName ? user.firstName.charAt(0) : "?";
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='56' width='42' style='background: %23b0b8c0'%3E%3Ctext text-anchor='middle' x='50%25' y='50%25' dy='0.35em' fill='white' font-size='25' font-family='sans-serif'%3E" +
      char + "%3C/text%3E%3C/svg%3E";
  }

  getAvatar(userId) {
    if (this.store.topics.User) {
      const user = this.store.topics.User.find(user => user.id === userId);
      return this.getAvatarFromUser(user);
    }
    return this.getAvatarFromUser();
  }

  getUserStatus(userId) {
    if (this.store.topics.User) {
      const user = this.store.topics.User.find(user => userId === user.id);
      if (user?.status) return user.status;
    }
    return "?";
  }

  currentChatUser() {
    const currentUserId = this.store.currentUser?.id;
    const currentChatId = this.store.currentChatId;
    const chatUsers = currentChatId ? this.getChatUsers(currentChatId) : null;
    if (chatUsers && currentUserId) {
      return chatUsers.find(chatUser => chatUser.userId === currentUserId);
    }
  }

  getCurrentUserWorkspaces() {
    if (this.store.currentUser && this.store.topics.Organization && this.store.topics.UserAccess) {
      let workspaces = [];
      const userId = this.store.currentUser.id;
      const orgs = this.store.topics.Organization.filter(org => !org.integration);
      this.store.topics.UserAccess.forEach(access => {
        if (access.userId === userId) {
          const workspace = orgs.find(org => org.id === access.orgId);
          if (workspace) workspaces.push({
            workspace: workspace,
            access: access.role,
            logo: this.getWorkspaceLogo(workspace),
          });
        }
      });
      if (workspaces.length) return workspaces;
    }
  }

  getWorkspaceLogo(workspace) {
    if (workspace) {
      if (workspace.logoUrl) {
        return this.getFilePath(workspace.logoUrl);
      } else if (workspace.name) {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='42' width='42' style='background: %23b0b8c0'%3E%3Ctext text-anchor='middle' x='50%25' y='50%25' dy='0.35em' fill='white' font-size='25' font-family='sans-serif'%3E" + workspace.name.charAt(0) + "%3C/text%3E%3C/svg%3E";
      }
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='42' width='42' style='background: %23b0b8c0'%3E%3Ctext text-anchor='middle' x='50%25' y='50%25' dy='0.35em' fill='white' font-size='25' font-family='sans-serif'%3E?%3C/text%3E%3C/svg%3E";
  }

  /*
  CHATS
   */

  /**
   * Change open chat
   *
   * Subscribe and read messages
   * Sets status of currently open to closed and new chat to open
   * Reorders recent chats
   * Sets current chat name in store
   * Sets current chat id in store
   *
   * @param chatId {?number|string}
   */
  openChat(chatId) {
    const _debug = (text) => {
      if (this.debug) this._logDebug(text, "openChat");
    };

    const id = +chatId;
    this.eventBus.$emit("currentChatChange", this.store.currentChatId, id);

    if (!id) {
      _debug("currentChatId > null");
      if (this.store.currentChatId) {
        this.socket.message("/app/Topic.setMyStatus", { topicId: this.store.currentChatId, status: "NONE" });
      }
      this.store.currentChatName = "";
      this.store.currentChatId = null;
      return;
    }

    if (id !== this.store.currentChatId) {
      _debug("Changing chat " + this.store.currentChatId + " > " + id);

      try {
        _debug("Subscribing to chat");
        this.socket.subscribe("/user/queue/Topic." + id + ".TopicItemRead.modified", true);
        this.socket.subscribe("/user/queue/Topic." + id + ".TopicItemRead.deleted", true);
        _debug("Reading chat");
        this.socket.message("/app/TopicItemRead.findByTopic", { id: id }, true);

        CHAT_TOPICS.forEach(chatTopic => {
          this.socket.subscribe("/topic/Topic." + id + "." + chatTopic + ".modified", true);
          this.socket.subscribe("/topic/Topic." + id + "." + chatTopic + ".deleted", true);
          this.socket.message("/app/" + chatTopic + ".findByTopic",
            chatTopic === "TopicItem"
              ? { id: id, filter: { amount: 50 } }
              : { id: id }, true);
          this.getChatMessages(id, { sticky: true });
        });

        // Set user status
        if (this.store.currentChatId) {
          this.socket.message("/app/Topic.setMyStatus", { topicId: this.store.currentChatId, status: "NONE" });
        }
        this.socket.message("/app/Topic.setMyStatus", { topicId: id, status: "OPEN" });
        this.store.currentChatId = id;

        // Reorder recent chats
        if (this.store.topics.UserProperty) {
          const recentIndex = this.store.topics.UserProperty.findIndex(userProperty => userProperty.name === "recentTools");
          let userPropsRecent = this.store.topics.UserProperty[recentIndex];
          delete userPropsRecent.modifiedDate;
          let val = userPropsRecent.value.filter(recent => recent.id !== id);
          val.unshift({ id: id, type: "MEETING" });
          userPropsRecent.value = val;
          Vue.set(this.store.topics.UserProperty, recentIndex, userPropsRecent);
          this.socket.message("/app/UserProperty.save", userPropsRecent, true);
        }

        // Set current chat name
        this.store.currentChatName = this.getChatName(id);

        // TODO: an ugly hack pls remove
        setTimeout(() => {this.store.currentChatName = this.getChatName(this.store.currentChatId);}, 500);
        setTimeout(() => {this.store.currentChatName = this.getChatName(this.store.currentChatId);}, 1500);
        setTimeout(() => {this.store.currentChatName = this.getChatName(this.store.currentChatId);}, 5000);
        setTimeout(() => {this.store.currentChatName = this.getChatName(this.store.currentChatId);}, 10000);
        setTimeout(() => {this.store.currentChatName = this.getChatName(this.store.currentChatId);}, 20000);
      } catch (error) {
        this._debug("! Error opening chat");
        console.log(error);
        this.eventBus.$emit("notify", "Error opening chat");
      }
    }
  }


  /**
   * Add data to flows chats like unread count and name if it's missing.
   * Removes all unnecessary legacy chats.
   *
   * @returns {boolean} indicating if chats were enriched
   */
  enrichChats() {
    if (!this.store.topics.User
      || !this.store.topics.TopicUser
      || !this.store.currentUser
      || !this.store.topics.Topic) return false;

    // Remove special items and legacy Startup Includer integration chats
    let allChats = JSON.parse(JSON.stringify(this.store.topics.Topic.filter(chat => !chat.integration && !chat.specialItemId)));
    const allUsers = JSON.parse(JSON.stringify(this.store.topics.TopicUser));
    const currentUserId = this.store.currentUser.id;

    allChats.forEach(chat => {
      // Find all users in chat
      const chatUsers = allUsers.filter(chatUser => chatUser.topicId === chat.id);

      // Find my chat user for unread counts
      const myChatUser = chatUsers.find(chatUser => chatUser.userId === currentUserId);

      // Add unread counts to chat
      chat.unread = ( myChatUser ? myChatUser.unreadItemsCount : 0 );
      chat.unreadImportant = ( myChatUser ? myChatUser.unreadItemsToMeCount + myChatUser.atItemsToMeCount : 0 );
      chat.unreadAtme = ( myChatUser ? myChatUser.atItemsToMeCount : 0 );
      chat.flagged = ( myChatUser ? myChatUser.flaggedItemsCount : 0 );

      // If chat has no name, make one from participants
      if (!chat.name) {
        const otherUsers = chatUsers.filter(chatUser => chatUser.userId !== this.store.currentUser.id);
        let otherUserNames = [];
        if (otherUsers.length) {
          otherUsers.forEach(chatUser => otherUserNames.push(this.getFullName(chatUser.userId)));
        }
        chat.name = otherUserNames.join(", ");
      }
    });

    this.store.topics.Topic = allChats.sort((a, b) => ( a.name ? a.name : "" ).localeCompare(b.name ? b.name : ""));
    return true;
  }

  /**
   * Get chat messages from chat matching filter
   *
   * Known filters:
   * { from: { id: <messageId> }, amount: <backwardsN> }
   * { sticky: true } UNREAD AND FLAGGED
   * { amount: <lastN> }
   *
   * @param chatId {number}
   * @param filter {Object}
   * @returns {Promise<Object>}
   */
  getChatMessages(chatId, filter) {
    return this.socket.message("/app/TopicItem.findByTopic", { id: chatId, filter: filter }, true);
  }

  /**
   * @param chatId {number}
   * @returns {string}
   */
  getChatName(chatId) {
    if (this.store.topics.Topic?.length) {
      const chat = this.store.topics.Topic.find(chat => chat.id === +chatId);
      if (chat?.name) {
        return chat.name;
      }
    }
    return "?";
  }

  getChatWorkspace(chatId) {
    const workspaces = this.getCurrentUserWorkspaces();
    const locations = this.store.topics.TopicLocation;

    if (locations && workspaces) {
      const chatOrgs = locations.filter(location => location.topicId === +chatId)
      .map(location => location.orgId);
      for (let i = 0; i < chatOrgs.length; i++) {
        const workspace = workspaces.find(workspace => workspace.workspace.id === chatOrgs[i]);
        if (workspace) return workspace;
      }
    }
  }

  getWorkspaceChats(workspaceId) {
    const locations = this.store.topics.TopicLocation;

    if (locations) {
      return locations.filter(location => location.orgId === +workspaceId)
      .map(location => location.topicId);
    }
  }

  chatMessages() {
    const currentChatId = this.store.currentChatId;
    if (currentChatId && this.chatMessagesCached) {
      const id = this.store.lastUpdateChat + "-" + currentChatId;
      if (id === this.chatMessagesCached.id) {
        this._debug("Returning cached chat messages (" + id + ")");
        return JSON.parse(this.chatMessagesCached.messages);
      }
    }

    let messages = JSON.parse(JSON.stringify(this.store.topics.TopicItem));
    const currentUserId = this.store.currentUser?.id;
    const chatMessagesRead = this.chatMessagesRead();
    const chatMessagesFlagged = this.chatMessagesFlagged();
    if (messages && currentChatId) {
      this._debug("Getting currently open chat messages");
      messages = messages.filter(message => !message.deleted && !message.parentTopicItemId && message.topicId === currentChatId);
      messages.sort((a, b) => a.id - b.id);

      if (chatMessagesRead && currentUserId) {
        const chatUsers = this.getChatUsers(currentChatId);
        if (!chatUsers || chatUsers.find(chatUser => chatUser.userId === currentUserId)) {
          messages = messages.map(message => {
            message.unread = message.creatorUserId !== currentUserId && !chatMessagesRead.find(readRange => readRange.itemFrom <= message.id && readRange.itemTo >= message.id);
            return message;
          });
        }
      }
      if (chatMessagesFlagged) {
        messages = messages.map(message => {
          message.flagged = chatMessagesFlagged.indexOf(message.id) > -1;
          return message;
        });
      }

      this.chatMessagesCached = {
        messages: JSON.stringify(messages),
        id: this.store.lastUpdateChat + "-" + currentChatId,
      };
      return messages;
    }
  }

  chatMessagesRead() {
    const read = this.store.topics.TopicItemRead;
    const currentChatId = this.store.currentChatId;
    const currentUserId = this.store.currentUser?.id;

    if (read && currentChatId && currentUserId) {
      return read.filter(TopicItemRead => TopicItemRead.topicId === currentChatId && TopicItemRead.userId === currentUserId);
    }
  }

  chatMessagesFlagged() {
    const prop = JSON.parse(JSON.stringify(this.store.topics.TopicItemUserProperty));
    const currentChatId = this.store.currentChatId;
    const currentUserId = this.store.currentUser?.id;

    if (prop && currentChatId && currentUserId) {
      return prop.filter(userProperty => userProperty.flag
        && userProperty.topicId === currentChatId
        && userProperty.userId === currentUserId)
      .map(userProperty => userProperty.itemId)
      .sort();
    }
  }

  getChatUsers(chatId) {
    const chatUsers = this.store.topics.TopicUser;

    if (chatUsers) {
      return chatUsers.filter(chatUser => chatUser.topicId === +chatId).sort((a, b) => a.createDate - b.createDate);
    }
  }

  /**
   * Get flagged (saved) message ids by chat
   *
   * Known filters:
   * { sticky: true } UNREAD AND FLAGGED
   *
   * @param chatId
   * @param filter
   * @returns {Promise<Object>} body: TopicItemUserProperty[]<Object>
   *  id {number}
   *  modifiedDate {number}
   *  itemId {number} chat message id
   *  userId {number} user id who saved this message
   *  topicId {number} chat id
   *  flag {0|1} is message saved
   */
  getChatUserProps(chatId, filter) {
    return this.socket.message("/app/TopicItemUserProperty.findByTopic", { id: chatId, filter: filter }, true);
  }

  /**
   * Sets typing status of currently open chat
   *
   * @param typing {boolean}
   */
  setTypingStatus(typing) {
    if (this.store.currentChatId) {
      this.socket.message("/app/Topic.setMyStatus", {
        topicId: this.store.currentChatId,
        status: typing ? "TYPING" : "OPEN",
      });
    }
  }

  /**
   * @returns {Promise<Object>|undefined}
   */
  markCurrentChatRead() {
    if (!this.store.topics.TopicItem || !this.store.currentUser) {
      this._debug("! No TopicItem or currentUser in store");
      return;
    }
    const ids = this.chatMessages()
    .filter(msg => msg.unread)
    .map(msg => msg.id);
    if (!ids.length) return;
    return this.socket.message("/app/TopicItemRead.markAsRead", {
      topicId: this.store.currentChatId,
      itemIds: ids,
    }, true);
  }

  addChatToStarred(chatId) {
    if (this.store.topics.UserProperty) {
      let favs = this.store.topics.UserProperty.find(userProperty => userProperty.name === "favorites");
      if (!favs) favs = { name: "favorites", orgId: null, userId: this.store.currentUser.id, value: [] };
      const favIds = favs.value.map(v => v.id);
      if (favIds.indexOf(+chatId) > -1) return;
      delete favs.modifiedDate;
      favs.value.push({ type: "MEETING", id: +chatId });
      return this.socket.message("/app/UserProperty.save", favs, true);
    }
  }

  removeChatFromStarred(chatId) {
    if (this.store.topics.UserProperty) {
      let favs = this.store.topics.UserProperty.find(userProperty => userProperty.name === "favorites");
      const index = favs.value.map(v => v.id).indexOf(+chatId);
      if (index < 0) return;
      delete favs.modifiedDate;
      favs.value.splice(index, 1);
      return this.socket.message("/app/UserProperty.save", favs, true);
    }
  }

  removeChatFromRecents(chatId) {
    if (this.store.topics.UserProperty) {
      let recents = this.store.topics.UserProperty.find(userProperty => userProperty.name === "recentTools");
      const index = recents.value.map(v => v.id).indexOf(+chatId);
      if (index < 0) return;
      delete recents.modifiedDate;
      recents.value.splice(index, 1);
      return this.socket.message("/app/UserProperty.save", recents, true);
    }
  }

  /*
  MESSAGES
   */

  /**
   * Returns a message only if it exists in store
   *
   * @param messageId
   * @returns {Object}
   */
  getChatMessage(messageId) {
    if (this.store.topics.TopicItem) {
      const message = this.store.topics.TopicItem.find(TopicItem => TopicItem.id === messageId);
      if (message) return message;
    }
  }

  /**
   * Sends a message to currently open chat
   * Creates a shadow message instantly that is deleted when real message is saved in server
   * If sending message fails, sets shadow message status as error
   *
   * @param message {Object}
   */
  sendChatMessage(message) {
    message.creatorUserId = this.store.currentUser.id;
    message.topicId = this.store.currentChatId;
    message.customData = { test: true };

    const shadowId = this.shadowMessageId++;
    // TODO: save message to localstorage => in case of error sending it is still there after refresh
    // TODO: clear localstorage on logout (don't keep messages around)

    this.socket.message("/app/TopicItem.save", message, true)
    .then(() => {
      this._debug("Real message arrived (" + shadowId + ")");
      const messageIndex = this.store.topics.TopicItem.findIndex(message => message.id === shadowId);
      if (messageIndex) {
        Vue.delete(this.store.topics.TopicItem, messageIndex);
      }
      // TODO: Delete from local storage
    })
    .catch(() => {
      const message = this.store.topics.TopicItem.find(message => message.id === shadowId);
      if (message) {
        message.error = true;
      }
    });

    message.id = shadowId;
    message.shadow = true;
    this.store.topics.TopicItem.push(message);
    this.eventBus.$emit("messagesScrollUpdate");
    this._debug("Shadow message created (" + shadowId + ")");
    this.store.lastUpdateChat = shadowId;
  }

  /**
   * Replace local copy of message instantly (used for editing)
   *
   * @param newMessage {Object}
   */
  replaceLocalMessage(newMessage) {
    const messageIndex = this.store.topics.TopicItem
    .findIndex(message => message.id === newMessage.id);
    Vue.set(this.store.topics.TopicItem, messageIndex, { ...newMessage });
  }

  /**
   * Edit existing message
   * Local copy is changed instantly
   *
   * @param editedMessage
   * @returns {Promise<Object>} updated message
   */
  editChatMessage(editedMessage) {
    delete editedMessage.unread;
    editedMessage.modifiedDate = new Date();
    this.replaceLocalMessage(editedMessage);
    delete editedMessage.createDate;
    delete editedMessage.modifiedDate;
    delete editedMessage.clientId;
    delete editedMessage.creatorUserId;
    delete editedMessage.cryptoKey;
    delete editedMessage.previewSpecial;
    delete editedMessage.round;
    //editedMessage.customData = {key: "value"}; //TODO: siia saab vajadusel custom datat salvestada, a la reactionid
    //editedMessage.childFileIds = [];  //TODO: note sees olevad pildid, nende id mis saab kohe base64 uploadeides
    return this.socket.message("/app/TopicItem.save", editedMessage, true);
  }

  /**
   * TODO: if type is FILE, delete the file itself as well
   *
   * @param messageId {number}
   * @returns {Promise}
   */
  deleteChatMessage(messageId) {
    const messageIndex = this.store.topics.TopicItem.findIndex(message => message.id === messageId);
    if (messageIndex) {
      Vue.delete(this.store.topics.TopicItem, messageIndex);
    }
    return this.socket.message("/app/TopicItem.delete", { id: messageId }, true);
  }

  /**
   * @param messageId {number}
   * @param flag {boolean}
   * @returns {Promise}
   */
  setFlag(messageId, flag) {
    return this.socket.message("/app/TopicItemUserProperty.save", {
      itemId: messageId,
      flag: +flag,
    }, true);
  }

  /**
   * @param messageId {number}
   * @returns {Promise}
   */
  markChatMessageRead(messageId) {
    return this.socket.message("/app/TopicItemRead.markAsRead", {
      topicId: this.store.currentChatId,
      itemIds: [messageId],
    }, true);
  }

  /**
   * @param message {Object}
   * @private
   */
  _messageNotification(message) {
    if (!this.desktopNotifications) return;
    if (this.notifiedMessageIds.indexOf(message.id) > -1) return;

    const hidden =
      //(typeof document.hidden !== "undefined") ? document.hidden :
      !document.hasFocus();
    if (hidden || message.topicId !== this.store.currentChatId) {
      this.notifiedMessageIds.push(message.id);
      const chatName = this.getChatName(message.topicId);
      const creatorName = this.getFullName(message.creatorUserId);
      const title = creatorName + ( chatName !== creatorName ? " - " + chatName : "" );
      let options = {
        body: message.type === "CHAT"
          ? this.getMessageTextRepresentation(this.chatTextParse(message.text))
          : this.getMessageTextRepresentation(message.text),
        timestamp: message.createDate,
        renotify: true,
        tag: message.topicId + "-" + this.store.currentUser?.id,
        // requireInteraction: true,
        // actions: [{action: "mark_as_read", title: "Mark as read" }],
      };
      let notification;
      const onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (this.store.currentChatId !== message.topicId) {
          this.openChat(message.topicId);
        } else {
          this.eventBus.$emit("scrollToMessage", message.id);
        }
      };

      if (message.type === "FILE" && message.url) {
        let ext = message.url.split(".");
        ext = ext[ext.length - 1] + "";
        if (["png", "jpg", "jpeg"].indexOf(ext.toLowerCase()) > -1) {
          options.image = this.getFilePath(message.url);
        }
      }

      const avatar = this.getAvatar(message.creatorUserId);

      if (avatar.indexOf("data:") === 0) {
        // For svg placeholder avatars, draw them to canvas to get a bitmap
        const canvas = utils.createCanvas(42 * 3, 42 * 3);
        const ctx = canvas.getContext("2d");
        let img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, ( 56 - 42 ) * -1.5, 42 * 3, 56 * 3);
          options.icon = canvas.toDataURL();
          notification = new Notification(title, options);
          notification.onclick = onclick;
        };
        img.src = avatar;
      } else {
        // Otherwise just use the image
        options.icon = avatar;
        notification = new Notification(title, options);
        notification.onclick = onclick;
      }
    }
  }

  /*
  MESSAGE UTILS
   */

  chatTextParse(text) {
    if (!text)
      return "";
    const currentUser = this.store.currentUser;
    const firstName = currentUser ? currentUser.firstName : "";
    const lastName = currentUser ? currentUser.lastName : "";
    const emojis = {":)": "🙂", ";)": "😉", ":d": "😁", ":\\": "😕", ":/": "😕", ":(": "😟", "(y)": "👍", "(n)": "👎"};
    const splitText = text.match(/\S+|\s/g);

    /* copied with modifications from compiled Contriber Flows source */
    let parsedText = [];
    const addText = (text) => parsedText.push(utils.textToHTML(text));
    for (let i = 0; i < splitText.length; i++) {
      let part = splitText[i];
      if (part === firstName || part === lastName || "@" === part[0] && ( part.substr(1) === firstName || part.substr(1) === lastName )) {
        parsedText.push('<span class="message-at">');
        addText(part);
        parsedText.push("</span>");
      } else {
        if (part.match(/^(ftp:\/\/|http:\/\/|https:\/\/|mailto:)(.*)/)) {
          parsedText.push('<a target="_blank" rel="noopener noreferrer nofollow" href="');
          addText(part.replace(/"/g, "&quot;"));
          parsedText.push('">');
          addText(part);
          parsedText.push("</a>");
        } else if (part.match(/^(www.)(.*)/)) {
          parsedText.push('<a target="_blank" rel="noopener noreferrer nofollow" href="https://');
          addText(part.replace(/"/g, "&quot;"));
          parsedText.push('">');
          addText(part);
          parsedText.push("</a>");
        } else {
          if (emojis[part.toLowerCase()]) {
            parsedText.push(emojis[part.toLowerCase()]);
          } else {
            addText(part);
          }
        }
      }
    }
    return parsedText.join("");
  }

  /**
   * Simple regexes to replace relative src urls with flows.contriber and modify links
   *
   * @param text {string}
   * @returns {string}
   */
  noteTextParse(text) {
    return text
    .replace(/src=['"]\/files\/*([^'"]+)['"]/g, 'src="https://flows.contriber.com/files/$1"')
    .replace(/<a[^<]+href=['"]*([^'"]+)['"][^>]*>/g, '<a target="_blank" rel="noopener noreferrer nofollow" href="$1">')
    .replace(/<p><\/p>/g, "<br>");
  }

  /**
   * @param messageText {string}
   * @returns {string}
   */
  getMessageTextRepresentation(messageText) {
    return messageText
    .replace(/<img .*?alt=[\"']?([^\"']*)[\"']?.*?\/?>/g, "$1")
    .replace(/<a .*?href=["']?([^"']*)["']?.*?>(.*)<\/a>/g, "$2")
    .replace(/<(\/p|\/div|\/h\d|br)\w?\/?>/g, "\n")
    .replace(/<[A-Za-z/][^<>]*>/g, "")
    .replace(/&quot/g, '"');
  }

  /*
  SETTINGS
   */

  /**
   * @returns {boolean}
   */
  get autoMarkAsRead() {
    return this._getBooleanUserProp("autoMarkAsRead", true);
  }

  /**
   * @param value {boolean}
   */
  set autoMarkAsRead(value) {
    this._setBooleanUserProp("autoMarkAsRead", value);
  }

  /**
   * @returns {boolean}
   */
  get desktopNotifications() {
    return this._getBooleanUserProp("desktopNotifications", false);
  }

  /**
   * @param value {boolean}
   */
  set desktopNotifications(value) {
    this._setBooleanUserProp("desktopNotifications", value);
  }

  /**
   * @returns {boolean}
   */
  get showWorkspaceSwitcher() {
    return this._getBooleanUserProp("showWorkspaceSwitcher", true);
  }

  /**
   * @param value {boolean}
   */
  set showWorkspaceSwitcher(value) {
    this._setBooleanUserProp("showWorkspaceSwitcher", value);
  }

  /**
   * @returns {boolean}
   */
  get compactMode() {
    return this._getBooleanUserProp("compactMode", false);
  }

  /**
   * @param value {boolean}
   */
  set compactMode(value) {
    this._setBooleanUserProp("compactMode", value);
  }

  /**
   * @param propName {string}
   * @param fallback {boolean}
   * @returns {boolean}
   * @private
   */
  _getBooleanUserProp(propName, fallback) {
    if (!this.store.topics.UserProperty) return fallback;
    const prop = this.store.topics.UserProperty.find(userProperty => userProperty.name === propName);
    return prop ? prop.value : fallback;
  }

  /**
   * @param propName {string}
   * @param value {boolean}
   * @private
   */
  _setBooleanUserProp(propName, value) {
    if (!this.store.topics.UserProperty) {
      this._debug("! UserProperty missing from store");
      return;
    }
    value = !!value;
    const propIndex = this.store.topics.UserProperty.findIndex(userProperty => userProperty.name === propName);
    let prop;
    if (propIndex < 0) {
      this._debug(`Creating ${propName} (${value})`);
      prop = {
        id: null,
        name: propName,
        value: value,
        userId: this.store.currentUser.id,
        orgId: null,
      };
    } else {
      this._debug(`Setting ${propName} (${value})`);
      prop = this.store.topics.UserProperty[propIndex];
      delete prop.modifiedDate;
      prop.value = value;
    }
    Vue.set(this.store.topics.UserProperty, propIndex, prop);
    this.socket.message("/app/UserProperty.save", prop, true)
    .then(() => this._debug(`Saved ${propName} (${value})`))
    .catch(() => {
      this.eventBus.$emit("notify", `Error saving ${propName}`);
      this._debug(`! Error saving user property ${propName} (${value})`);
    });
  }

  /**
   * @param fname {string}
   * @param lname {string}
   */
  setUserName(fname, lname) {
    const currentUser = this.store.currentUser;
    if (!currentUser) return this._debug("! No currentUser in store");
    fname = fname.toString();
    lname = lname.toString();
    if (fname === currentUser.firstName && lname === currentUser.lastName) return this._debug("Name hasn't changed, not saving");
    this.store.currentUser.firstName = fname;
    this.store.currentUser.lastName = lname;
    this.socket.message("/app/User.save", {
      id: currentUser.id,
      email: currentUser.email,
      firstName: fname,
      lastName: lname,
      password: null,
      gender: currentUser.gender,
    }, true)
    .then(() => this.eventBus.$emit("notify", "Name saved"))
    .catch(() => this.eventBus.$emit("notift", "Error saving name"));
  }

  removeAvatar() {
    const currentUser = this.store.currentUser;
    if (!currentUser) return this._debug("! No currentUser in store");
    if (currentUser.avatarUrl) this.deleteFile(currentUser.avatarUrl);
    this.store.currentUser.avatarUrl = null;
    this.socket.message("/app/User.save", {
      id: currentUser.id,
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      password: null,
      gender: currentUser.gender,
      avatarUrl: false,
    }, true)
    .then(() => this.eventBus.$emit("notify", "Avatar removed"))
    .catch(() => this.eventBus.$emit("notify", "Error removing avatar"));
  }

  // TODO: avatar upload

  /*
  FILES
   */

  /**
   * Upload a file to currently open chat
   *
   * TODO: file max size check
   *
   * @param formData {FormData}
   * @param fileName {string}
   * @param [replyToId] {number}
   * @returns {Promise}
   */
  uploadFileToChat(formData, fileName, replyToId) {
    const token = this.getLoginToken();
    const openChatId = this.store.currentChatId;
    if (!openChatId || !token) {
      this._debug("! No token or currentChatId");
      return Promise.reject("No token or currentChatId");
    }
    formData.append("topicId", openChatId.toString());
    formData.append("token", token);
    formData.append("text", fileName);
    if (replyToId) formData.append("referenceFromTopicItemId", replyToId.toString());

    return fetch(FILE_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });
  }

  getFilePath(url) {
    return "https://flows.contriber.com" + encodeURI(url);
  }

  /**
   * @param url {string} "/files/2019-02-02/..."
   */
  deleteFile(url) {
    const _debug = (text) => {
      if (this.debug) this._logDebug(text, "deleteFile");
    };
    _debug(`Deleting file ${url}`);
    const formData = new FormData();
    formData.append("token", this.getLoginToken());
    formData.append("src", url);
    fetch(FILE_DELETE_URL, {
      method: "POST",
      body: formData,
    })
    .then(() => _debug(`File ${url} deleted`))
    .catch((error) => _debug(`Error deleting file ${url}`, error));
  }
}


export default Flows;

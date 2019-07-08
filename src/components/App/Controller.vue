<script>

  export default {
    name: "Controller",
    data() {
      return {
        lastChatIdChangeWasFromNav: false,
      };
    },
    watch: {
      "$store.route": {
        immediate: true,
        handler(val) {
          setTimeout(() => this.$root.updateFullHeight(), 0);
          if (val === "login") {
            setTimeout(() => { document.title = "RFlows"; }, 0);
          }
        },
      },
      "$store.currentUser": {
        immediate: true,
        handler(val, oldVal) {
          if ((typeof oldVal === "undefined") || val?.email !== oldVal?.email) {
            if (val == null) {
              this._debug("Log out");
              this.$store.route = "login";
            } else {
              this._debug(`User: ${val.email}`);
              this.$store.route = "chat";
            }
          }
        },
      },
      "$store.currentChatId": {
        immediate: true,
        handler(val, oldVal) {
          if (val === oldVal) return;
          this.$events.$emit("currentChatChange", oldVal, val);

          if (!val) document.title = `${this.$store.unreadMessagesTotal}RFlows`;

          if (oldVal !== null && val) {
            const chatIds = this.$flows.chats.recentChatIds.filter(chatId => chatId !== val);
            chatIds.unshift(val);
            this.$flows.chats.recentChatIds = chatIds;
          }

          if (this.lastChatIdChangeWasFromNav) {
            this.lastChatIdChangeWasFromNav = false;
          } else {
            if (!oldVal && val) {
              window.history.replaceState({ chatId: val }, "", `/${val}/}`);
            }
            if (val && oldVal) {
              window.history.pushState({ chatId: oldVal }, "", `/${oldVal}/${this.$store.currentChatName.replace(/\s+/g, "-").toLowerCase()}`);
            }
            if (oldVal && !val) {
              window.history.replaceState(null, "", "/");
            }
          }

          this.updateCurrentChatName();
        },
      },
      "$store.flows.chats.v": {
        handler() {
          this.updateCurrentChatName();
        },
      },
    },
    created() {
      this.$events.$on("loginDone", this.loginDone);

      window.enableDebugMode = () => {
        this.$store.debugMode = true;
      };
      window.disableDebugMode = () => {
        this.$store.debugMode = false;
      };

      if (process?.env.NODE_ENV === "development") this.$store.debugMode = true;
    },
    async mounted() {
      await this.loginIfHasToken();

      if (window.history.state?.chatId) {
        this._debug(`Opening ${window.history.state.chatId} from history.state`);
        this.$store.currentChatId = window.history.state.chatId;
        this.lastChatIdChangeWasFromNav = true;
      } else {
        const parts = window.location.pathname.split("/").filter(part => part);
        if (parts.length && parts[0] && +parts[0]) {
          this._debug(`Opening ${+parts[0]} from URL`);
          this.$store.currentChatId = +parts[0];
          this.lastChatIdChangeWasFromNav = true;
        }
      }

      window.onpopstate = (event) => {
        if (event.state?.chatId) {
          this._debug(`Opening ${event.state.chatId} from onpopstate`);
          this.$store.currentChatId = event.state.chatId;
          this.lastChatIdChangeWasFromNav = true;
        }
      };
    },
    methods: {
      loginDone() {
        this.$store.route = "chat";
        this.$flows.chats.getChats();
        this.$flows.users.getUsers();
        this.$flows.settings.getSettings();
      },
      async loginIfHasToken() {
        const loginToken = this.$flows.localstorage.getSessionToken();

        if (loginToken) {
          const user = this.$flows.localstorage.getSessionUser();
          if (user) this.$store.currentUser = user;

          const successful = await this.$flows.connection.login({ token: loginToken });
          if (!successful) {
            this.$store.currentUser = null;
          }
        }
      },
      updateCurrentChatName() {
        if (!this.$store.currentChatId) {
          this.$store.currentChatName = "";
          return;
        }
        const { currentChatId } = this.$store;
        const currentChat = this.$store.flows.chats.d.find(chat => chat.id === currentChatId);
        const name = currentChat?.name;
        if (name) {
          this.$store.currentChatName = name;
          document.title = `${this.$store.unreadMessagesTotal}${this.$store.currentChatName} · RFlows`;
          window.history.replaceState({ chatId: currentChatId }, "", `/${currentChatId}/${name.replace(/\s+/g, "-").toLowerCase()}`);
        } else {
          this.$store.currentChatName = "";
          document.title = `${this.$store.unreadMessagesTotal}RFlows`;
        }
      },
    },
    render() {
      return "";
    },
  };

</script>

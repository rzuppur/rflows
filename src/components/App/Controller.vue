<script>

  export default {
    name: "Controller",
    data() {
      return {};
    },
    watch: {
      "$store.route": {
        immediate: true,
        handler(val) {
          setTimeout(() => this.$root.updateFullHeight(), 0);
          if (val === "login") document.title = "RFlows";
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
          if (oldVal !== null && val) {
            const chatIds = this.$flows.chats.recentChatIds.filter(chatId => chatId !== val);
            chatIds.unshift(val);
            this.$flows.chats.recentChatIds = chatIds;
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
    },
    mounted() {
      this.loginIfHasToken();
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
        const currentChat = this.$store.flows.chats.d.find(chat => chat.id === this.$store.currentChatId);
        this.$store.currentChatName = currentChat?.name || "";
      },
    },
    render() {
      return "";
    },
  };

</script>

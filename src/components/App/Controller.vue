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
          this.$root.updateFullHeight();

          if (val === "login") document.title = "RFlows";
        },
      },
    },
    created() {
      this.eventBus.$on("logout", this.logout);
      this.eventBus.$on("loginDone", this.loginDone);
    },
    mounted() {
      this.loginIfHasToken();
    },
    methods: {
      logout() {
        this.$store.route = "login";
      },
      loginDone() {
        this.$store.route = "chat";
      },
      async loginIfHasToken() {
        const loginToken = this.flows.getLoginToken();

        if (loginToken) {
          this.$store.route = "chat";

          const successful = await this.flows.loginAndConnect({ token: loginToken });
          if (!successful) this.$store.route = "login";
        }
      },
    },
    render() {
      return "";
    },
  };

</script>

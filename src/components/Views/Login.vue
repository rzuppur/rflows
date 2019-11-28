<template lang="pug">

  .login-container.alwaysFullHeight

    .login-content

      template(v-if="$store.currentUser")

        user-display(:user="currentUserDisplay" :withName="true")

        .buttons.margin-top-large
          r-button(fullwidth primary :action="openChat") Continue
          r-button(fullwidth :action="$flows.connection.logout") Log out

      form(v-else @submit.prevent="login")

        .field(style="margin-bottom: 20px;")
          h1.title-3 RFlows
          p.text-color-quiet Use your #[a(href="https://world.contriber.com/" target="_blank" rel="noopener noreferrer nofollow") Contriber Flows] credentials.

        .r-form-group
          r-text-input(label="Email" v-model.trim="loginData.email" type="email" autofocus required autocomplete="email" :disabled="loginLoading")

        .r-form-group
          r-text-input(label="Password" @keyup.enter="login" v-model="loginData.password" type="password" required autocomplete="password" :disabled="loginLoading")

        .field
          .control
            r-button(submit fullwidth primary :loading="loginLoading") Sign in

      .text-color-error(v-if="$store.connection.error") {{ $store.connection.errorMsg }}

</template>

<script>
  import UserDisplay from "@/components/UserDisplay.vue";

  export default {
    name: "Login",
    components: { UserDisplay },
    data() {
      return {
        loginData: {},
      };
    },
    computed: {
      loginLoading() {
        return this.$store.loginLoading;
      },
      currentUserDisplay() {
        if (!this.$store.currentUser) return {};
        return {
          avatar: this.$flows.utils.getAvatarFromUser(this.$store.currentUser),
          name: this.$flows.utils.getFullNameFromUser(this.$store.currentUser),
          email: this.$store.currentUser?.email,
        };
      },
    },
    methods: {
      async login() {
        if (this.loginData.email && this.loginData.password) {
          this.$store.loginLoading = true;

          try {
            const successful = await this.$flows.connection.login(this.loginData);
            if (!successful) {
              this.$store.route = "login";
            }
          } catch (error) {
            this._debug("! Error", error);
          } finally {
            this.$store.loginLoading = false;
          }
        }
      },
      openChat() {
        this.$store.route = "chat";
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .login-container
    background  $color-light-blue-background
    min-height 100%
    padding 30px 0
    overflow-y auto

    .login-content
      padding 30px
      background #fff
      border-radius 4px
      max-width 400px
      margin 0 auto
      box-shadow 0 0 0 2px rgba(0, 0, 0, 0.05)

    .text-color-error
      margin 15px 0 -10px

</style>

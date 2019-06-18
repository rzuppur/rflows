<template lang="pug">

  .login-container.alwaysFullHeight

    .login-content

      template(v-if="$store.currentUser")

        h4 Logged in as
        .user.user-with-name.space-top-small
          img.avatar.avatar-small(:src="$flows.utils.getAvatarFromUser($store.currentUser)")
          .text
            .name.ellipsis {{ $flows.utils.getFullNameFromUser($store.currentUser) }}
            .details.ellipsis {{ $store.currentUser.email }}

        .buttons.space-top-medium
          btn.button.is-fullwidth.is-info(:action="openChat") Continue
          btn.button.is-fullwidth(:action="$flows.connection.logout") Log out

      form(v-else @submit.prevent="login")

        .field(style="margin-bottom: 20px;")
          h2 RFlows
          .subtitle.is-6.has-text-grey Use your #[a(href="https://world.contriber.com/" target="_blank" rel="noopener noreferrer nofollow") Contriber Flows] credentials

        .field
          label.label Email
          .control
            input.input#email(v-model.trim="loginData.email" type="email" autofocus name="email" required autocomplete="email" :disabled="loginLoading")

        .field(style="margin-bottom: 30px;")
          label.label Password
          .control
            input.input#password(@keyup.enter="login" v-model="loginData.password" type="password" name="password" required autocomplete="password" :disabled="loginLoading")

        .field
          .control
            btn.button.is-info.is-fullwidth(submit :loading="loginLoading") Sign in

      .text-error(v-if="$store.connection.error") {{ $store.connection.errorMsg }}

</template>

<script>
  export default {
    name: "Login",
    data() {
      return {
        loginData: {},
      };
    },
    computed: {
      loginLoading() {
        return this.$store.loginLoading;
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

    .text-error
      margin 15px 0 -10px

</style>

<template lang="pug">

  .login-container.alwaysFullHeight

    .login-content

      template(v-if="$store.currentUser")

        h4 Logged in as
        .user.user-with-name.space-top-small
          img.avatar.avatar-small(:src="flows.getAvatarFromUser($store.currentUser)")
          .text
            .name.ellipsis {{ flows.getFullNameFromUser($store.currentUser) }}
            .details.ellipsis {{ $store.currentUser.email }}

        .buttons.space-top-medium
          button.button.is-fullwidth.is-info(type="button" @click="$store.route = 'chat'") Continue
          button.button.is-fullwidth(type="button" @click="flows.logout") Log out

      form(v-else @submit.prevent="login")

        .field(style="margin-bottom: 20px;")
          h2 RFlows
          .subtitle.is-6.has-text-grey Use your #[a(href="https://world.contriber.com/" target="_blank" rel="noopener noreferrer nofollow") Contriber Flows] credentials

        .field
          label.label Email
          .control
            input.input#email(v-model.trim="loginData.email" type="email" autofocus name="email" required autocomplete="email")

        .field(style="margin-bottom: 30px;")
          label.label Password
          .control
            input.input#password(@keyup.enter="login" v-model="loginData.password" type="password" name="password" required autocomplete="password")

        .field
          .control
            button.button.is-info.is-fullwidth(type="submit" :class="{ 'is-loading': $store.loginLoading }") Sign in

      .text-error(v-if="$store.connectionError") {{ $store.errorMsg }}

</template>

<script>
  export default {
    name: "Login",
    data() {
      return {
        loginData: {},
        loggingIn: false,
      };
    },
    created() {
      this.eventBus.$on("socketLoginDone", () => {
        if (this.loggingIn) this.$store.route = "chat";
      });
    },
    methods: {
      async login() {
        if (this.loginData.email && this.loginData.password) {
          this.loggingIn = true;

          const successful = await this.flows.loginAndConnect(this.loginData);
          if (!successful) this.$store.route = "login";

          this.loggingIn = false;
        }
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

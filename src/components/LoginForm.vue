<template lang="pug">
  .login-container.alwaysFullHeight
    form.login-content(@submit.prevent="login")
      .field(style="margin-bottom: 20px;")
        .title.is-1 RFlows
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
          button.button.is-info.is-fullwidth(type="submit" :class="{ 'is-loading': loginLoading }") Sign in
      .text-error(v-if="connectionError") {{ errorMsg }}
</template>

<script>
  export default {
    name: "LoginForm",
    store: ["loginLoading", "connectionError", "errorMsg"],
    data: function () {
      return {
        loginData: {}
      }
    },
    mounted() {
      this.$root.updateFullHeight();
      document.title = "RFlows | Sign in";
    },
    methods: {
      login() {
        if (this.loginData.email && this.loginData.password) {
          this.flows.setLogin(this.loginData);

          this.loginLoading = true;
          this.flows.connect()
          .then((successful) => {
            this.loginLoading = false;
            if (successful) {
              this.connectionError = false;
              this.errorMsg = "";
            } else {
              this.connectionError = true;
            }
          });
        }
      }
    },
  }
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

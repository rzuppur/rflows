<template lang="pug">

  modal(v-if="message" :title="message.subject" :sizeMedium="true" ref="emailModal")

    .email-frame-container

        iframe.email-frame(:srcdoc="utils.getEmailText(message.text)")

    template(v-slot:buttons)
      span

</template>

<script>
  import Modal from "@/components/UI/Modal.vue";

  export default {
    name: "EmailDisplay",
    components: { Modal },
    data() {
      return {
        message: null,
      };
    },
    mounted() {
      this.eventBus.$on("openEmail", (messageId) => {
        const message = this.flows.getChatMessage(messageId);
        if (message) {
          this.message = message;
          this._debug(`Opening email, message id ${message.id}`);
          this.$nextTick(() => {
            this.$refs.emailModal?.open();
          });
        }
      });
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .email-frame
    width 100%
    display block
    box-shadow inset 0 1px 3px 0 rgba(0, 0, 0, 0.1)
    background #fff
    min-height 350px
    height calc(100vh - 230px)

  .email-frame-container
    border 1px solid #eee
    border-radius 4px
    width 100%
    margin-bottom 10px
</style>

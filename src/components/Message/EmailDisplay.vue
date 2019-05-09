<template lang="pug">

  .email-display

    modal(v-if="message" :title="message.subject" :sizeMedium="true" ref="emailModal" @close="message = null")

      .email-frame-container

        iframe.email-frame(:srcdoc="utils.getEmailText(message.text)" onload="this.style.height=(this.contentDocument.body.scrollHeight+45) +'px';")

      file-display(v-for="file in attachments" :message="file")

      template(v-slot:buttons)
        span


</template>

<script>
  import Modal from "@/components/UI/Modal.vue";
  import FileDisplay from "@/components/Message/FileDisplay.vue";

  export default {
    name: "EmailDisplay",
    components: { FileDisplay, Modal },
    data() {
      return {
        message: null,
      };
    },
    computed: {
      attachments() {
        return this.flows.messageChilds(this.message.id);
      },
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
    background #fff
    min-height 350px

  .email-frame-container
    border 1px solid #eee
    border-radius 4px
    width 100%
    margin-bottom 10px

</style>

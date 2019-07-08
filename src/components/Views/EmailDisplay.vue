<template lang="pug">

  .email-display

    modal(v-if="message" :title="message.subject" :sizeMedium="true" ref="emailModal" @close="message = null")

      .email-frame-container

        iframe.email-frame(:srcdoc="utils.getEmailText(message.text)" onload="this.style.height=(this.contentDocument.body.scrollHeight+45) +'px';")

      file-display(v-for="file in attachments" :url="file.url" :text="file.text")

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
        if (!this.message) return [];
        const childs = this.$store.flows.messages[this.message.chatId].d.filter(message => message.parentTopicItemId === this.message.id);
        if (childs.length) {
          childs.sort((a, b) => a.id - b.id);
          console.log(childs);
          return childs;
        }
        return [];
      },
    },
    mounted() {
      this.$events.$on("openEmail", (message) => {
        if (message) {
          this.message = message;
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

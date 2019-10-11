<template lang="pug">

  .email-display

    modal(v-if="message" :title="message.subject" :sizeMedium="true" ref="emailModal" @close="message = null")

      .details
        p
          | #[b From:] {{ message.from.name }} <{{ message.from.address }}>
          br
          | #[b To:] {{ message.to.map(to => to.name ? `${to.name} <${to.address}>` : to.address).join(", ") }}
        p.text-muted.text-small.space-top-small {{ utils.fullDateTime(message.createDate) }}

      .buttons
        r-button(borderless gray v-if="hasImages && imagesHidden" icon="images" :action="showImages") Show images

      .email-frame-container.space-top-medium

        iframe.email-frame(:srcdoc="messageSrcDoc" onload="this.style.height=(this.contentDocument.body.scrollHeight+45) +'px';")

      file-display(v-for="file in attachments" :url="$flows.utils.relativeToFullPath(file.url)" :text="file.text" :key="file.id")

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
        imagesHidden: true,
      };
    },
    computed: {
      attachments() {
        if (!this.message) return [];
        const childs = this.$store.flows.messages[this.message.chatId].d.filter(message => message.parentTopicItemId === this.message.id);
        if (childs.length) {
          childs.sort((a, b) => a.id - b.id);
          return childs;
        }
        return [];
      },
      messageSrcDoc() {
        this.message;

        return this.utils.getEmailText(this.message.text, !this.imagesHidden);
      },
      hasImages() {
        this.message;

        return this.message.text.includes("<img ");
      },
    },
    mounted() {
      this.$events.$on("openEmail", (message) => {
        this.imagesHidden = true;
        if (message) {
          this.message = message;
          this.$nextTick(() => {
            this.$refs.emailModal?.open();
          });
        }
      });
    },
    methods: {
      showImages() {
        this.imagesHidden = false;
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .details
    margin-bottom $font-size-normal

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

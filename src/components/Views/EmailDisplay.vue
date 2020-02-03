<template lang="pug">

  .email-display

    r-modal(v-if="message" :title="message.subject || 'No subject'" size="large" ref="emailModal" @close="message = null" :buttons="false")

      .details.r-margin-bottom-medium
        p
          template(v-if="message.from") #[b From:] {{ message.from.name }} <{{ message.from.address }}>
            br
          template(v-if="message.to") #[b To:] {{ message.to.map(to => to.name ? `${to.name} <${to.address}>` : to.address).join(", ") }}
        p.r-text-color-quiet.r-text-small.r-margin-top-small {{ utils.fullDateTime(message.createDate) }}

      .r-buttons.r-margin-top-medium.r-margin-bottom-small(v-if="hasImages && imagesHidden")
        r-button(borderless gray  icon="images" :action="showImages") Show images

      file-display(v-for="file in attachments" :url="$flows.utils.relativeToFullPath(file.url)" :text="file.text" :key="file.id")

      .email-frame-container

        iframe.email-frame(:srcdoc="messageSrcDoc" onload="this.style.height=(this.contentDocument.body.scrollHeight+45) +'px';")

</template>

<script>
  import FileDisplay from "@/components/Message/FileDisplay.vue";

  export default {
    name: "EmailDisplay",
    components: { FileDisplay },
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

  .email-frame
    width 100%
    display block
    padding 0 24px
    background $color-light-gray-background

  .email-frame-container
    margin 24px -24px -24px

</style>

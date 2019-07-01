<template lang="pug">

  modal(v-if="promiseResolve" :title="question" ref="confirmModal" :blocking="true")

    p(v-if="desc") {{ desc }}

    template(v-slot:buttons)

      button.button(type="button" @click="no")
        span {{ noText }}
      button.button.is-info(type="button" @click="yes")
        span {{ yesText }}

</template>

<script>

  import Modal from "@/components/UI/Modal.vue";

  export default {
    name: "ConfirmModal",
    components: { Modal },
    data() {
      return {
        question: "",
        desc: false,
        yesText: "Yes",
        noText: "No",
        promiseResolve: null,
        promiseReject: null,
      };
    },
    beforeDestroy() {
      if (this.promiseReject) this.promiseReject(new Error("Component destroyed"));
    },
    mounted() {
      this.$root.confirm = this.confirm;
    },
    methods: {
      async confirm(question, yesText, noText, desc) {
        if (this.promiseResolve || this.promiseReject) {
          this._debug("! Already confirming");
          return Promise.reject();
        }
        this.question = question;
        if (desc) this.desc = desc;
        if (yesText) this.yesText = yesText;
        if (noText) this.noText = noText;

        setTimeout(() => {
          if (!this.$refs.confirmModal) {
            this._debug("! No confirmModal");
            this.promiseReject();
          } else {
            this.$refs.confirmModal.open();
          }
        }, 0);

        return new Promise((resolve, reject) => {
          this.promiseResolve = resolve;
          this.promiseReject = reject;
        });
      },
      no() {
        if (this.promiseResolve) {
          this.promiseResolve(false);
        } else {
          this._debug("! No promiseResolve");
        }
        this._cleanup();
      },
      yes() {
        if (this.promiseResolve) {
          this.promiseResolve(true);
        } else {
          this._debug("! No promiseResolve");
        }
        this._cleanup();
      },
      _cleanup() {
        this.$refs.confirmModal?.close();
        this.question = "";
        this.desc = false;
        this.yesText = "Yes";
        this.noText = "No";
        this.promiseResolve = null;
        this.promiseReject = null;
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  p
    margin-bottom 30px

</style>

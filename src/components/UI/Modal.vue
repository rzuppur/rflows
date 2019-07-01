<template lang="pug">

  .modal-portal
    portal(to="modals")
      transition(name="modal")
        .modal-overlay(v-if="modalOpen" :class="imageModal ? 'image-modal' : ''" @click="outsideClose" @keyup.esc.stop="outsideClose")
          .modal-container(:class="modalContainerClass")

            trap(:returnFocus="true")

              .buttons.align-right(v-if="imageModal && title === false" style="position: absolute; top: 10px; right: 10px;")
                button.button.borderless.button-icon.modal-close(type="button" @click="close" aria-label="Close dialog" style="opacity: .5; background: rgba(0, 0, 0, 0.1);")
                  span.icon.material.white <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>

              .modal(
                ref="modal"
                role="dialog"
                @click.stop
                :aria-labelledby="`dialog-title-${_id}`"
                @keydown.native.capture.esc="outsideClose"
              )

                .modal-header(v-if="title !== false")

                  h3.title(:id="`dialog-title-${_id}`") {{ title }}

                  button.button.borderless.button-icon.modal-close(v-if="!blocking" type="button" @click="close" aria-label="Close dialog")
                    span.icon.material.gray <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>

                slot

                .buttons.space-top.align-right(v-if="!imageModal")
                  slot(name="buttons" :close="close")
                    button.button(type="button" @click="close" tabindex="1")
                      span Close

</template>

<script>
  import Trap from "vue-focus-lock";

  export default {
    name: "Modal",
    components: { Trap },
    props: {
      title: {
        default: "Modal title",
        type: [String, Boolean],
      },
      blocking: {
        default: false,
        type: Boolean,
      },
      imageModal: {
        default: false,
        type: Boolean,
      },
      sizeMedium: {
        default: false,
        type: Boolean,
      },
    },
    data() {
      return {
        modalOpen: false,
      };
    },
    beforeCreate() {
      this._id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    beforeDestroy() {
      if (this.modalOpen) this.close();
    },
    computed: {
      modalContainerClass() {
        if (this.imageModal) return "container-image";
        return `container-${this.sizeMedium ? "medium" : "small"}`;
      },
    },
    methods: {
      open() {
        this.$store.modalsOpen.push(this._id);
        this.modalOpen = true;
      },
      close() {
        this.$store.modalsOpen.splice(this.$store.modalsOpen.indexOf(this._id), 1);
        this.modalOpen = false;
        this.$emit("close");
      },
      outsideClose() {
        if (!this.blocking) this.close();
      },
    },
  };

  /*
    template(v-slot:buttons="buttons")
    button.button.borderless(@click="buttons.close") Close
    button.button(@click="$refs.modalTest2 && $refs.modalTest2.open()") Open
   */
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .modal-enter-active
    transition all 120ms ease-out

    .modal
      transition all 120ms ease-out

  .modal-leave-active
    transition all 60ms ease-out

    .modal
      transition all 120ms ease-out

  .modal-enter,
  .modal-leave-to
    opacity 0

  .modal-enter .modal
    transform scale(.9)

  .modal-leave-to .modal
    transform scale(1.1)

  .modal-overlay
    overflow-y auto
    overflow-x hidden
    -webkit-overflow-scrolling touch
    background alpha(#fff, 0.93)
    background alpha(#000, 0.6)
    -webkit-backdrop-filter blur(4px)
    //backdrop-filter blur(4px)
    position fixed
    z-index 10000
    text-align center
    left 0
    top 0
    right 0
    bottom 0
    height 100%

    @supports (display: grid)
      @media (min-width 501px)
        &:not(.image-modal)
          grid-template-columns 100%
          grid-template-rows 1fr max-content 2fr
          display grid

          .modal-container
            grid-column 1
            grid-row 2
            width 100%

  .modal-container
    text-align left

  .container-image
    padding 20px
    display inline-block

  .modal
    padding 20px
    background #fff
    border-radius $border-radius
    box-shadow 0 0 0 3px alpha(#000, .1), 0 15px 10px -5px alpha(#000, .07)
    z-index 10001
    word-wrap break-word
    overflow hidden

    .container-image &
      padding 0
      box-shadow none


  @media (max-width 500px)

    .modal-enter,
    .modal-leave-to
      .modal
        transform translateY(100px)
        opacity 0

    .modal-overlay
      background alpha(#000, 0.6)

    .modal-container
      padding 0

    .modal-container
      justify-content flex-end
      height 100%
      display flex
      flex-direction column

      &.container-image
        display inline-flex
        justify-content center

    .modal
      border-radius 0
      padding-bottom 40px
      max-height calc(100vh - 80px)
      overflow-y auto

      .container-image &
        max-height calc(100vh - 40px)

  .modal-header
    display flex
    align-items center
    margin-bottom 10px

    .title
      flex 1 1 auto

    .modal-close
      flex 0 0 auto
      align-self flex-start

</style>

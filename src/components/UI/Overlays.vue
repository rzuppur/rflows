<template lang="pug">

  .overlays

    portal-target(name="modals" multiple)

    .drop-overlay(:class="{ dropping: dropping }")
      .drop-overlay-text #[span.icon #[i.fas.fa-upload]]

</template>

<script>
  export default {
    name: "Overlays",
    data: function () {
      return {
        dropping: false,
      };
    },
    created() {
      this.eventBus.$on("dropOverlay", this.dropOverlay);
    },
    computed: {
      text() {
        if (this.queue.length) return this.queue[0];
      },
    },
    methods: {
      dropOverlay(visible) {
        this.dropping = visible;
      },
    },
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .drop-overlay
    position fixed
    left 0
    right 0
    top 0
    bottom 0
    background alpha(#fff, .96)
    display flex
    align-items center
    flex-direction row
    justify-content space-around
    user-select none
    pointer-events none
    transition all 0.15s
    z-index -1000
    opacity 0

    &.dropping
      z-index 1000
      opacity 1

    .drop-overlay-text
      text-regular-30()
      color $color-text

      &:before
        content ""
        position absolute
        top 30px
        bottom @top
        left @top
        right @top
        border 2px dashed alpha(#000, .2)
        border-radius $border-radius

</style>

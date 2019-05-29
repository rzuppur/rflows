<template lang="pug">

  .menu-container

    slot(name="trigger" :menuOpenClickStop="menuButton")
      button.button.menu-open.borderless(@click.stop="menuButton")
        span.icon.is-small.has-text-grey
          i.fas.fa-caret-down

    .popup-menu-container(ref="container")
      portal(to="popupMenu")
        slide-in-out(:inDuration="60" :outDuration="0")
          .popup-menu(v-if="menuOpen" :style="{ 'min-width': minWidth, top, left }")
            template(v-for="action in actions")

              .popup-menu-item.item-title(
                v-if="action.title"
                @click.stop) {{ action.text }}

              .popup-menu-item.item-details(
                v-else-if="action.details"
                @click.stop) {{ action.text }}

              button.popup-menu-item.item-clickable(
                v-else-if="action.func"
                type="button"
                @click="menuItemSelect(action.func)"
              )
                img.image(v-if="action.image" :src="action.image")
                span.text {{ action.text }}

              hr(v-else-if="action.hr")

</template>

<script>
  import SlideInOut from "@/components/UI/SlideInOut.vue";

  export default {
    name: "PopupMenu",
    components: { SlideInOut },
    props: {
      menuId: String,
      actions: Array,
    },
    data() {
      return {
        top: "10px",
        left: "10px",
        minWidth: null,
      };
    },
    computed: {
      menuOpen() {
        return this.$store.openMenu === this.menuId;
      },
    },
    watch: {
      menuOpen: {
        initial: true,
        handler(val, oldVal) {
          if (val === oldVal) return;
          if (val) {
            const rect = this.$refs.container?.getBoundingClientRect();
            if (!rect) {
              this.top = "10px";
              this.left = "10px";
              this.minWidth = null;
              return;
            }
            const minWidth = Math.max(220, rect.width);
            this.top = `${rect.y}px`;
            this.left = `${Math.min(window.innerWidth - minWidth - 10, rect.x)}px`;
            this.minWidth = `${minWidth}px`;
          }
        },
      },
    },
    methods: {
      menuItemSelect(func) {
        this.$store.openMenu = null;
        func();
      },
      menuButton() {
        this.$store.openMenu = this.menuOpen ? null : this.menuId;
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .popup-menu-container
    position relative

  .popup-menu
    position absolute
    display flex
    flex-direction column
    min-width 220px
    padding 5px 0
    background #fff
    border 1px solid $color-gray-border
    border-radius $border-radius
    box-shadow 0 4px 5px -1px alpha(#000, 0.1)
    z-index 10001

    .popup-menu-item
      display block
      color $color-text
      user-select none
      white-space nowrap
      text-align left
      margin 0 -1px
      padding 7px 20px 7px 10px
      font inherit
      background none
      border none
      box-shadow none
      border-radius 0
      -webkit-appearance none
      apperance none
      outline none

      &.active
        background $color-light-blue-background

      &.item-clickable
        cursor pointer

        &:hover,
        &:focus
          background $color-focus-blue
          color #fff

        .image
          width 24px
          height @width
          display inline-block
          margin-top -1px
          margin-right 10px
          vertical-align middle
          border-radius 2px

        .text
          position relative
          top 1px

        & /deep/ .icon
          display inline-block
          vertical-align middle
          margin-left -3px
          margin-right 7px
          margin-top -1px
          margin-bottom -1px

        &:hover /deep/ .icon svg
          fill #fff !important

      &.item-title
        text-title-20()
        font-weight $font-weight-sans-bold
        padding-bottom 0

      &.item-details
        text-regular-13()
        color $color-gray-text
        padding-top 0

    hr
      margin 5px 0

</style>

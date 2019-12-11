<template lang="pug">

  .menu-container

    slot(name="trigger" :menuOpenClickStop="menuButton")
      r-button.menu-open(borderless :action="menuButton" icon="more")

    .popup-menu-container(ref="container")
      portal(to="popupMenu")
        slide-in-out(:inDuration="70" :outDuration="0")
          .popup-menu.r-elevation-4(v-if="menuOpen" :style="{ 'min-width': minWidth, top, left, '--top': top, }")
            template(v-for="action in actions")

              .popup-menu-item.item-title(
                v-if="action.title"
                @click.stop) {{ action.text }}

              .popup-menu-item.item-details(
                v-else-if="action.details"
                @click.stop) {{ action.text }}

              user-display(v-else-if="action.user" :user="action.user" :withName="true")

              button.popup-menu-item.item-clickable.r-elevation-3(
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
  import UserDisplay from "@/components/UserDisplay.vue";

  export default {
    name: "PopupMenu",
    components: { UserDisplay, SlideInOut },
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
    mounted() {
      this.$events.$on("windowResize", this.positionMenu);
    },
    watch: {
      menuOpen: {
        initial: true,
        handler(val, oldVal) {
          if (val === oldVal) return;
          if (val) this.positionMenu();
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
      positionMenu() {
        const rect = this.$refs.container?.getBoundingClientRect();
        if (!rect) {
          this.top = "10px";
          this.left = "10px";
          this.minWidth = null;
          return;
        }
        const minWidth = Math.max(220, rect.width);
        this.top = `${rect.top}px`;
        this.left = `${Math.min(window.innerWidth - minWidth - 10, rect.left)}px`;
        this.minWidth = `${minWidth}px`;
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
    max-height calc(100vh - var(--top) - 10px)
    overflow-x hidden
    overflow-y auto
    padding 5px 0
    border-radius $border-radius
    z-index 10001

    .popup-menu-item
      display block
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
        font-sans($font-size-medium-1, $font-weight-sans-bold)
        font-weight $font-weight-sans-bold
        padding-bottom 0

      &.item-details
        font-sans($font-size-small)
        color $color-gray-text
        padding-top 0

    & /deep/ .user
      min-height 50px
      padding 5px 0

      .avatar
        margin 0 0 0 10px

      .avatar-container
        margin-right 10px

      .name
        font-sans($font-size-normal, $font-weight-sans-bold)

    hr
      margin 5px 0

</style>

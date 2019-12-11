<template lang="pug">

  .chat-container.alwaysFullHeight(:class="{ showSidebar }")

    .sidebar
      chat-sidebar

    .mainbar
      chat-mainbar


</template>

<script>
  import ChatMainbar from "@/components/Chat/Mainbar/ChatMainbar.vue";
  import ChatSidebar from "@/components/Chat/Sidebar/ChatSidebar.vue";

  export default {
    name: "Chat",
    components: { ChatMainbar, ChatSidebar },
    data() {
      return {
        showSidebar: false,
      };
    },
    mounted() {
      this.$events.$on("currentChatChange", () => { this.showSidebar = false; });
      this.$events.$on("hideSidebar", () => { this.showSidebar = false; });
      this.$events.$on("showSidebar", () => { this.showSidebar = true; });
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"


  .chat-container
    display flex
    overflow hidden

    @media (max-width $media-mobile-width)
      &.showSidebar
        .sidebar
          display block

        .mainbar
          display none

  .sidebar,
  .mainbar
    max-height 100%
    min-width 0

  .sidebar
    flex 1 1 auto

    @media (min-width $media-mobile-width + 1px)
      flex 0 0 $sidebar-width
      position relative
      overflow hidden

    @media (max-width $media-mobile-width)
      display none

  .mainbar
    flex 4

</style>

<template lang="pug">

  .chat-container.alwaysFullHeight

    .sidebar
      chat-sidebar

    .mainbar
      chat-mainbar


</template>

<script>
  import ChatMainbar from "@/components/Chat/ChatMainbar.vue";
  import ChatSidebar from "@/components/Chat/ChatSidebar.vue";

  export default {
    name: "Chat",
    components: { ChatMainbar, ChatSidebar },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"


  .chat-container
    display flex
    overflow hidden

  .sidebar,
  .mainbar
    max-height 100%
    min-width 0

  .sidebar
    background $color-sidebar-background
    flex 0 0 $sidebar-width
    position relative
    overflow hidden
    color #fff

    @media (max-width $media-sidebar-hide)
      flex 0 0 40px

  .mainbar
    flex 4

</style>

<template lang="pug">

  .messages-container.scrollbar-style(ref="messages" @scroll="scrollTrack")
    .messages

</template>

<script>

  export default {
    name: "ChatMainbarMessageList",
    methods: {
      scrollTrack() {
        console.log("todo: scrollTrack");
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .messages-container
    flex 1
    overflow-y scroll

    .typing
      color $color-gray-text
      margin 10px 20px 0 65px

  .messages
    padding 20px 0
    position relative

</style>

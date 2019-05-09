<template lang="pug">

  a.file-preview(:href="flows.getFilePath(message.url)" target="_blank" rel="noopener noreferrer nofollow")

    .file-title.ellipsis #[i.fas.fa-paperclip] {{ message.text }}

    .image-preview(v-if="utils.fileMessagePreviewable(message)")
      img(:src="flows.getFilePath(message.url)")

</template>

<script>

  export default {
    name: "FileDisplay",
    props: {
      message: Object,
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .file-preview
    display inline-block
    vertical-align top
    margin 3px 8px 8px 0
    background  $color-light-blue-background
    border-radius $border-radius
    overflow hidden
    max-width $message-item-max-width

    &:hover,
    &:focus
      background darken($color-light-blue-background, 1)

    &:focus
      outline none

      .file-title
        text-decoration underline

    .file-title
      padding 5px 10px

    .image-preview
      padding 0 10px 10px

      img
        display block
        max-height 280px
</style>

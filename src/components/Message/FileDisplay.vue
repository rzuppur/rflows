<template lang="pug" functional>

  a.file-preview(:href="props.url" target="_blank" rel="noopener noreferrer nofollow")

    .file-title.ellipsis #[r-icon.blue.icon-text(icon="file" style="vertical-align: text-top; transform: rotate(45deg);")] {{ props.text }}

    .image-preview(v-if="props.preview")
      img(:src="props.url")

</template>

<script>

  export default {
    name: "FileDisplay",
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
    max-width 100%

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
        max-height 200px
</style>

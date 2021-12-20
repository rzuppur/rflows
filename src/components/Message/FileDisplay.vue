<template lang="pug" functional>

  div

    a.file-preview(:href="props.url" target="_blank" rel="noopener noreferrer nofollow")

      .file-title.r-ellipsis #[r-icon.blue.icon-text(icon="file" style="vertical-align: text-top; transform: rotate(45deg);")] {{ props.text }}

    .preview(v-if="props.preview")
      video(v-if="props.url.endsWith('.mp4')" :src="props.url" controls playsinline)
      img(v-else :src="props.url" alt)

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
    margin 6px 8px 8px 0
    background  $color-light-blue-background
    border-radius $border-radius
    overflow hidden
    max-width 100%

    .darkMode &
      background $color-background-2-darkmode

    &:hover,
    &:focus
      background darken($color-light-blue-background, 1)

      .darkMode &
        background $color-background-3-darkmode

    &:focus
      outline none

      .file-title
        text-decoration underline

    .file-title
      padding 5px 10px

  .preview

    video
      width 100%
      max-height 400px
      max-width 700px

    img
      display block
      max-height 200px

</style>

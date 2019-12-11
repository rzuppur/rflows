<!-- Modified from https://github.com/rafaelpimpa/vue-checkbox-switch -->
<template lang="pug">

  label.switch
    input.switch-input(
      type="checkbox"
      :name="name"
      :checked="value"
      @change="$emit('input', $event.target.checked)"
      :disabled="disabled"
    )
    span.switch-toggle(:disabled="disabled")
      slot

</template>

<script>
  export default {
    name: "CheckboxSwitch",
    props: {
      value: Boolean,
      name: String,
      disabled: Boolean,
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .switch-input
    display none

    &:checked + .switch-toggle:after
      background-color $color-light-blue
      transform translate(80%, -50%)

  .switch-toggle
    position relative
    display inline-block
    cursor pointer
    text-align left
    margin 0
    padding 0 10px 0 50px
    user-select none

    &[disabled]
      opacity 0.5

    &:before,
    &:after
      content ""
      cursor pointer
      position absolute
      margin 0
      outline 0
      top 50%
      transform translate(0, -50%)
      transition all 150ms cubic-bezier(0.23, 1, 0.32, 1)

    &:before
      left 1px
      width 34px
      height 12px
      background-color darken($color-light-blue-background, 4)
      border-radius 8px

      .darkMode &
        background-color $color-background-4-darkmode

    &:after
      left 0
      width 20px
      height 20px
      background-color #eaecff
      border-radius 50%

      .darkMode &
        background-color lighten($color-background-4-darkmode, 20%)

</style>

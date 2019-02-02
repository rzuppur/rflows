<!-- Based on https://github.com/rafaelpimpa/vue-checkbox-switch -->
<template lang="pug">

  label.switch
    input(:class="classes" type="checkbox" :checked="checked" :name="name" :disabled="disabled" v-model="value")
    span(:disabled="disabled")
      slot

</template>

<script>
  export default {
    name: "CheckboxSwitch",
    props: {
      disabled: Boolean,
      classes: String,
      checked: Boolean,
      name: String
    },
    data() {
      return {
        value: null
      }
    },
    beforeMount() {
      this.value = this.checked
    },
    mounted() {
      this.$emit('input', this.value)
    },
    watch: {
      value(val) {
        this.$emit('input', val)
      },
      checked(val) {
        this.value = val
      }
    }
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  label.switch
    input[type="checkbox"]
      display none

      &:checked
        + span
          &:after
            background-color $color-light-blue
            transform translate(80%, -50%)

      + span
        position relative
        display inline-block
        cursor pointer
        font-weight 500
        text-align left
        margin 0
        padding 0 10px 0 50px

        &:before,
        &:after
          content ''
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

        &:after
          left 0
          width 20px
          height 20px
          background-color #eaecff
          border-radius 50%

        &[disabled]
          opacity 0.5

      &:checked + span &:after
        transform translate(80%, -50%)

</style>

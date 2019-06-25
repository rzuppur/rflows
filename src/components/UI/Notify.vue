<template lang="pug">

  .toast-list
    transition-group.toast-list-inner(name="toast-list" tag="div")
      .toast-notification(v-for="notification in queue" @click="remove(notification.index)" :key="notification.index") {{ notification.text }}

</template>

<script>
  /* eslint-disable no-plusplus */

  export default {
    name: "Notify",
    data() {
      return {
        queue: [],
      };
    },
    created() {
      this.$events.$on("notify", this.notify);
      this.index = 0;
    },
    methods: {
      notify(text) {
        if (this.DEBUG) {
          const time = this.utils.debugDateTime();
          // eslint-disable-next-line no-console
          console.log(`${time} %c ${text} %c`, "background-color: #000; color: #fff; border-radius: 3px; padding: 2px;", "background: transparent;");
        }
        const index = this.index++;
        text = text.toString();

        setTimeout(() => { this.remove(index); }, 900 + ( text.length * 70 ) + this.queue.length * 1000);

        this.queue.push({ text, index });

        if (this.queue.length > 5) {
          this.queue = this.queue.slice(-5);
        }
      },
      remove(index) {
        this.queue = this.queue.filter(notif => notif.index !== index);
      },
    },
  };
</script>

<style lang="stylus" scoped>

  @import "~@/shared.styl"

  .toast-list
    position fixed
    top 36px
    left 10px
    right 10px
    z-index 100000
    user-select none
    pointer-events none

  .toast-list-inner
    max-width 400px
    margin 0 auto
    position relative

  .toast-notification
    text-regular-16()
    text-align center
    background alpha(#000, 0.85)
    color #fff
    margin-bottom 8px
    padding 8px 16px
    border-radius $border-radius
    box-shadow 0 4px 8px -3px alpha(#000, 0.5)
    transition all 0.2s cubic-bezier(0.23, 1, 0.32, 1)
    pointer-events all

  .toast-list-enter,
  .toast-list-leave-to
    opacity 0
    transform translateY(-5px)

  .toast-list-leave-active
    position absolute
    left 0
    right 0

</style>

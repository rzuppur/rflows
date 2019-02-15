<template lang="pug">
  .toast-notification(:class="{ visible: visible }" @click="hideCurrent") {{ text && text.text }}
</template>

<script>
  export default {
    name: "Notification",
    data: function () {
      return {
        timeout: null,
        visible: false,
        queue: [],
        index: 0,
      };
    },
    created() {
      this.eventBus.$on("notify", this.notify);
    },
    computed: {
      text() {
        if (this.queue.length) return this.queue[0];
      },
    },
    methods: {
      notify(text) {
        if (this.DEBUG) {
          const time = this.utils.debugDateTime();
          console.log(`${time} %c ${text} %c`, "background-color: #000; color: #fff; border-radius: 3px; padding: 2px;", "background: transparent;");
        }
        this.queue.push({
          text: text.toString(),
          index: this.index++,  // when text is identical watcher doesn't run
        });
        if (this.queue.length > 5) {
          this._debug("Notification queue > 5, deleting oldest");
          this.queue = [this.queue[0]].concat(this.queue.slice(1).slice(-5));
        }
      },
      hideCurrent() {
        clearTimeout(this.timeout);
        this.visible = false;  // toast transition out starts
        setTimeout(() => {
          this.queue.shift();  // toast transition finished, remove text
        }, 200);
      },
    },
    watch: {
      text: function(val) {
        if (val && !this.visible) {
          this.visible = true;     // toast transitions in
          clearTimeout(this.timeout);
          this.timeout = setTimeout(() => {
            this.visible = false;  // toast transition out starts
            setTimeout(() => {
              this.queue.shift();  // toast transition finished, remove text
            }, 200);
          }, 700 + (val.text.length * 70));
        }
      }
    },
  }
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .toast-notification
    background alpha(#000, 0.85)
    text-regular-16()
    color #fff
    position fixed
    top 36px
    left 50%
    padding 8px 16px
    border-radius $border-radius
    box-shadow 0 4px 8px -3px alpha(#000, 0.5)
    z-index 100000
    user-select none
    opacity 0
    transition all 0.2s cubic-bezier(0.23, 1, 0.32, 1)
    transform translateX(-50%) translateY(-5px)

    &.visible
      opacity 1
      transform translateX(-50%) translateY(0)

</style>

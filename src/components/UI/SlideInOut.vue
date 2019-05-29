<template lang="pug">

  transition(
    name="slide"
    v-on:before-enter="beforeEnter"
    v-on:enter="enter"
    v-on:after-enter="afterEnter"
    v-on:before-leave="beforeLeave"
    v-on:leave="leave"
  )
    slot

</template>

<script>
  // eslint-disable-next-line import/extensions
  import "velocity-animate/velocity.ui.min.js";

  export default {
    name: "SlideInOut",
    props: {
      inDuration: Number,
      outDuration: Number,
    },
    methods: {
      beforeEnter(el) {
        el.style.maxHeight = "0px";
        el.style.overflow = "hidden";
        el.style.opacity = 0;
      },
      enter(el, done) {
        // eslint-disable-next-line no-undef
        Velocity(el, {
          maxHeight: el.scrollHeight,
          opacity: 1,
        }, {
          duration: this.inDuration,
          easing: "ease-out",
          complete: done,
        });
      },
      afterEnter(el) {
        el.style.overflow = null;
        el.style.maxHeight = null;
        el.style.opacity = null;
      },
      beforeLeave(el) {
        el.style.overflow = "hidden";
        el.style.maxHeight = `${el.scrollHeight}px`;
        el.style.opacity = 1;
      },
      leave(el, done) {
        // eslint-disable-next-line no-undef
        Velocity(el, {
          maxHeight: "0",
          opacity: 0,
        }, {
          duration: this.outDuration,
          easing: "ease-out",
          complete: done,
        });
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

</style>

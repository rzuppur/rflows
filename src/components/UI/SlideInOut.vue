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
  import { TweenMax, Power2 } from "gsap/TweenMax";

  export default {
    name: "SlideInOut",
    props: {
      duration: Number,
    },
    methods: {
      beforeEnter(el) {
        el.style.maxHeight = "0px";
        el.style.overflow = "hidden";
      },
      enter(el, done) {
        TweenMax.to(el, this.duration, {
          ease: Power2.easeOut,
          maxHeight: el.scrollHeight,
          onComplete: done,
        });
      },
      afterEnter(el) {
        el.style.overflow = "visible";
        el.style.maxHeight = "none";
      },
      beforeLeave(el) {
        el.style.overflow = "hidden";
        el.style.maxHeight = el.scrollHeight + "px";
      },
      leave(el, done) {
        TweenMax.to(el, this.duration, {
          maxHeight: "0",
          ease: Power2.easeOut,
          onComplete: done,
        });
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

</style>

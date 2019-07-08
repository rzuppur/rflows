<template lang="pug">

  transition(
    name="slide"
    v-on:before-enter="beforeEnter"
    v-on:enter="enter"
    v-on:after-enter="afterEnter"
    v-on:before-leave="beforeLeave"
    v-on:leave="leave"
    v-bind:css="false"
  )
    slot

</template>

<script>
  export default {
    name: "SlideInOut",
    props: {
      inDuration: {
        type: Number,
        default: 90,
      },
      outDuration: {
        type: Number,
        default: 90,
      },
    },
    methods: {
      beforeEnter(el) {
        el.style.maxHeight = "0px";
        el.style.overflow = "hidden";
        el.style.opacity = 0;
        el.style.transition = `max-height ${this.inDuration}ms cubic-bezier(0.215, 0.61, 0.355, 1), opacity ${this.inDuration}ms ease-out`;
      },
      enter(el, done) {
        el.style.maxHeight = `${el.scrollHeight}px`;
        el.style.opacity = 1;
        setTimeout(done, +this.inDuration);
      },
      afterEnter(el) {
        el.style.overflow = null;
        el.style.maxHeight = null;
        el.style.opacity = null;
        el.style.transition = null;
      },
      beforeLeave(el) {
        el.style.overflow = "hidden";
        el.style.maxHeight = `${el.scrollHeight}px`;
        el.style.opacity = 1;
        el.style.transition = `max-height ${this.outDuration}ms cubic-bezier(0.215, 0.61, 0.355, 1), opacity ${this.outDuration}ms ease-in`;
      },
      leave(el, done) {
        setTimeout(() => { el.style.maxHeight = "0px"; }, 0);
        el.style.opacity = 0;
        setTimeout(done, +this.outDuration);
      },
    },
  };
</script>

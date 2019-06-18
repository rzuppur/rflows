<template lang="pug">

  slide-in-out(:inDuration="90" :outDuration="90")
    .connection-status(v-if="connectionStatus")
      .flex1 No connection
        .text-small {{ connectionStatus }}
      .flex0
        btn.button.transparent-white(
          tip="Reconnect"
          tloc="right"
          :action="$flows.connection.reconnect"
          :loading="$store.connection.connecting"
        )
          span.icon
            i.fas.fa-sync

</template>

<script>
  import SlideInOut from "@/components/UI/SlideInOut.vue";

  export default {
    name: "ConnectionStatus",
    components: { SlideInOut },
    computed: {
      connectionStatus() {
        if (!this.$store.connection.error) return "";
        if (this.$store.connection.connecting) return "Reconnecting...";
        return this.$store.connection.errorMsg;
      },
    },
  };
</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .connection-status
    padding 7px 10px
    color #fff
    background $color-red-error
    display flex
    align-items center

    .flex1
      font-weight 600
      padding-right 10px

    .text-small
      opacity .8

</style>

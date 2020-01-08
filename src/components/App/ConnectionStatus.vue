<template lang="pug">

  slide-in-out(:inDuration="90" :outDuration="90")

    .connection-status(v-if="connectionStatus")

      .r-flex-1 No connection

        .r-text-small {{ connectionStatus }}

      .r-flex-0

        r-button(borderless label="'Reconnect'" :action="$flows.connection.reconnect" :loading="$store.connection.connecting" icon="sync" icon-color="white")

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
    z-index 100

    .r-flex-1
      font-weight $font-weight-sans-bold
      padding-right 10px

    .r-text-small
      opacity .8

</style>

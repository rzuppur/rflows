<template lang="pug">

  #app(v-cloak @click="documentClick")

    //- NO RENDER

    controller

    //- ROUTES

    .body-content(
      :tabindex="modalsOpen ? -1 : null"
      :inert="!!modalsOpen"
      :class="{ modalsOpen }"
      :aria-hidden="modalsOpen ? 'true' : false"
    )

      login(v-if="$store.route === 'login'")

      chat(v-else-if="$store.route === 'chat'")


    //- MODALS

    email-display

    saved-display

    settings

    overlays

</template>

<script>
  import Controller from "@/components/App/Controller.vue";
  import Chat from "@/components/Views/Chat.vue";
  import Login from "@/components/Views/Login.vue";
  import EmailDisplay from "@/components/Views/EmailDisplay.vue";
  import SavedDisplay from "@/components/Views/SavedDisplay.vue";
  import Settings from "@/components/Views/Settings.vue";
  import Overlays from "@/components/UI/Overlays.vue";

  export default {
    name: "App",
    components: {
      SavedDisplay,
      Controller,
      Chat,
      Login,
      EmailDisplay,
      Settings,
      Overlays,
    },
    computed: {
      modalsOpen() {
        return this.$store.modalsOpen.length;
      },
    },
    mounted() {
      this.$events.$on("notify", this.$rNotifyToast);
    },
    methods: {
      documentClick() {
        this.$store.openMenu = null;
      },
    },
  };
</script>

<template lang="pug">

  table
    tr
      td(v-for="value, key in $store.flows")
        h4 {{ key }} &nbsp;
        code v: {{ value.v }}
        div(style="height: 95vh; overflow: auto; max-width: 150px")
          template(v-if="key === 'users'")
            div(v-for="user in value.d")
              .user.user-with-name.space-top-small
                img.avatar.avatar-small(:src="$flows.utils.getAvatarFromUser(user)")
                .text
                  .name.ellipsis {{ $flows.utils.getFullNameFromUser(user) }}
                  .details.text-small id: {{ user.id }}
              .data email: {{ user.email }}
              .data workspaceId: {{ user.workspaceId }}
              .data status: {{ user.status }}
          div(v-else)
            .data {{ value.d }}


</template>

<script>

  export default {
    name: "ChatMainbar",
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .data
    white-space pre
    text-regular-13()
    font-size 12px
    line-height 1.15

</style>

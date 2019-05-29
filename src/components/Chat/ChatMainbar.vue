<template lang="pug">

  .chat

    template(v-if="!debug")
      .mainbar

        .chat-title

          btn.button.fav-toggle.is-white(v-if="!isDevChat" :tip="isStarred ? 'Remove from favorites' : 'Add to favorites'" :action="toggleFavourite")
            span.icon
              i.fa-star(:class="{ fas: isStarred, far: !isStarred }")

          .name.ellipsis {{ $store.currentChatName }}

          .users(v-if="chatMembers")
            user-display(v-for="member in chatMembers" :user="member")


    table(v-if="debug")
      tr
        td(v-for="value, key in $store.flows")
          b.text-small {{ key }}<br>
          code v: {{ value.v }}
          div(style="height: 90vh; overflow: auto; max-width: 150px")
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
    btn.button(style="position: fixed; right: 0; bottom: 0; z-index: 1000000;" :action="() => debug = !debug") debug


</template>

<script>

  import { DEVCHAT_ID } from "@/js/consts";
  import UserDisplay from "@/components/UserDisplay.vue";

  export default {
    name: "ChatMainbar",
    components: { UserDisplay },
    data() {
      return {
        debug: false,
      };
    },
    computed: {
      chatId() {
        return this.$store.currentChatId;
      },
      isDevChat() {
        return this.chatId === DEVCHAT_ID;
      },
      isStarred() {
        this.$store.flows.userProperties.v;

        return this.$flows.chats.favChatIds.includes(this.chatId);
      },
      chatMembers() {
        this.$store.flows.chatUsers.v;
        this.$store.flows.users.v;

        return this.$store.flows.chatUsers.d.filter(chatUser => chatUser.chatId === this.chatId).map((chatUser) => {
          const user = this.$store.flows.users.d.find(user_ => user_.id === chatUser.userId);
          if (!user) {
            return {
              ...chatUser,
              name: "",
              avatar: this.$flows.utils.getAvatarFromUser(),
              userStatus: "?",
            };
          }
          return {
            ...chatUser,
            name: this.$flows.utils.getFullNameFromUser(user),
            avatar: this.$flows.utils.getAvatarFromUser(user),
            userStatus: user.status,
          };
        });
      },
    },
    methods: {
      toggleFavourite() {
        if (this.isStarred) {
          this.$flows.chats.favChatIds = this.$flows.chats.favChatIds.filter(favId => favId !== this.chatId);
          return;
        }
        this.$flows.chats.favChatIds = this.$flows.chats.favChatIds.concat([this.chatId]);
      },
    },
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

  .data
    white-space pre
    text-regular-13()
    font-size 12px
    line-height 1.15

  .chat
    display flex
    height 100%

  .mainbar
    flex 3
    min-width 0
    height 100%
    display flex
    flex-direction column

  .chat-title
    position relative
    z-index 100
    background #fff
    box-shadow 0 1px 3px alpha(#000, 0.1)
    height 56px
    min-height 56px
    max-height 56px
    overflow hidden
    display flex
    align-items center
    padding 0 20px

    .fav-toggle
      margin-right 5px

      .far
        color $color-gray-text-light

      .fas
        color $color-gold

    .name
      text-title-20()
      margin-right 20px
      flex 1
      min-width 100px

    .users
      display flex

</style>

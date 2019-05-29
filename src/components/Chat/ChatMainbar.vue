<template lang="pug">

  .chat

    template(v-if="!debug")
      .mainbar

        .chat-title

          btn.button.fav-toggle.is-white(v-if="!isDevChat" :tip="isStarred ? 'Remove from favorites' : 'Add to favorites'" :action="toggleFavourite")
            span.icon
              i.fa-star(:class="{ fas: isStarred, far: !isStarred }")

          .name.ellipsis {{ $store.currentChatName }}

          .users(ref="users")
            template(v-for="member, i in chatMembers")
              popup-menu(v-if="i === chatMembers.length - membersHiddenCount" menu-id="members-overflow-menu" :actions="chatMembersOverflow")
                template(v-slot:trigger="open")
                  button.button-reset.all-users-button(@pointerdown.prevent @click.stop="open.menuOpenClickStop")
                    img.avatar.avatar-small(:src="$flows.utils.placeholderImageChar(`+${membersHiddenCount}`, 30, 40, 16, 'ffffff', '666666')")
              user-display(v-else :user="member" :class="{ invisible: i > chatMembers.length - membersHiddenCount }")


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
  import PopupMenu from "@/components/UI/PopupMenu.vue";

  export default {
    name: "ChatMainbar",
    components: { PopupMenu, UserDisplay },
    data() {
      return {
        debug: false,
        membersHiddenCount: 0,
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
      chatMembersOverflow() {
        const start = Math.max(0, this.chatMembers.length - this.membersHiddenCount);
        return this.chatMembers
          .slice(start, this.chatMembers.length)
          .map(member => ( { user: member } ));
      },
    },
    watch: {
      chatMembers: {
        handler() {
          if (this.$refs.users) {
            const overflow = this.$refs.users.scrollWidth - (this.$refs.users.clientWidth + 4);
            this.membersHiddenCount = (overflow > 0) ? Math.ceil((overflow + 35) / 40) : 0;
          }
        },
      },
    },
    mounted() {
      const usersObs = new ResizeObserver((entries) => {
        const users = entries[0].target;
        const overflow = users.scrollWidth - (users.clientWidth + 4);
        this.membersHiddenCount = (overflow > 0) ? Math.ceil((overflow + 35) / 40) : 0;
      });
      usersObs.observe(this.$refs.users);
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
      flex 1 1 300px
      min-width 100px

    .users
      display flex
      flex-direction row-reverse
      overflow hidden
      padding-top 3px
      margin-top -3px
      padding-right 5px
      margin-right -5px
      padding-bottom 3px
      margin-bottom -3px

      & /deep/ .menu-container
        height 0

      .user.invisible
        visibility hidden

      .all-users-button
        min-width 40px
        margin-left 10px

        .avatar
          margin 0 0 0 10px

</style>

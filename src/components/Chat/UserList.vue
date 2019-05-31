<template lang="pug">

  .users(ref="users")

    template(v-for="member, i in users")

      popup-menu(v-if="i === users.length - membersHiddenCount" menu-id="members-overflow-menu" :actions="chatMembersOverflow")
        template(v-slot:trigger="open")
          button.button-reset.all-users-button(@pointerdown.prevent @click.stop="open.menuOpenClickStop")
            img.avatar.avatar-small(:src="$flows.utils.placeholderImageChar(`+${membersHiddenCount}`, 30, 40, 16, 'ffffff00', '666666')")

      user-display(v-else :user="member" :class="{ invisible: i > users.length - membersHiddenCount }")

</template>

<script>
  import UserDisplay from "@/components/UserDisplay.vue";
  import PopupMenu from "@/components/UI/PopupMenu.vue";

  export default {
    name: "UserList",
    components: { PopupMenu, UserDisplay },
    props: {
      type: {
        type: String,
        default: "ROW",
      },
      users: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        membersHiddenCount: 0,
      };
    },
    computed: {
      chatMembersOverflow() {
        const start = Math.max(0, this.users.length - this.membersHiddenCount);
        return this.users
          .slice(start, this.users.length)
          .map(member => ( { user: member } ));
      },
    },
    watch: {
      users: {
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
  };

</script>

<style lang="stylus" scoped>
  @import "~@/shared.styl"

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

    @media (max-width $media-mobile-width)
     display none

    & /deep/ .menu-container
      height 0

    .user.invisible
      visibility hidden

    .all-users-button
      min-width 40px

      &:hover .avatar
        background $color-light-gray-background

      .avatar
        margin 0 0 0 10px

</style>

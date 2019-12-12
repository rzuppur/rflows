<template lang="pug">

  .chat-message(:style="message ? '' : 'pointer-events: none;'" :class="{ buttonsHoverOnly, isEmail, compact, noauthor: message && message.noauthor }")

    //- EMPTY MESSAGE

    template(v-if="!message || writingUser")

      .avatar-container
        .sticky-avatar
          img.avatar.avatar-small(v-if="writingUser && writingUser.avatar" :src="writingUser.avatar")
          .avatar.avatar-small.placeholder(v-else)

      .content-container
        .name-date.flex.text-color-quiet

          .name.ellipsis.flex0.text-color-body(v-if="writingUser && writingUser.name") {{ writingUser.name }}
          .name.placeholder.flex1(v-else)

        .writing-dots(v-if="writingUser")
          .dot1
          .dot2
          .dot3
        p.placeholder(v-else)

    //- REAL MESSAGE

    template(v-else)

      //- SIDE AVATAR

      .avatar-container

        .sticky-avatar(v-if="!message.noauthor || compact")

          img.avatar.avatar-small(:src="avatarUrl")

        template(v-if="message.noauthor && !compact")

          .date(v-if="dateDisplay" v-rtip="dateTooltip") {{ dateDisplay }}

          r-icon.blue.icon-text.saved-icon(v-if="message.flagged" icon="pin")

      //- MAIN

      .content-container

        //- NAME DATE

        b.text-color-error.text-small(v-if="message.error") {{ message.error }} #{""}

        .name-date.flex.text-color-quiet(v-if="!message.noauthor || compact")

          .is-reply.flex0(v-if="message.replyTo && !showReplyMessage")
            r-icon.icon-text.blue(icon="reply")
            | &nbsp;

          .email-from.flex0(v-if="message.type === 'EMAIL'") From:&nbsp;

          .name.ellipsis.flex0.text-color-body {{ authorName }}
            r-icon.blue.icon-text.saved-icon(v-if="!compact && message.flagged" icon="pin" v-rtip="'Message is in saved messages'")

          .date.flex0(v-if="dateDisplay" v-rtip="dateTooltip") {{ dateDisplay }}

          //-span.text-small.text-color-error(v-if="message.customData && Object.keys(message.customData).length") &nbsp; customData: {{ message.customData }}

        //- REPLY TO

        template(v-if="message.replyTo && showReplyMessage")
          message-preview.reply-original(:messageId="message.replyTo" :chatId="message.chatId" :key="`${message.replyTo}-preview`")

        //- MESSAGE CONTENT

        slot(name="content")

          //- EVENT

          p.event-content.text-color-quiet(v-if="message.type === 'EVENT'") {{ message.text }}

          //- CHAT

          template(v-else-if="message.type === 'CHAT'")
            .text-clamped(v-if="textClamp" v-html="$flows.messages.chatTextParse(message.text)")
            p.text-content(v-else v-html="$flows.messages.chatTextParse(message.text)")

          //- NOTE

          template(v-else-if="message.type === 'NOTE'")
            .text-clamped(v-if="textClamp") {{ $flows.messages.getMessageTextRepresentation(message.text) }}
            .note-content(v-else v-html="$flows.messages.noteTextParse(message.text)")

          //- FILE

          .file-content(v-else-if="message.type === 'FILE'")
            file-display(:text="message.text" :url="$flows.utils.relativeToFullPath(message.url)" :preview="$flows.messages.fileMessagePreviewable(message)")

          //- EMAIL

          template(v-else-if="isEmail")

            p.event-content.text-color-quiet(v-if="isEmail && message.subject === '[Netlify] We just published a new Production deploy for rflows' && message.from.address === 'team@netlify.com'") #[r-icon.icon-text.green(icon="check")] Successfully deployed to Netlify

            template(v-else-if="isEmail && message.subject.indexOf('[rzuppur/RFlows] ') === 0 && message.from.address === 'noreply@github.com'")

              p.event-content.text-color-quiet #[r-icon.icon-text.gray(icon="add")] New commits in branch {{ utils.commitEmailBranch(message.text) }}
              .commit(v-for="commit in utils.commitEmailParse(message.text)")
                a.commit-preview(:href="commit.url" target="_blank" rel="noopener noreferrer nofollow")
                  .commit-title #[b  {{ commit.name }}]

            template(v-else)

              .email-meta.text-small(v-if="!compact") To: {{ message.to.map(to => to.name ? `${to.name} <${to.address}>` : to.address).join(", ") }}

              .email-content-wrapper

                .text-bold.margin-bottom-tiny(v-if="compact") {{ message.subject }}

                .title-5.margin-bottom-tiny(v-else) {{ message.subject }}

                p.text-content.email-plain.r-elevation-2(v-if="!message.contentType || message.contentType.toLowerCase() !== 'text/html'" v-html="utils.textToHTML(message.text)")
                r-button.view-email-button.margin-bottom-tiny(v-else small borderless gray :action="() => { $events.$emit('openEmail', message) }" icon="mail") View email

          //- UNKNOWN

          p.text-content.text-color-error(v-else) Unknown message type: {{ message.type }}

      .buttons-container(@dblclick.native.stop)
        .r-buttons-grouped
          .r-button-group.r-elevation-4.r-border-radius
            slot(name="buttons")

</template>

<script>
  import FileDisplay from "@/components/Message/FileDisplay.vue";
  import MessagePreview from "@/components/Message/MessagePreview.vue";

  export default {
    name: "MessageDisplay",
    components: { FileDisplay, MessagePreview },
    props: {
      message: {
        type: Object,
      },
      compact: {
        type: Boolean,
        default: false,
      },
      textClamp: {
        type: Boolean,
        default: false,
      },
      showReplyMessage: {
        type: Boolean,
        default: true,
      },
      writingUser: {
        type: Object,
      },
      showFullDate: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      buttonsHoverOnly() {
        return this.compact || this.mqMobile;
      },
      isEmail() {
        if (!this.message) return false;
        return this.message.type === "EMAIL";
      },
      author() {
        this.$store.flows.users.v;

        return this.$store.flows.users.d.find(user => user.id === this.message.userId);
      },
      authorName() {
        if (this.message.type === "EMAIL") {
          return `${this.message.from.name} <${this.message.from.address}>`;
        }
        return this.$flows.utils.getFullNameFromUser(this.author);
      },
      authorNameShort() {
        if (this.message.type === "EMAIL") {
          return `${this.message.from.address}`;
        }
        return this.$flows.utils.getShortNameFromUser(this.author);
      },
      avatarUrl() {
        if (this.message.type === "EMAIL") return "data:image/svg+xml,%3Csvg width='30' height='40' viewBox='0 0 30 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='30' height='40' fill='%23b0b8c0'/%3E%3Cpath d='M23 16L15 21L7 16V14L15 19L23 14V16ZM23 12H7C5.89 12 5 12.89 5 14V26C5 26.5304 5.21071 27.0391 5.58579 27.4142C5.96086 27.7893 6.46957 28 7 28H23C23.5304 28 24.0391 27.7893 24.4142 27.4142C24.7893 27.0391 25 26.5304 25 26V14C25 12.89 24.1 12 23 12Z' fill='white'/%3E%3C/svg%3E";

        this.$store.flows.chatUsers.v;
        this.$store.flows.users.v;

        if (!this.message) return this.$flows.utils.placeholderImageChar("");

        return this.$flows.utils.getAvatarFromUser(this.author);
      },
      isEdited() {
        return this.message.modifiedDate !== this.message.createDate;
      },
      dateDisplay() {
        if (this.message.shadow) return false;
        if (this.showFullDate) return this.utils.fullDate(this.message.createDate) + (this.isEdited ? "*" : "");
        return this.utils.time(this.message.createDate) + (this.isEdited ? "*" : "");
      },
      dateTooltip() {
        if (this.showFullDate) return null;
        return this.isEdited ? `Edited ${this.utils.fullDateTime(this.message.modifiedDate)}` : this.utils.fullDateTime(this.message.createDate);
      },
    },
  };

</script>

<style lang="stylus" scoped>

  @import "~@/shared.styl"

  @keyframes highlight-soft
    0%
      background alpha($color-gold, 0.2)
    20%
      background alpha($color-gold, 0.2)
    100%
      background alpha($color-gold, 0.05)


  .chat-message
    padding 5px 20px
    display flex
    position relative

    &:hover,
    &:focus-within
      background alpha($color-light-blue-background, 60%) !important

      .darkMode &
        background alpha($color-light-blue-background, 7%) !important

      .buttons-container
        display block

        .field
          opacity 1

    /*
    HIGHLIGHTS
     */

    &.message-highlight
      box-shadow 0 1px 3px 1px rgba(0, 0, 0, 0.15), 0 5px 13px rgba(0, 0, 0, 0.1), 0 0 0 4000px rgba(30, 40, 58, 0.2)
      margin 0 13px
      padding 5px 7px
      border-radius $border-radius
      z-index 20
      background #fff !important

      .darkMode &
        background $color-background-4-darkmode !important

      .buttons-container
        right 2px
        display block

        .field
          opacity 1


     &.message-shadow
      .text-content,
      .note-content
        opacity 0.4

    &.message-saved
      background alpha(#409df1, 0.05)

    &.message-softhighlight
      animation highlight-soft 5s

    &.message-unread
      background alpha($color-unread-background, 10%)

      .darkMode &
        background alpha($color-unread-background, 6%)

    &.message-error
      background alpha($color-red, 0.05)

    /*
     BUTTONS
     */

    .buttons-container
      margin-top -3px
      margin-bottom -3px
      margin-left 10px
      display block

      // -
      top -29px
      right 15px
      position absolute
      z-index 20
      display none

    /*
    AVATAR
     */

    .avatar-container
      min-width 45px
      max-width 45px
      padding-top 4px

      .sticky-avatar
        height calc(100% - 10px)

      .avatar
        position sticky
        top 10px
        margin-bottom -4px
        background-color $color-light-gray-background

        .darkMode &
          background $color-background-4-darkmode

      .date
        font-sans($font-size-small)
        color $color-gray-text-light
        margin-top 2px
        margin-left -2px
        line-height 1
        display none

      .saved-icon
        margin-left 18px
        position absolute
        top 9px

    &:hover,
    &:focus-within
      .avatar-container

        .date
          display block

        .saved-icon
          display none

    /*
     NAME DATE
     */

    .name-date
      font-sans($font-size-small)

      .name
        font-sans($font-size-small, $font-weight-sans-bold)
        margin-right 5px
        flex-shrink 1

        .saved-icon
          margin-left 3px

    /*
    EMAIL
    */

    &.isEmail
      .avatar-container

        .date,
        .saved-icon
          display block

        .saved-icon
          margin-top 7px
          margin-left 3px

     /*
     CONTENT
      */

    .note-content
      overflow hidden

    .content-container
      word-wrap break-word
      width 100%
      min-width 0

    .event-content
      font-style italic

    .email-meta
      color $color-gray-text
      margin-bottom 5px

      b
        color #4a4a4a

    .email-plain
      padding 10px
      border-radius 4px
      max-width 700px
      margin-bottom 10px
      border 1px solid $color-border-medium

      .darkMode &
        border-color $color-border-medium-darkmode

    .text-clamped
      overflow hidden
      text-overflow ellipsis
      white-space nowrap

      @supports (-webkit-line-clamp: 3)
        white-space pre-line
        display -webkit-box
        -webkit-box-orient vertical
        -webkit-line-clamp 3

    .commit-preview
      display inline-block
      vertical-align top
      margin 3px 8px 8px 0
      color inherit
      background  $color-light-blue-background
      border-radius $border-radius
      overflow hidden

      &:hover,
      &:focus
        background darken($color-light-blue-background, 1)

      &:focus
        outline none

        .commit-title
          text-decoration underline

      .commit-title
        padding 5px 10px

    /*
     SKELETON
     */

    .content-container .placeholder
      display block
      background alpha(#000, .02)
      height 18px
      margin-right 40px
      max-width 700px
      margin-bottom 10px

      .darkMode &
        background alpha(#fff, 3%)

      &.name
        height 12px
        max-width 120px
        margin 5px 0 9px

    /*
    WRITING
     */

    .writing-dots
      display flex
      padding-top 8px
      $duration = 1.5s
      $delay = 150ms

      .dot1,
      .dot2,
      .dot3
        width 8px
        height @width
        margin-right @width
        border-radius (@width / 2)
        background $color-gray-border

        .darkMode &
          background darken($color-text-quiet-darkmode, 40%)


      .dot1
        animation dotJump $duration ease-in-out 0ms infinite

      .dot2
        animation dotJump $duration ease-in-out $delay infinite

      .dot3
        animation dotJump $duration ease-in-out $delay*2 infinite


    /*
    COMPACT MESSAGE DISPLAY
     */

    &.compact

      $_avatar_size = 18px

      .avatar-container
        width $_avatar_size
        min-width @width
        max-width @width
        margin-right 5px
        padding-top 1px

        .sticky-avatar
          height $_avatar_size
          overflow hidden
          border-radius 10px

        img
          position relative
          top -3px
          width $_avatar_size
          height auto

      .text-clamped,
      .event-content,
      .file-content,
      .email-meta,
      .email-content-wrapper,
      .text-content,
      .note-content
        margin-left -23px
        margin-top 3px

      .file-content a
        margin-bottom 3px

</style>

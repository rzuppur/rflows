<template lang="pug">

  .chat-message(:style="message ? '' : 'pointer-events: none;'" :class="{ buttonsHoverOnly, isEmail }")

    template(v-if="!message || writingUser")

      .avatar-container
        .sticky-avatar
          img.avatar.avatar-small(v-if="writingUser && writingUser.avatar" :src="writingUser.avatar")
          .avatar.avatar-small.placeholder(v-else)

      .content-container
        .name(v-if="writingUser && writingUser.name") {{ writingUser.name }}
        .name.placeholder(v-else)
        .writing-dots(v-if="writingUser")
          .dot1
          .dot2
          .dot3
        p.placeholder(v-else)

    template(v-else)

      .avatar-container(v-if="!(isEmail && compact)")

        .sticky-avatar(v-if="!isEmail")
          img.avatar.avatar-small(:src="avatarUrl")

        .date(v-if="dateShort" v-tooltip="dateMedium")
          | {{ dateShort }}

        .icon.is-small.has-text-info.saved-icon(v-if="message.flagged")
          i.fas.fa-thumbtack

      .content-container
        b.text-error.text-small(v-if="message.error") {{ message.error }} #{""}

        .ellipsis(v-if="message.type !== 'EMAIL'")

          template(v-if="message.replyTo && !showReplyMessage")
            span.icon.is-small.has-text-grey-light
              i.fas.fa-reply
            | &nbsp;

          .name {{ compact ? authorNameShort : authorName }}
            span.icon.is-small.has-text-info.saved-icon(v-if="!compact && message.flagged" v-tooltip="'Message is in saved messages'")
              i.fas.fa-thumbtack

          template(v-if="dateShort")
            .date(v-if="compact") {{ utils.dayjsDate(message.createDate).format("MMM YYYY") }}
            .date(v-else v-tooltip="dateMedium") {{ dateShort }}

          //-span.text-small.text-error(v-if="message.customData && Object.keys(message.customData).length") &nbsp; customData: {{ message.customData }}

        template(v-if="message.replyTo")
          message-preview.reply-original(v-if="showReplyMessage" :messageId="message.replyTo" :chatId="message.chatId" :key="`${message.replyTo}-preview`")

        slot(name="content")

          p.event-content(v-if="message.type === 'EVENT'") {{ message.text }}

          template(v-else-if="message.type === 'CHAT'")
            .text-clamped(v-if="compact" v-html="$flows.messages.chatTextParse(message.text)")
            p.text-content(v-else v-html="$flows.messages.chatTextParse(message.text)")

          template(v-else-if="message.type === 'NOTE'")
            .text-clamped(v-if="compact") {{ $flows.messages.getMessageTextRepresentation(message.text) }}
            .note-content(v-else v-html="$flows.messages.noteTextParse(message.text)")

          .file-content(v-else-if="message.type === 'FILE'")

            file-display(:text="message.text" :url="$flows.utils.relativeToFullPath(message.url)" :preview="$flows.messages.fileMessagePreviewable(message)")

          template(v-else-if="isEmail")

            p.event-content(v-if="isEmail && message.subject === '[Netlify] We just published a new Production deploy for rflows' && message.from.address === 'team@netlify.com'") #[i.fas.fa-check.has-text-success] Successfully deployed to Netlify

            template(v-else-if="isEmail && message.subject.indexOf('[rzuppur/RFlows] ') === 0 && message.from.address === 'noreply@github.com'")
              p.event-content #[i.fas.fa-plus] New commits in branch {{ utils.commitEmailBranch(message.text) }}
              .commit(v-for="commit in utils.commitEmailParse(message.text)")
                a.commit-preview(:href="commit.url" target="_blank" rel="noopener noreferrer nofollow")
                  .commit-title #[i.fab.fa-github] #[b  {{ commit.name }}]

            template(v-else)
              .email-meta
                .text-small From: {{ message.from.name }} <{{ message.from.address }}>
                .text-small To: {{ message.to.map(to => to.name ? `${to.name} <${to.address}>` : to.address).join(", ") }}

              template(v-if="!message.contentType || message.contentType.toLowerCase() !== 'text/html'")
                b {{ message.subject }}
                p.text-content.email-plain(v-html="utils.textToHTML(message.text)")

              r-button.view-email-button(v-else borderless gray :action="() => { $events.$emit('openEmail', message) }" icon="mail") {{ message.subject }}

          p.text-content.text-error(v-else) Unknown message type: {{ message.type }}

      .buttons-container(@dblclick.native.stop)

        .field.has-addons

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
      showReplyMessage: {
        type: Boolean,
        default: true,
      },
      writingUser: {
        type: Object,
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
        return this.$flows.utils.getFullNameFromUser(this.author);
      },
      authorNameShort() {
        return this.$flows.utils.getShortNameFromUser(this.author);
      },
      avatarUrl() {
        this.$store.flows.chatUsers.v;
        this.$store.flows.users.v;

        if (!this.message) return this.$flows.utils.placeholderImageChar("");

        return this.$flows.utils.getAvatarFromUser(this.author);
      },
      isEdited() {
        return this.message.modifiedDate !== this.message.createDate;
      },
      dateShort() {
        if (this.message.shadow) return false;
        return this.utils.time(this.message.createDate) + (this.isEdited ? "*" : "");
      },
      dateMedium() {
        return this.isEdited ? `Edited ${this.utils.dateTimeAddOtherYear(this.message.modifiedDate)}` : this.utils.weekdayDate(this.message.createDate);
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
      background alpha($color-light-blue-background, 0.6) !important

      .buttons-container
        display block

        .field
          opacity 1

    /*
    HIGHLIGHTS
     */

    &.message-highlight
      box-shadow 0 1px 3px 1px rgba(0, 0, 0, 0.15), 0 5px 13px rgba(0, 0, 0, 0.1), 0 0 0 4000px rgba(68, 85, 114, 0.2)
      margin 0 13px
      padding 5px 7px
      border-radius $border-radius
      background #fff !important
      z-index 20

      .buttons-container
        .field
          opacity 1

        @media (max-width $buttons-switch-to-mobile)
          right 2px
          display block

     &.message-shadow
      .text-content,
      .note-content
        opacity 0.4

    &.message-saved
      background alpha(#409df1, 0.05)

    &.message-softhighlight
      animation highlight-soft 5s

    &.message-unread
      background alpha($color-unread-background, 0.1)

    &.message-error
      background alpha($color-red, 0.05)

    /*
     BUTTONS
     */

    .buttons-container .field
      opacity 0

    .buttons-container
      margin-top -3px
      margin-bottom -3px
      margin-left 10px
      display block

      @media (max-width $buttons-switch-to-mobile)
        top -29px
        right 15px
        position absolute
        z-index 20
        display none
        box-shadow 0 2px 4px -2px rgba(0,0,0,0.2)

      .field
        @media (min-width $buttons-switch-to-mobile+1px)
          position sticky
          top 20px
          margin-top 10px
          margin-bottom 10px

        .button span:not(.icon)
          color $color-text

    &.noauthor
      &:hover,
      &:focus-within
        .avatar-container
          .date
            display block

          .saved-icon
            display none

      .sticky-avatar,
      .content-container > .ellipsis
        display none

      .avatar-container .saved-icon
        display block

      .buttons-container .field
        @media (min-width $buttons-switch-to-mobile+1px)
          margin-top 0
          margin-bottom 0

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

      .date
        display none
        margin-top -1px
        margin-bottom -3px
        color #aaa
        line-height 1.2

      .saved-icon
        display none
        font-size 12px
        margin-left 25px

    /*
     NAME
     */

    .name,
    .date
      display inline-block
      font-sans($font-size-small)

    .name
      font-sans($font-size-small, $font-weight-sans-bold)
      margin-right 5px

      .saved-icon
        margin-left 3px
        font-size 12px

    .date
      color $color-gray-text

    /*
    EMAIL
    */

    &.isEmail
      .avatar-container

        .date,
        .saved-icon
          display block !important

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
      color $color-gray-text
      font-style italic

    .email-meta
      color $color-gray-text
      margin-bottom 5px

      b
        color #4a4a4a

    .email-plain
      border 1px solid #ddd
      padding 10px
      border-radius 4px
      max-width 700px
      margin-bottom 10px
      background #fff

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
        background $color-gray-border
        width 8px
        height @width
        margin-right @width
        border-radius (@width / 2)

      .dot1
        animation dotJump $duration ease-in-out 0ms infinite

      .dot2
        animation dotJump $duration ease-in-out $delay infinite

      .dot3
        animation dotJump $duration ease-in-out $delay*2 infinite

</style>

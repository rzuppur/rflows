<template lang="pug">

  .chat-message

    .avatar-container

      .sticky-avatar
        img.avatar.avatar-small(:src="flows.getAvatar(message.creatorUserId)")

      .date(v-tooltip="message.modifiedDate !== message.createDate ? 'Edited ' + utils.dateTimeAddOtherYear(message.modifiedDate) : utils.weekdayDate(message.createDate)")
        | {{ utils.time(message.createDate) + (message.modifiedDate !== message.createDate ? '*' : '') }}

      .icon.is-small.has-text-info.saved-icon(v-if="message.flagged")
        i.fas.fa-thumbtack

    .content-container
      b.text-error.text-small(v-if="message.error") Message was not sent #{""}
      //- TODO: resend

      .name {{ flows.getFullName(message.creatorUserId) }}
        span.icon.is-small.has-text-info.saved-icon(v-if="message.flagged" v-tooltip="'Message is in saved messages'")
          i.fas.fa-thumbtack

      .date

        span(v-if="compact") {{ utils.dateTimeAddOtherYear(message.createDate) }}

        template(v-else)
          span(v-tooltip="utils.weekdayDate(message.createDate)") {{ utils.time(message.createDate) }}
          span(v-if="message.modifiedDate !== message.createDate") , edited {{ utils.dateTime(message.modifiedDate) }}

      //-span.text-small.text-error(v-if="message.customData && Object.keys(message.customData).length") &nbsp; customData: {{ message.customData }}

      template(v-if="message.referenceFromTopicItemId")
        message-preview.reply-original(v-if="showReplyMessage" :messageId="message.referenceFromTopicItemId")
        p.text-muted.text-small(v-else) Reply to #{""}
          span(v-if="flows.getChatMessage(message.referenceFromTopicItemId)") {{ flows.getFullName(flows.getChatMessage(message.referenceFromTopicItemId).creatorUserId) }}
          span(v-else) ?

      slot(name="content")

        p.event-content(v-if="message.type === 'EVENT'") {{ message.text }}

        template(v-else-if="message.type === 'CHAT'")
          .text-clamped(v-if="compact" v-html="flows.chatTextParse(message.text)")
          p.text-content(v-else v-html="flows.chatTextParse(message.text)")

        template(v-else-if="message.type === 'NOTE'")
          .text-clamped(v-if="compact") {{ flows.getMessageTextRepresentation(message.text) }}
          .note-content(v-else v-html="flows.noteTextParse(message.text)")

        .file-content(v-else-if="message.type === 'FILE'")

          file-display(:message="message")

        template(v-else-if="message.type === 'EMAIL'")

          p.event-content(v-if="message.type === 'EMAIL' && message.subject === '[Netlify] We just published a new Production deploy for rflows' && message.from.address === 'team@netlify.com'") #[i.fas.fa-check.has-text-success] Successfully deployed to Netlify

          template(v-else-if="message.type === 'EMAIL' && message.subject.indexOf('[rzuppur/RFlows] ') === 0 && message.from.address === 'noreply@github.com'")
            p.event-content #[i.fas.fa-plus] New commits in branch {{ utils.commitEmailBranch(message.text) }}
            .commit(v-for="commit in utils.commitEmailParse(message.text)")
              a.commit-preview(:href="commit.url" target="_blank" rel="noopener noreferrer nofollow")
                .commit-title #[i.fab.fa-github] #[b  {{ commit.name }}]

          template(v-else)
            .email-meta
              | From: {{ message.from.address }}<br>
              | To: {{ message.to.map(to => to.address).join(", ") }}<br>
              | #[b {{ message.subject }}]

            p.text-content.email-plain(v-if="!message.contentType || message.contentType.toLowerCase() !== 'text/html'" v-html="utils.textToHTML(message.text)")

            button.button(v-else type="button" @click="$events.$emit('openEmail', message.id)") View email

        p.text-content.text-error(v-else) Unknown message type: {{ message.type }}

    .buttons-container

      .field.has-addons

        slot(name="buttons")

</template>

<script>
  import FileDisplay from "@/components/Message/FileDisplay.vue";
  import MessagePreview from "@/components/MessagePreview.vue";

  export default {
    name: "MessageDisplay",
    components: { FileDisplay, MessagePreview },
    props: {
      message: {
        type: Object,
        required: true,
      },
      compact: {
        type: Boolean,
        default: false,
      },
      showReplyMessage: {
        type: Boolean,
        default: true,
      },
    },
  };

</script>

<style lang="stylus" scoped>

  @import "~@/shared.styl"

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
     BUTTONS
     */

    .buttons-container .field
      opacity 0

    .buttons-container
      margin-top -3px
      margin-bottom -3px
      margin-left 10px
      display block // @stylint ignore

      @media (max-width $buttons-switch-to-mobile)
        top -29px
        right 15px
        position absolute
        z-index 10
        display none // @stylint ignore
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
      .content-container > .name,
      .content-container > .date
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
      text-regular-13()

    .name
      text-bold-13()
      margin-right 5px

      .saved-icon
        margin-left 3px
        font-size 12px

    .date
      color $color-gray-text

     /*
     CONTENT
      */

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
        font-weight 600
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


</style>

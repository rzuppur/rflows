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
            p.event-content #[i.fas.fa-plus] New commits in repository
            .file-content(v-for="commit in utils.commitEmailParse(message.text)")
              a.file-preview(:href="commit.url" target="_blank" rel="noopener noreferrer nofollow" style="padding: 1px 5px 1px 0; color: inherit;")
                .file-title #[i.fab.fa-github] #[b  {{ commit.name }}]

          template(v-else)
            .email-meta
              | From: {{ message.from.address }}<br>
              | To: {{ message.to.map(to => to.address).join(", ") }}<br>
              | #[b {{ message.subject }}]

            p.text-content.email-plain(v-if="!message.contentType || message.contentType.toLowerCase() !== 'text/html'" v-html="utils.textToHTML(message.text)")

            button.button(v-else type="button" @click="eventBus.$emit('openEmail', message.id)") View email

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

<style lang="stylus" scoped src="@/components/Message.styl"></style>

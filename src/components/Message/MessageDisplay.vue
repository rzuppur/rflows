<template lang="pug" functional>

  .chat-message(v-on="listeners" :class="data.class")

    .avatar-container

      .sticky-avatar
        img.avatar.avatar-small(:src="props.flows.getAvatar(props.message.creatorUserId)")

      .date(v-tooltip="props.message.modifiedDate !== props.message.createDate ? 'Edited ' + props.utils.dateTimeAddOtherYear(props.message.modifiedDate) : props.utils.weekdayDate(props.message.createDate)")
        | {{ props.utils.time(props.message.createDate) + (props.message.modifiedDate !== props.message.createDate ? '*' : '') }}

      .icon.is-small.has-text-info.saved-icon(v-if="props.message.flagged")
        i.fas.fa-thumbtack

    .content-container
      b.text-error.text-small(v-if="props.message.error") Message was not sent #{""}
      //- TODO: resend

      .name {{ props.flows.getFullName(props.message.creatorUserId) }}
        span.icon.is-small.has-text-info.saved-icon(v-if="props.message.flagged" v-tooltip="'Message is in saved messages'")
          i.fas.fa-thumbtack

      .date
        span(v-tooltip="props.utils.weekdayDate(props.message.createDate)") {{ props.utils.time(props.message.createDate) }}
        span(v-if="props.message.modifiedDate !== props.message.createDate") , edited {{ props.utils.dateTime(props.message.modifiedDate) }}

      //-span.text-small.text-error(v-if="props.message.customData && Object.keys(props.message.customData).length") &nbsp; customData: {{ props.message.customData }}

      slot(name="reply")
        p.text-small.text-muted(v-if="props.message.referenceFromTopicItemId" style="margin-bottom: 4px;") Reply original not available

      slot(name="content")

        p.event-content(v-if="props.message.type === 'EVENT'") {{ props.message.text }}

        p.text-content(v-else-if="props.message.type === 'CHAT'" v-html="props.flows.chatTextParse(props.message.text)")

        .note-content(v-else-if="props.message.type === 'NOTE'" v-html="props.flows.noteTextParse(props.message.text)")

        .file-content(v-else-if="props.message.type === 'FILE'")

          a.file-preview(:href="props.flows.getFilePath(props.message.url)" target="_blank" rel="noopener noreferrer nofollow")

            .file-title.ellipsis #[i.fas.fa-paperclip] {{ props.message.text }}

            .image-preview(v-if="props.utils.fileMessagePreviewable(props.message)")
              img(:src="props.flows.getFilePath(props.message.url)")

        template(v-else-if="props.message.type === 'EMAIL'")

          p.event-content(v-if="props.message.type === 'EMAIL' && props.message.subject === '[Netlify] We just published a new Production deploy for rflows' && props.message.from.address === 'team@netlify.com'") #[i.fas.fa-check.has-text-success] Successfully deployed to Netlify

          template(v-else-if="props.message.type === 'EMAIL' && props.message.subject.indexOf('[rzuppur/RFlows] ') === 0 && props.message.from.address === 'noreply@github.com'")
            p.event-content #[i.fas.fa-plus] New commits in repository
            .file-content(v-for="commit in props.utils.commitEmailParse(props.message.text)")
              a.file-preview(:href="commit.url" target="_blank" rel="noopener noreferrer nofollow" style="padding: 1px 5px 1px 0; color: inherit;")
                .file-title #[i.fab.fa-github] #[b  {{ commit.name }}]

          template(v-else)
            .email-meta
              | From: {{ props.message.from.address }}<br>
              | To: {{ props.message.to.map(to => to.address).join(", ") }}<br>
              | #[b {{ props.message.subject }}]

        p.text-content.text-error(v-else) Unknown message type: {{ props.message.type }}

    .buttons-container
      .field.has-addons
        slot(name="buttons")

</template>

<style lang="stylus" scoped src="@/components/Message.styl"></style>

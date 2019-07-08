<template lang="pug" functional>

  button(
    :class="[\
      props.icon || props.icon === '' ? 'button-icon' : '',\
      props.loading || props.loading === '' ? 'is-loading' : '',\
      data.class,\
      data.staticClass,\
    ]"
    :type="props.submit === '' ? 'submit' : 'button'"
    @pointerdown.prevent
    v-on="props.action ? { click: props.action } : null"
    :disabled="props.disabled"
    :aria-label="props.label"
    v-tooltip="{ content: props.tip ? `${props.tip}` : null, placement: props.tloc ? props.tloc : 'auto' }"
    :style="(data.style || []).concat(data.staticStyle || [])"
  )
    slot

</template>

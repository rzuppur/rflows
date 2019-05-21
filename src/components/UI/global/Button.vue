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
    v-tooltip="props.tip ? `${props.tip}` : null"
    v-tooltip.right="props.rtip ? `${props.rtip}` : null"
  )
    slot

</template>

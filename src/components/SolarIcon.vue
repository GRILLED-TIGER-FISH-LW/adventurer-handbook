<script setup>
import { computed } from 'vue'
import { solarIcon } from '../icons/solar.js'

const props = defineProps({
  name: { type: String, required: true },
  bold: { type: Boolean, default: false },
  size: { type: [Number, String], default: 20 },
})

const comp = computed(() => solarIcon(props.name, props.bold))
</script>

<template>
  <component v-if="comp" :is="comp" :size="size" />
</template>

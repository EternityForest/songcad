<script setup lang="ts">
import { computed } from 'vue'
import { Chord } from 'tonal'

const props = defineProps<{
  chord: string
}>()

const notes = computed(() => {
  const c = Chord.get(props.chord)
  if (!c) return []
  return c.notes
})
</script>

<template>
  <div>
    <span v-if="!notes.length">Unknown Chord</span>
    <span class="margin" v-for="n in notes" :key="n">
      {{ n }}
    </span>
  </div>
</template>

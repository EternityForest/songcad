<script setup lang="ts">
import type { SongProject } from '../song_interface'
const props = defineProps<{
  beat: SongProject['sections'][number]['beats'][number]
  num: number
  selected: boolean
}>()

import '../assets/barrel.css'
</script>

<template>
  <div class="flex-col w-sm-quarter">
    <header>
      <h2>
        <button>{{ props.num }}</button>
      </h2>
    </header>
    <div v-if="selected">(editing)</div>
    <div>1/{{ props.beat.divisions }}</div>
    <div class="tool-bar" v-if="props.beat?.chordChanges?.length">
      <div v-for="(chord, index) in props.beat.chordChanges" :key="index">
        {{ chord.chord || '' }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>

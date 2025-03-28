<script setup lang="ts">
import type { SongProject } from '../song_interface'
import { computed } from 'vue'
import { currentSection, currentBeat } from '@/midi'
const props = defineProps<{
  beat: SongProject['sections'][number]['beats'][number]
  num: number
  section_idx: number
  selected: boolean
}>()

const lyrics = computed(() => {
  const l = []
  for (const key in props.beat.melody) {
    for (const note of props.beat.melody[key]) {
      if (note.lyric) {
        l.push(note.position + ' ' + note.lyric)
      }
    }
  }
  return l
})
import '../assets/barrel.css'
</script>

<template>
  <div class="flex-col w-8rem h-8rem">
    <header>
      <h2>
        <button>
          <span v-if="props.num == currentBeat && currentSection == props.section_idx">*</span>
          {{ props.num }}
        </button>
      </h2>
    </header>
    <span v-if="selected">(editing)</span>
    <div v-for="(lyric, index) in lyrics" :key="index">
      {{ lyric }}
    </div>
    <div class="tool-bar" v-if="props.beat?.chordChanges?.length">
      <div v-for="(chord, index) in props.beat.chordChanges" :key="index">
        {{ chord.chord || '' }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>

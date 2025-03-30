<script setup lang="ts">
import { Note as TonalNote } from 'tonal'
import type { SongProject } from '../song_interface'
import { computed } from 'vue'
import { currentSection, currentBeat } from '@/midi'

const props = defineProps<{
  beat: SongProject['sections'][number]['beats'][number]
  num: number
  section_idx: number
  selected: boolean
}>()

const loopEventIcons = computed(() => {
  const x = []
  const loopEvents = props.beat?.loopEvents
  if(!loopEvents) return
  for (const i in loopEvents) {
    const ev = loopEvents[i]

    if (ev.action == 'start') {
      x.push("➡️")
    }
    if(ev.action == 'stop') {
      x.push("⏹️")
    }
  }

  return x
})
const lyrics = computed(() => {
  const l = []
  for (const key in props.beat.melody) {
    for (const note of props.beat.melody[key]) {
      if (note.lyric) {
        l.push(note.position + ' ' + note.lyric + " " + TonalNote.get(TonalNote.fromMidi(note.pitch || 0)).name
        )
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
    <div class="tool-bar" v-if="props.beat?.chordChanges?.length">
      <div v-for="(chord, index) in props.beat.chordChanges" :key="index" class="min-w-2rem">
        {{ chord.chord || '' }}
      </div>
    </div>
    <div  v-if="loopEventIcons?.length">
      <div v-for="(icon, index) in loopEventIcons" :key="index" class="min-w-2rem">
        {{ icon }}
      </div>
    </div>
    <span v-if="selected">(editing)</span>
    <div v-for="(lyric, index) in lyrics" :key="index">
      {{ lyric }} 
    </div>

  </div>
</template>

<style scoped></style>

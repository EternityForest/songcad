<script setup lang="ts">
import { Note } from 'tonal'
import { noteRangeEditiorStart } from '@/song_state'
import { computed } from 'vue'
import { activeNoteInput } from '@/song_state'
import { playNote } from '@/midi'
const noteButtons = computed(() => {
  const x: [string, number][] = []
  for (let i = 0; i < 32; i++) {
    x.push([Note.get(Note.fromMidi(i + noteRangeEditiorStart)).name, i + noteRangeEditiorStart])
  }

  return x
})

function setNote(n: number) {
  playNote(n, 500, 1, 'piano')

  if (activeNoteInput) {
    if (activeNoteInput[1] instanceof HTMLInputElement) {
      if (activeNoteInput[1].checkVisibility()) {
        activeNoteInput[0].pitch = n
      }
    }
  }
}
</script>

<template>
  <div>
    <input type="number" v-model="noteRangeEditiorStart" />

    <div class="flex-row w-sm-full">
      <button
        v-for="i of noteButtons"
        tabindex="-1"
        :key="i[0]"
        class="noselect w-4rem"
        :class="{ black: i[0].length == 3, white: i[0].length == 2 }"
        @click="setNote(i[1])"
      >
        {{ i[0] }}
      </button>
    </div>
  </div>
</template>

<style>
.black {
  color: white;
  background: black;
}
.white {
  background: white;
  color: black;
}
</style>

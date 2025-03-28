<script setup lang="ts">
import { ref, computed } from 'vue'
import { project } from '../song_state'
import { midiToDrumName } from '@/data'
const selectedPatternName = ref('')

const selectedPattern = computed(() => {
  return project.value.loops[selectedPatternName.value]
})

const renamePattern = (name: string) => {
  const newName = prompt('Rename Pattern')
  if (newName) {
    if (project.value.loops[newName]) {
      alert('Pattern already exists')
      return
    }
    project.value.loops[newName] = project.value.loops[name]
    delete project.value.loops[name]
    selectedPatternName.value = newName
  }
}

const deletePattern = (name: string) => {
  if (confirm('Are you sure you want to delete this pattern?')) {
    delete project.value.loops[name]
    if (selectedPatternName.value == name) {
      selectedPatternName.value = ''
    }
  }
}

const addPattern = () => {
  const name = prompt('Pattern Name')
  if (name) {
    if (project.value.loops[name]) {
      alert('Pattern already exists')
      return
    }
    project.value.loops[name] = {
      instrument: 'piano',
      data: [],
      length: 2,
      divisions: 4,
    }
    selectedPatternName.value = name
  }
}

function addNote() {
  if (!selectedPattern.value) return

  const lastNote = selectedPattern.value.data[selectedPattern.value.data.length - 1]
  let lastNoteEnd = 0
  if (lastNote) {
    lastNoteEnd = lastNote.start + lastNote.duration
  }

  selectedPattern.value.data.push({
    start: lastNoteEnd,
    duration: 1,
    note: 1,
    ignoreInversion: false,
    rangeMin: 'A4',
    rangeMax: 'A6',
    octave: 0,
  })
}

function deleteNote(index: number) {
  if (!selectedPattern.value) return
  selectedPattern.value.data.splice(index, 1)
}

const sortNotes = () => {
  if (!selectedPattern.value) return
  selectedPattern.value.data.sort((a, b) => (a?.start || 0) - (b?.start || 0))
}
</script>

<template>
  <div popover id="pattern-editor" class="window flex-col">
    <header>
      <div class="tool-bar">
        <h2>Pattern Editor</h2>
        <button class="nogrow" popovertarget="pattern-editor" popoverclose>X</button>
      </div>
    </header>

    <div class="flex-row">
      <div id="editor-sections" class="scroll w-16rem">
        <div v-for="(pattern, name) in project.loops" :key="name" class="tool-bar">
          <button class="grow" @click="selectedPatternName = name.toString()">
            {{ name }}
          </button>
        </div>
        <div class="tool-bar">
          <button @click="addPattern()">Add Pattern</button>
        </div>
      </div>

      <div v-if="selectedPattern" class="flex-col grow">
        <header>
          <h3>{{ selectedPatternName }}</h3>
        </header>
        <div class="tool-bar">
          <button @click="renamePattern(selectedPatternName)">Rename</button>
          <button class="nogrow" @click="deletePattern(selectedPatternName)">🗑</button>
        </div>

        <div class="stacked-form">
          <label
            >Instrument
            <select v-model="selectedPattern.instrument">
              <option value="piano">Piano</option>
              <option value="flue">Flute</option>
              <option value="drums">Drums</option>
            </select>
          </label>
          <label
            >Length
            <input type="number" v-model="selectedPattern.length" class="w-4rem" />
          </label>
          <label
            >Divisions Per Beat
            <input type="number" v-model="selectedPattern.divisions" />
          </label>
        </div>
        <table border="1">
          <thead>
            <tr>
              <th>Position</th>
              <th>Duration</th>
              <th>Pitch</th>
              <th>Range Start</th>
              <th>Octave Offset</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(note, index) in selectedPattern.data" :key="index">
              <td>
                <input
                  type="number"
                  v-model="note.start"
                  class="w-4rem"
                  min="0"
                  @change="sortNotes()"
                  max="128"
                />
              </td>
              <td>
                <input type="number" v-model="note.duration" class="w-4rem" min="0" max="128" />
              </td>

              <td>
                <input v-model="note.note" class="w-8rem" />
                <input
                  type="checkbox"
                  v-model="note.ignoreInversion"
                  v-if="selectedPattern.instrument != 'drums'"
                />

                <span v-if="selectedPattern.instrument == 'drums'">
                  {{ midiToDrumName[note.note] || 'Unknown' }}
                </span>
              </td>

              <td>
                <select v-model="note.rangeMin" class="w-4rem">
                  <option value="A2">A2</option>
                  <option value="A3">A3</option>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="A6">A6</option>
                  <option value="A7">A7</option>
                </select>
              </td>
              <td>
                <input type="number" v-model="note.octave" class="w-4rem" min="-3" max="3" />
              </td>
              <td>
                <button @click="deleteNote(index)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="tool-bar">
          <button @click="addNote">Add Note</button>
        </div>
      </div>
    </div>
  </div>
</template>

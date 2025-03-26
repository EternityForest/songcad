<script setup lang="ts">
import { ref, computed } from 'vue'
import { project } from '../song_state'

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
    }
    selectedPatternName.value = name
  }
}

function addNote() {
  if (!selectedPattern.value) return
  selectedPattern.value.data.push({
    start: 0,
    duration: 1,
    note: 'root',
    rangeMax: 'A4',
    rangeMin: 'A6',
  })
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

        <table border="1">
          <thead>
            <tr>
              <th>Position(Whole Notes)</th>
              <th>Duration</th>
              <th>Pitch</th>
              <th>Range Start</th>
              <th>Range End</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(note, index) in selectedPattern.data" :key="index">
              <td>
                <input
                  type="number"
                  v-model="note.start"
                  class="w-6rem"
                  min="0"
                  @change="sortNotes()"
                  max="128"
                />
              </td>
              <td>
                <input type="number" v-model="note.duration" class="w-4rem" min="0" max="128" />
              </td>

              <td>
                <select v-model="note.note" class="w-4rem">
                  <option value="root">Root(ignore inversion)</option>
                  <option value="1st">1st(ignore inversion)</option>
                  <option value="2nd">2nd(ignore inversion)</option>
                  <option value="3rd">3rd(ignore inversion)</option>
                  <option value="4th">4th(ignore inversion)</option>
                  <option value="1">1st(with inversion)</option>
                  <option value="2">2st(with inversion)</option>
                  <option value="3">3st(with inversion)</option>
                  <option value="4">4st(with inversion)</option>
                </select>
              </td>

              <td>
                <select v-model="note.rangeMin" class="w-4rem">
                  <option value="A2">A2</option>
                  <option value="G2">G2</option>
                  <option value="A3">F3</option>
                  <option value="G3">G3</option>
                  <option value="A4">A4</option>
                  <option value="G4">G4</option>
                  <option value="A5">A5</option>
                  <option value="G5">G5</option>
                  <option value="A6">A6</option>
                  <option value="G6">G6</option>
                  <option value="A7">A7</option>
                </select>
              </td>
              <td>
                <select v-model="note.rangeMax" class="w-4rem">
                  <option value="A2">A2</option>
                  <option value="G2">G2</option>
                  <option value="A3">F3</option>
                  <option value="G3">G3</option>
                  <option value="A4">A4</option>
                  <option value="G4">G4</option>
                  <option value="A5">A5</option>
                  <option value="G5">G5</option>
                  <option value="A6">A6</option>
                  <option value="G6">G6</option>
                  <option value="A7">A7</option>
                </select>
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

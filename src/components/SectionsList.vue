<script setup lang="ts">
import { project, selected_section_idx } from '../song_state'
import type { SongProject } from '../song_interface'

import '../assets/barrel.css'

const addSection = () => {
  project.value.sections.push({
    id: (Date.now() + Math.random()).toString(),
    name: 'Section ' + (project.value.sections.length + 1),
    beats: [],
    tempo: 120,
  })
}
const deleteSection = (section: SongProject['sections'][number]) => {
  project.value.sections.splice(project.value.sections.indexOf(section), 1)

  if (selected_section_idx.value >= project.value.sections.length) {
    selected_section_idx.value = project.value.sections.length - 1
  }
}
const moveSectionDown = (section: SongProject['sections'][number]) => {
  const index = project.value.sections.indexOf(section)

  if (index == selected_section_idx.value) {
    selected_section_idx.value = index + 1
  }

  project.value.sections.splice(index, 1)
  project.value.sections.splice(index + 1, 0, section)
}

const downloadAsJson = () => {
  const blob = new Blob([JSON.stringify(project.value)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'song.json'
  a.click()
}
</script>

<template>
  <div id="editor-sidebar" class="flex-col">
    <header>
      <h2>Sections</h2>
    </header>
    <div class="tool-bar">
      <button @click="downloadAsJson">Download</button>
    </div>
    <div id="editor-sections" class="scroll w-16rem">
      <div v-for="section in project.sections" :key="section.id" class="tool-bar">
        <button class="grow" @click="selected_section_idx = project.sections.indexOf(section)">
          {{ section.name }}
        </button>
        <button class="nogrow" @click="moveSectionDown(section)">⬇️</button>
        <button class="nogrow" @click="deleteSection(section)">🗑</button>
      </div>
    </div>
    <footer>
      <div class="tool-bar">
        <button @click="addSection">Add Section</button>
      </div>
    </footer>
  </div>
</template>

<style scoped></style>

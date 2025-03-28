<script setup lang="ts">
import { project, selected_section_idx } from '../song_state'
import type { SongProject } from '../song_interface'
import { renderSong } from '../engine'
import { notesToMidi } from '../midi'
import { flattenNotes } from '../engine'
import { startAudioContext } from '@/ssmid'
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

const uploadSong = () => {
  const el = document.querySelector('#upload-dialog input') as HTMLInputElement
  if (el.files) {
    const reader = new FileReader()
    reader.onload = () => {
      project.value = JSON.parse(reader.result as string)
    }
    reader.readAsText(el.files[0])
  }
}

function exportMidi() {
  const rendered = renderSong(project.value, 0, 0)
  const notes = flattenNotes(rendered)
  const midi = notesToMidi(notes)

  const blob = new Blob([midi], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'song.mid'
  a.click()

  URL.revokeObjectURL(url)
}
</script>

<template>
  <div popover id="upload-dialog" class="window flex-col">
    <header>Upload Song</header>
    <div class="tool-bar">
      <input type="file" accept="application/json" />
      <button @click="uploadSong()">Upload</button>
      <button class="nogrow" popoverclose popovertarget="upload-dialog">X</button>
    </div>
  </div>

  <div id="editor-sidebar" class="flex-col">
    <header>
      <h2>Sections</h2>
    </header>
    <div class="tool-bar">
      <button @click="downloadAsJson">Save</button>
      <button popovertarget="upload-dialog">Load</button>
      <button @click="exportMidi">Export MIDI</button>
      <button @click="startAudioContext">Enable Audio</button>
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

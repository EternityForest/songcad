<script setup lang="ts">
import { project, selected_section_idx, transposeSong } from '../song_state'
import type { SongProject } from '../song_interface'
import { renderSong } from '../engine'
import { notesToMidi } from '../midi'
import { flattenNotes } from '../engine'
import { startAudioContext } from '@/ssmid'
import '../assets/barrel.css'

const transposePrompt = () => {
  const by = prompt('Transpose by how many semitones?')
  if (by) {
    project.value = transposeSong(project.value, parseInt(by))
  }
}
const addSection = () => {
  project.value.sections.push({
    id: (Date.now() + Math.random()).toString(),
    name: 'Section ' + (project.value.sections.length + 1),
    beats: [],
    tempo: 120,
  })
}

const duplicateSection = (section: number) => {
  const copy = JSON.parse(JSON.stringify(project.value.sections[section]))
  copy.id = (Date.now() + Math.random()).toString()
  copy.name += ' (copy)'
  project.value.sections.splice(section + 1, 0, copy)
}

const deleteSection = (section: SongProject['sections'][number]) => {
  if (!confirm('Are you sure you want to delete this section?')) return
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

const moveSectionUp = (section: SongProject['sections'][number]) => {
  const index = project.value.sections.indexOf(section)

  if (index == selected_section_idx.value) {
    selected_section_idx.value = index - 1
  }

  project.value.sections.splice(index, 1)
  project.value.sections.splice(index - 1, 0, section)
}
const downloadAsJson = () => {
  const blob = new Blob([JSON.stringify(project.value)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (project.value.name || 'song') + '.songcad.json'
  a.click()
}

const uploadSong = () => {
  const el = document.querySelector('#upload-song-file') as HTMLInputElement
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

function addMelodyTrack() {
  if (project.value.melodyTracks == undefined) {
    project.value.melodyTracks = {}
  }
  const name = prompt('Melody Track Name')
  if (name) {
    project.value.melodyTracks[name] = {
      instrument: 'piano',
      volume: 1,
    }
  }
}

function removeMelodyTrack(name: string) {
  if (project.value.melodyTracks == undefined) return

  delete project.value.melodyTracks[name]
}
</script>

<template>
  <div popover id="upload-dialog" class="window flex-col">
    <label
      >Song Name
      <input v-model="project.name" placeholder="Song Name" />
    </label>

    <header>Upload Song</header>
    <div class="tool-bar">
      <input type="file" accept="application/json" id="upload-song-file" />
      <button @click="uploadSong()">Upload</button>
      <button class="nogrow" popoverclose popovertarget="upload-dialog">X</button>
    </div>

    <h2>Melody Channels</h2>
    <div class="tool-bar">
      <button @click="addMelodyTrack">Add Section</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Instrument</th>
          <th>Volume</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(melodyTrack, index) in project.melodyTracks || {}" :key="index">
          <td>{{ index }}</td>
          <td>
            <select v-model="melodyTrack.instrument">
              <option value="piano">Piano</option>
              <option value="guitar">Guitar</option>
              <option value="bass">Bass</option>
              <option value="violin">Violin</option>
              <option value="viola">Viola</option>
              <option value="cello">Cello</option>
              <option value="clarinet">Clarinet</option>
              <option value="saxophone">Saxophone</option>
              <option value="trumpet">Trumpet</option>
              <option value="trombone">Trombone</option>
            </select>
          </td>
          <td>
            <input
              type="number"
              v-model="melodyTrack.volume"
              class="w-4rem"
              min="0"
              max="1"
              step="0.01"
            />
          </td>
          <td>
            <button @click="removeMelodyTrack(index.toString())">🗑</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div id="editor-sidebar" class="flex-col">
    <header>
      <h2>Sections</h2>
    </header>
    <div class="tool-bar">
      <button @click="downloadAsJson">Save</button>
      <button popovertarget="upload-dialog">Settings</button>
      <button @click="exportMidi">Export MIDI</button>
      <button @click="startAudioContext">Enable Audio</button>
      <button @click="transposePrompt">Transpose</button>
    </div>
    <div id="editor-sections" class="scroll w-16rem">
      <div v-for="section in project.sections" :key="section.id" class="tool-bar">
        <button class="grow" @click="selected_section_idx = project.sections.indexOf(section)">
          {{ section.name }}
        </button>
        <button class="nogrow" @click="moveSectionUp(section)">⬆️</button>
        <button class="nogrow" @click="moveSectionDown(section)">⬇️</button>
        <button class="nogrow" @click="deleteSection(section)">🗑</button>
        <button class="nogrow" @click="duplicateSection(project.sections.indexOf(section))">
          📦
        </button>
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

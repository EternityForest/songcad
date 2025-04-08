<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { project, selected_section, selected_section_idx, setActiveNoteInput } from '../song_state'
import { flattenNotes } from '../engine'
import BeatIcon from './BeatIcon.vue'
import PianoKeyboard from './PianoKeyboard.vue'
import ChordInfo from './ChordInfo.vue'
import { playNotes, testNote, stopPlayback, currentBeat, currentSection } from '../midi'
import { playNewBeat } from '../engine'
import { renderSong } from '../engine'
import { backtrackBeat } from '../engine'
import { loopLibrary } from '../loops'
import { Note as TonalNote } from 'tonal'
import { commonChords } from '@/data'
import '../assets/barrel.css'
import type { Melody, SongProject } from '@/song_interface'

const selected_beat_idx = ref(0)

const selected_melody_column: Ref<string> = ref('lead-vocal')

const melody_columns = ['lead-vocal', 'lead-guitar', 'bass', 'strings', 'flute']

const selected_melody_data = computed(() => {
  if (!selected_beat.value) {
    return null
  }
  if (!selected_beat.value.melody) {
    return null
  }

  return selected_beat.value?.melody[selected_melody_column.value]
})

const selected_beat = computed(() => {
  return selected_section.value?.beats[selected_beat_idx.value]
})

function deleteBeat(index: number) {
  if (!selected_section.value) return
  selected_section.value.beats.splice(index, 1)
  if (selected_beat_idx.value >= selected_section.value.beats.length) {
    selected_beat_idx.value = selected_section.value.beats.length - 1
  }
}
function addBeatAfterIndex(index: number) {
  if (!selected_section.value) return
  selected_section.value.beats.splice(index + 1, 0, {
    divisions: 4,
    chordChanges: [],
    melody: {},
  })
}

function moveBeatDown(index: number) {
  if (!selected_section.value) return
  const beat = selected_section.value.beats[index]
  selected_section.value.beats.splice(index, 1)
  selected_section.value.beats.splice(index + 1, 0, beat)
  if (selected_beat_idx.value >= index) {
    if (selected_beat_idx.value < selected_section.value.beats.length - 1) {
      selected_beat_idx.value += 1
    }
  }
}

function moveBeatUp(index: number) {
  if (!selected_section.value) return
  const beat = selected_section.value.beats[index]
  selected_section.value.beats.splice(index, 1)
  selected_section.value.beats.splice(index - 1, 0, beat)

  if (selected_beat_idx.value >= index) {
    if (selected_beat_idx.value > 0) {
      selected_beat_idx.value -= 1
    }
  }
}

function addChordChange() {
  if (!selected_beat.value) return
  if (!selected_beat.value.chordChanges) selected_beat.value.chordChanges = []
  selected_beat.value.chordChanges.push({
    chord: '',
    position: 0,
    inversion: 0,
  })
}

function deleteChordChange(index: number) {
  if (!selected_beat.value) return
  if (!selected_beat.value.chordChanges) return
  selected_beat.value.chordChanges.splice(index, 1)
}

function sortChordChanges() {
  if (!selected_beat.value) return
  if (!selected_beat.value.chordChanges) return
  selected_beat.value.chordChanges.sort((a, b) => a.position - b.position)
}

function selectMelodyColumn(column: string) {
  selected_melody_column.value = column
  if (!selected_beat.value) return
  if (!selected_beat.value.melody) {
    selected_beat.value.melody = {}
  }
  if (!selected_beat.value.melody[column]) {
    selected_beat.value.melody[column] = []
  }
}

const allMelodyColumns = computed(() => {
  const cols = []
  if (project.value.melodyTracks) {
    for (const col in project.value.melodyTracks) {
      cols.push(col)
    }
  }

  if (selected_beat.value) {
    if (selected_beat.value.melody) {
      for (const key in selected_beat.value.melody) {
        if (cols.includes(key)) continue
        cols.push(key)
      }
    }
  }
  return cols
})

function deleteMelodyNote(index: number) {
  if (!selected_beat.value) return
  if (!selected_beat.value.melody) return
  if (!selected_beat.value.melody[selected_melody_column.value]) return
  selected_beat.value.melody[selected_melody_column.value].splice(index, 1)
}
function addMelodyNote() {
  if (!selected_beat.value) return
  if (!selected_beat.value.melody) {
    selected_beat.value.melody = {}
  }
  if (!selected_beat.value.melody[selected_melody_column.value]) {
    selected_beat.value.melody[selected_melody_column.value] = []
  }

  const lastNote =
    selected_beat.value.melody[selected_melody_column.value][
      selected_beat.value.melody[selected_melody_column.value].length - 1
    ]
  let lastNoteEnd = 0
  if (lastNote) {
    lastNoteEnd = (lastNote?.position || 0) + (lastNote?.duration || 0)
  }

  selected_beat.value.melody[selected_melody_column.value].push({
    pitch: 64,
    octave: 4,
    duration: 1,
    position: lastNoteEnd,
  })
}

function getAllNotesInBeat(beat: SongProject['sections'][number]['beats'][number]) {
  const notes: string[] = []
  if (beat.melody) {
    for (const key in beat.melody) {
      for (const note of beat.melody[key]) {
        if (!note.pitch) continue
        const n = TonalNote.get(TonalNote.fromMidi(note.pitch))
        if (!notes.includes(n.pc)) notes.push(n.pc)
      }
    }
  }
  return notes
}

function getPossibleChords(beat: SongProject['sections'][number]['beats'][number]) {
  const notes = getAllNotesInBeat(beat)
  const possibilities = []
  for (const i in commonChords) {
    if (notes.every((x) => commonChords[i].includes(x))) {
      possibilities.push(i)
    }
  }

  possibilities.sort((a, b) => a.length - b.length)
  // Only the first 16
  return possibilities.slice(0, 18)
}

const midi_notes: [number, string][] = []
for (let i = 12; i < 90; i++) {
  midi_notes.push([i, TonalNote.get(TonalNote.fromMidi(i)).name])
}

function sortMelodyNotes() {
  if (!selected_beat.value) return
  if (!selected_beat.value.melody) return
  if (!selected_beat.value.melody[selected_melody_column.value]) return
  selected_beat.value.melody[selected_melody_column.value].sort(
    (a, b) => (a?.position || 0) - (b?.position || 0),
  )
}

function previewNote(n: Melody[string][number]) {
  const x = async function () {
    testNote(n.pitch || 64, 'piano')
  }
  x()
}

function addLoopEvent() {
  if (!selected_beat.value) return
  if (!selected_beat.value.loopEvents) {
    selected_beat.value.loopEvents = []
  }
  selected_beat.value.loopEvents.push({
    position: 0,
    loop: '',
    layer: '',
    fillLength: 0,
    action: 'start',
  })
}
function deleteLoopEvent(index: number) {
  if (!selected_beat.value) return
  if (!selected_beat.value.loopEvents) return
  selected_beat.value.loopEvents.splice(index, 1)
}
function sortLoopEvents() {
  if (!selected_beat.value) return
  if (!selected_beat.value.loopEvents) return
  selected_beat.value.loopEvents.sort((a, b) => a.position - b.position)
}

const stopper = [0]
async function playFromSelected() {
  const rendered = renderSong(project.value, selected_section_idx.value, selected_beat_idx.value)
  stopper[0] = 0
  let totalTime = 0
  for (
    let section = selected_section_idx.value;
    section < project.value.sections.length;
    section++
  ) {
    for (
      let beat = selected_beat_idx.value;
      beat < project.value.sections[section].beats.length;
      beat++
    ) {
      currentBeat.value = beat
      currentSection.value = section
      const beatStartTime = Date.now()
      const beatLen = 60000 / (project.value.sections[section]?.tempo || 120)
      if (stopper[0] == 1) {
        break
      }

      // Realight time because we are playing one section at a time and the abs timestamps
      // rel to song start don't make sense if you want a section to start right away
      for (const i of rendered[section][beat]) {
        i.start -= totalTime
      }
      totalTime += beatLen
      playNotes(rendered[section][beat])
      const delay = beatLen - (Date.now() - beatStartTime)
      if (stopper[0] == 1) {
        break
      }
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      if (stopper[0] == 1) {
        break
      }
    }
  }
}

function playHQFromSelected() {
  const rendered = renderSong(project.value, selected_section_idx.value, selected_beat_idx.value)
  const notes = flattenNotes(rendered)
  playNotes(notes)
}

function stop() {
  stopper[0] = 1
  stopPlayback()
}
</script>

<template>
  <div id="section-editor" v-if="selected_section" class="flex-col grow">
    <header>
      <div class="tool-bar">
        <input
          type="text"
          v-model="selected_section.name"
          placeholder="Section Name"
          class="w-16rem"
        />

        <label>BPM:<input type="number" v-model="selected_section.tempo" /></label>
        <label
          >Beats Per Measure:<input type="number" v-model="selected_section.beatsPerMeasure"
        /></label>
        <button @click="playFromSelected">Play from here</button>
        <button @click="playHQFromSelected">HQ Play Here</button>
        <button @click="stop">Stop</button>
      </div>
    </header>
    <div
      :class="{
        'beats-grid-3': selected_section.beatsPerMeasure == 3,
        'beats-grid-4': selected_section.beatsPerMeasure == 4,
      }"
      class="nogrow"
    >
      <BeatIcon
        v-for="(beat, index) in selected_section.beats"
        :key="index"
        :beat="beat"
        :section_idx="selected_section_idx"
        :num="index"
        :selected="index == selected_beat_idx"
        @click="selected_beat_idx = index"
      ></BeatIcon>
    </div>

    <div class="tool-bar">
      <button @click="addBeatAfterIndex(selected_section.beats.length - 1)">➕ Add Beat</button>
      <button @click="moveBeatUp(selected_beat_idx)">⬆️</button>
      <button @click="moveBeatDown(selected_beat_idx)">⬇️</button>
    </div>

    <div class="card flex-col" v-if="selected_beat">
      <header>
        <h2>Beat {{ selected_beat_idx }}</h2>
      </header>
      <div class="tool-bar">
        <button @click="deleteBeat(selected_beat_idx)">🗑</button>
        <button @click="playNewBeat(selected_section_idx, selected_beat_idx)">🎵</button>
      </div>

      <div class="flex-row">
        <div class="stacked-form card">
          <label for="divisions"
            >Divisions
            <input
              type="number"
              id="divisions"
              min="1"
              max="64"
              v-model="selected_beat.divisions"
            />
          </label>
        </div>

        <div class="card">
          <header>
            <h3>Melody</h3>
          </header>
          <div class="tool-bar">
            <button
              @click="selectMelodyColumn(i)"
              v-for="i in allMelodyColumns"
              :key="i"
              :class="{ highlight: selected_melody_column == i }"
            >
              {{ i }}
            </button>
          </div>
          <table border="1" v-if="selected_melody_data">
            <thead>
              <tr>
                <th>Division</th>
                <th>Duration</th>
                <th>Pitch</th>
                <th>Lyric</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(note, index) in selected_melody_data" :key="index">
                <td>
                  <button @click="note.position = 0">0</button>
                  <button @click="note.position = 1">1</button>
                  <button @click="note.position = 2">2</button>
                  <button @click="note.position = 3">3</button>

                  <input
                    type="number"
                    v-model="note.position"
                    class="w-6rem"
                    min="0"
                    @change="sortMelodyNotes()"
                    :max="(selected_beat?.divisions || 1) - 1"
                  />
                </td>
                <td>
                  <div class="flex-row">
                    <button @click="note.duration = 1">1/{{ selected_beat.divisions }}</button>

                    <button @click="note.duration = 2">2/{{ selected_beat.divisions }}</button>
                    <button @click="note.duration = 3">3/{{ selected_beat.divisions }}</button>
                    <button @click="note.duration = selected_beat.divisions">
                      {{ selected_beat.divisions }}/{{ selected_beat.divisions }}
                    </button>
                  </div>
                  <input type="number" min="1" :max="64" v-model="note.duration" class="w-6rem" />
                  <div>
                    Ends: {{ (note?.position || 0) + (note?.duration || 0) }}/{{
                      selected_beat.divisions
                    }}
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="128"
                    data-note-input="1"
                    v-model="note.pitch"
                    class="w-4rem"
                    @change="previewNote(note)"
                    @focus="setActiveNoteInput([note, $event.target])"
                  />
                  {{ TonalNote.get(TonalNote.fromMidi(note.pitch || 0)).name }}
                </td>
                <td>
                  <input type="text" v-model="note.lyric" class="w-12rem" />
                </td>
                <td>
                  <button @click="previewNote(note)">Preview</button>
                  <button @click="deleteMelodyNote(index)">🗑</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="tool-bar">
            <button @click="addMelodyNote">Add Note</button>
          </div>

          <PianoKeyboard></PianoKeyboard>
          <div>
            <h4>Chord Ideas</h4>
            <div class="flex-row">
              <span class="margin" v-for="i of getPossibleChords(selected_beat)" :key="i">{{
                i
              }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <header>
            <h3>Chord Changes</h3>
          </header>

          <table border="1">
            <thead>
              <tr>
                <th>Division</th>
                <th>Chord</th>
                <th>Inversion</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cc, index) in selected_beat.chordChanges" :key="index">
                <td>
                  <input
                    type="number"
                    v-model="cc.position"
                    class="w-4rem"
                    min="0"
                    :max="(selected_beat?.divisions || 1) - 1"
                    @change="sortChordChanges"
                  />
                </td>

                <td>
                  <input type="text" v-model="cc.chord" class="w-8rem" />
                  <ChordInfo :chord="cc.chord"></ChordInfo>
                </td>

                <td>
                  <input type="number" min="0" max="4" v-model="cc.inversion" class="w-4rem" />
                  <span v-if="cc.inversion == 0">Auto</span>
                </td>
                <td>
                  <div class="tool-bar">
                    <button @click="deleteChordChange(index)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="tool-bar">
            <button @click="addChordChange">Add Chord Change</button>
          </div>
        </div>

        <div class="card">
          <header>
            <h3>Loop Events</h3>
          </header>
          <p class="help">
            If fill length is 0, it will loop forever till stopped. Fills interrupt previous fills
            or loops, but non-fill loops on the same layer resume after.
          </p>

          <datalist id="loops">
            <option v-for="(_loop, key) in loopLibrary" :key="key" :value="key">{{ key }}</option>
            <option v-for="(_loop, key) in project.loops" :key="key" :value="key"></option>
          </datalist>

          <table border="1">
            <thead>
              <th>Division</th>
              <th>Action</th>
              <th>Loop</th>
              <th>Layer</th>
              <th>Fill Length(beats)</th>
              <th></th>
            </thead>
            <tbody>
              <tr v-for="(loop, index) in selected_beat.loopEvents || []" :key="index">
                <td>
                  <input
                    type="number"
                    v-model="loop.position"
                    class="w-4rem"
                    min="0"
                    :max="(selected_beat?.divisions || 1) - 1"
                    @change="sortLoopEvents"
                  />
                </td>
                <td>
                  <select v-model="loop.action" class="w-4rem">
                    <option value="start">Start</option>
                    <option value="stop">Stop</option>
                  </select>
                </td>
                <td>
                  <input type="text" v-model="loop.loop" class="w-18rem" list="loops" />
                </td>
                <td>
                  <input type="text" v-model="loop.layer" class="w-4rem" />
                </td>
                <td>
                  <input type="number" min="0" v-model="loop.fillLength" class="w-4rem" />
                </td>
                <td>
                  <button @click="deleteLoopEvent(index)">🗑</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="tool-bar">
            <button @click="addLoopEvent">Add Loop Event</button>
          </div>
        </div>

        <div class="card">
          <header>
            <h3>Propagated</h3>
          </header>
          {{ backtrackBeat(selected_section_idx, selected_beat_idx) }}
        </div>
      </div>
    </div>
  </div>
</template>

/* columns of 3*/
<style scoped>
.beats-grid-3 {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-auto-flow: column;
  width: max-content;
}

.beats-grid-4 {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr 1fr;
  grid-auto-flow: column;
  width: max-content;
}
</style>

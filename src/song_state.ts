import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { SongProject, Melody } from './song_interface'
import { Chord, Interval, Note } from 'tonal'
export const noteRangeEditiorStart = 48

export let activeNoteInput: [Melody[string][number], EventTarget | null] | null = null

export function setActiveNoteInput(v: [Melody[string][number], EventTarget | null]) {
  activeNoteInput = v
}
const project: Ref<SongProject> = ref<SongProject>({
  settings: {},
  sections: [],
  loops: {},
  tempo: 120,
  beatRows: 4,
  name: 'untitled_song',
})

const selected_section_idx: Ref<number> = ref(0)

const selected_section: ComputedRef<SongProject['sections'][number] | null> = computed(() => {
  if (selected_section_idx.value >= project.value.sections.length) {
    return null
  }
  return project.value.sections[selected_section_idx.value]
})

export function transposeSong(song: SongProject, delta: number) {
  const copy = JSON.parse(JSON.stringify(song))
  copy.sections.forEach((section: SongProject['sections'][number]) => {
    section.beats.forEach((beat) => {
      if (!beat?.melody) return
      for (const layer in beat.melody) {
        for (const note of beat.melody[layer]) {
          note.pitch = (note.pitch || 64) + delta
        }
      }
      for (const change of beat?.chordChanges || []) {
        const c = Chord.get(change.chord)

        if (!c) continue
        if (!c.tonic) {
          alert(`Chord ${change.chord} has no tonic, cannot transpose`)
          continue
        }
        const c2 = Chord.getChord(
          c.aliases[0],
          Note.transpose(c.tonic, Interval.fromSemitones(delta)),
          Note.transpose(c.bass, Interval.fromSemitones(delta)),
        )
        if (!c2) continue
        change.chord = c2.symbol.replace('M', '')
      }
    })
  })

  return copy
}

const exportSong = () => {
  const songData = JSON.stringify(project.value)
  const blob = new Blob([songData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (project.value.name || 'untitled_song') + '.songcad.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const importSong = (input: HTMLInputElement) => {
  const file = input.files?.[0]

  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result?.toString() || '')
      if (!data?.name) {
        data.name = 'untitled_song'
      }
      if (!data?.beatRows) {
        throw new Error('Invalid JSON file, no beatRows')
      }
      project.value = data
    } catch (error) {
      console.error('Invalid JSON file', error)
    }
  }
  reader.readAsText(file)
}

export { project, exportSong, importSong, selected_section_idx, selected_section }

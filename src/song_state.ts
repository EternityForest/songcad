import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { SongProject, Melody } from './song_interface'

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
})

const selected_section_idx: Ref<number> = ref(0)

const selected_section: ComputedRef<SongProject['sections'][number] | null> = computed(() => {
  if (selected_section_idx.value >= project.value.sections.length) {
    return null
  }
  return project.value.sections[selected_section_idx.value]
})

const exportSong = () => {
  const songData = JSON.stringify(project.value)
  const blob = new Blob([songData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'song.json'
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

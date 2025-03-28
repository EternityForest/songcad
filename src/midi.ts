import { Soundfont, getDrumMachineNames } from 'smplr'
import { CacheStorage } from 'smplr'
import { ref } from 'vue'
import type { ConcreteNote } from './song_interface'

const storage = new CacheStorage()

const context = new AudioContext()
const piano = new Soundfont(context, { instrument: 'acoustic_grand_piano', storage })
const flute = new Soundfont(context, { instrument: 'flute', storage })

export const currentBeat = ref(0)
export const currentSection = ref(0)

console.log(getDrumMachineNames())
const instruments: { [k: string]: Soundfont } = {
  piano: piano,
  flute: flute,
}

export function playNotes(notes: ConcreteNote[], bpm: number) {
  const stopper = []

  notes.sort((a, b) => a.start - b.start)
  async function f() {
    const startTime = new Date().getTime()

    for (const note of notes) {
      const noteStartMs = note.start
      const delay = noteStartMs - (new Date().getTime() - startTime)

      if (delay > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, delay)
        })
      }
      const instrument = instruments[note.instrument]

      currentBeat.value = note.beat || 0
      currentSection.value = note.section || 0
      instrument.start({
        note: note.pitch,
        duration: note.duration / 1000,
      })

      if (stopper.length > 0) {
        break
      }
    }
  }
  f()
  return () => {
    stopper.push(true)
  }
}
async function playNote(
  note: number,
  duration: number,
  _volume: number,
  instrument: string | number,
) {
  const player = instruments[instrument]
  if (player === undefined) {
    return
  }
  player.start(note)

  await new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
  player.stop(note)
}

export { piano, playNote }

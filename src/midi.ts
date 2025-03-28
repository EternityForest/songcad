import { Soundfont } from 'smplr'
import type { ConcreteNote } from './song_interface'

const context = new AudioContext()
const piano = new Soundfont(context, { instrument: 'acoustic_grand_piano' })
const flute = new Soundfont(context, { instrument: 'flute' })

const instruments: { [k: string]: Soundfont } = {
  piano: piano,
  flute: flute,
}

export function playNotes(notes: ConcreteNote[], bpm: number) {
  const stopper = []
  const startTime = new Date().getTime()

  async function f() {
    for (const note of notes) {
      const noteStartMs = note.start
      const delay = noteStartMs - (new Date().getTime() - startTime)

      if (delay > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, delay)
        })
      }
      playNote(note.pitch || 64, note.duration, note.volume, note.instrument)

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

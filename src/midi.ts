import { Soundfont } from 'smplr'
import type { ConcreteNote } from './song_interface'

const context = new AudioContext()
const piano = new Soundfont(context, { instrument: 'acoustic_grand_piano' })
const flute = new Soundfont(context, { instrument: 'marimba' })

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

import { Soundfont, DrumMachine } from 'smplr'
import { CacheStorage } from 'smplr'
import { ref } from 'vue'
import type { ConcreteNote } from './song_interface'

import { writeMidi } from 'midi-file'
import type { MidiData } from 'midi-file'

const instrument_to_gm = {
  piano: 1,
  flute: 74,
}
function notesToMidi(notes: ConcreteNote[], bpm: number) {
  const tracks_by_name: { [k: string]: MidiData['tracks'][number] } = {
    drum: [],
  }

  const track_number_by_name: { [k: string]: number } = {
    drum: 10,
  }

  const timePerBeat = 60000 / bpm
  for (const note of notes) {
    if (!tracks_by_name[note.instrument]) {
      tracks_by_name[note.instrument] = []
      track_number_by_name[note.instrument] = Object.keys(tracks_by_name).length

      tracks_by_name[note.instrument].push({
        deltaTime: 0,
        channel: 0,
        type: 'programChange',
        programNumber: 1,
      })
    }

    tracks_by_name[note.instrument].push({
      type: 'noteOn',
      deltaTime: note.start,
      noteNumber: note.pitch,
      velocity: note.volume,
      channel: track_number_by_name[note.instrument],
    })

    tracks_by_name[note.instrument].push({
      type: 'noteOff',
      deltaTime: note.start + note.duration,
      noteNumber: note.pitch,
      velocity: 0,
      channel: track_number_by_name[note.instrument],
    })
  }

  const tracks: MidiData['tracks'][number][] = []
  for (const name in tracks_by_name) {
    tracks.push(tracks_by_name[name])
  }

  const midi = writeMidi({
    tracks: tracks,
    header: {
      format: 1,
      numTracks: tracks.length,
      ticksPerBeat: 60000 / bpm,
    },
  })
  return midi
}

const context = new AudioContext()
const piano = new Soundfont(context, { instrument: 'acoustic_grand_piano', storage })
const flute = new Soundfont(context, { instrument: 'synth_drum', storage })
const drum = new DrumMachine(context, { storage })

export const currentBeat = ref(0)
export const currentSection = ref(0)

console.log(drum.getSampleNames())
const instruments: { [k: string]: Soundfont } = {
  piano: piano,
  flute: flute,
}

const drumMap = {
  36: 'kick',
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

import { Soundfont, DrumMachine } from 'smplr'
import { CacheStorage } from 'smplr'

import { ref } from 'vue'
import type { ConcreteNote } from './song_interface'

//import { Midi, Track } from '@tonejs/midi'
import { Midi } from './Midi/Midi'
import { Track } from './Midi/Track'
import { playMidi, stopMidi } from './ssmid.js'
const instrument_to_gm: { [key: string]: number } = {
  piano: 1,
  flute: 74,
}

export const currentBeat = ref(0)
export const currentSection = ref(0)

export function stopPlayback() {
  stopMidi()
}
function notesToMidi(notes: ConcreteNote[]): ArrayBuffer {
  const midi = new Midi()

  const by_track: { [key: string]: Track } = {}

  for (const note of notes) {
    if (!by_track[note.instrument]) {
      by_track[note.instrument] = midi.addTrack()
      if (instrument_to_gm[note.instrument]) {
        by_track[note.instrument].instrument.number = instrument_to_gm[note.instrument] || 0
        by_track[note.instrument].name = note.instrument.toString()
      }
      if (note.instrument === 'drums') {
        by_track[note.instrument].channel = 9
        by_track[note.instrument].name = 'drums'
        by_track[note.instrument].instrument.number = 1
        // by_track[note.instrument].addCC({
        //   number: 0,
        //   value: 120,
        //   time: 0,
        // })
        // by_track[note.instrument].addCC({
        //   number: 32,
        //   value: 0,
        //   time: 0,
        // })
      } else {
        by_track[note.instrument].channel = Object.keys(instrument_to_gm).length
      }
    }
    const track = by_track[note.instrument]

    track.addNote({
      midi: note.pitch,
      velocity: note.volume,
      time: note.start / 1000,
      duration: note.duration / 1000,
    })
  }

  const buf = new Uint8Array(midi.toArray())

  // download

  // const blob = new Blob([buf.buffer], { type: 'audio/midi' })
  // const url = URL.createObjectURL(blob)
  // const a = document.createElement('a')
  // a.href = url
  // a.download = 'song.mid'
  // document.body.appendChild(a)
  // a.click()
  // document.body.removeChild(a)
  return buf.buffer
}

export function playNotes(notes: ConcreteNote[]) {
  const midi = notesToMidi(notes)
  playMidi(midi)
}

export function testNote(pitch: number, instrument: string) {
  const note: ConcreteNote = {
    pitch: pitch,
    instrument: instrument,
    duration: 0.5,
    volume: 1,
    start: 0,
  }
  playNotes([note])
}

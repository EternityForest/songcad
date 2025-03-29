import { Voicing, Note as TonalNote, Chord } from 'tonal'
import VoicingDictionary from '@tonaljs/voicing-dictionary'

import type { ConcreteNote, SongProject } from './song_interface'
import { parse } from 'vue/compiler-sfc'

/* An abstract note is a description like "the root of the chord, played between C2 and C4"
It exists to specify loop patterns independently of the actual notes,
so we can separate chord logic from loop pattern logic
*/
export interface AbstractNote {
  pitch: number
  duration: number
  volume?: number
  start: number
  // The range of notes to resolve this abstratct note
  range?: string[]
  loopLayer?: string
  loopName?: string
  octave?: number
  ignoreInversion?: boolean

  // Don't remap the pitch, it's midi drumming
  noRemapping?: boolean
}

function getVoicing(chord: string, range: string, inversion: number) {
  const neededNotes = Chord.get(chord).notes
  const startingNote = neededNotes[inversion]
  const notes: number[] = []

  const start = TonalNote.midi(TonalNote.get(range) || 0) || 16

  let foundStart = false
  for (let i = start; i < start + 48; i++) {
    const pitchClass = TonalNote.get(TonalNote.fromMidi(i)).pc
    if (pitchClass === startingNote) {
      foundStart = true
    }

    if (foundStart) {
      if (neededNotes.includes(pitchClass)) {
        notes.push(i)
      }
    }
  }
  return notes
}
/*Given an abstract note and a chord, resolve it to a concrete note*/
export function resolveAbstractNote(
  note: AbstractNote,
  chord: string,
  instrument: string,
): ConcreteNote {
  let p = note.pitch
  if (!(note.noRemapping || instrument === 'drums')) {
    let voicing: number[] = []

    if (note.ignoreInversion) {
      voicing = getVoicing(chord, note?.range?.[0] || 'C3', 0)
    } else {
      voicing = getVoicing(chord, note?.range?.[0] || 'C3', 0)
    }
    // Make four note patterns work anyway
    if (voicing.length === 2) {
      voicing.push(voicing[1])
    }
    if (voicing.length === 3) {
      voicing.push(voicing[0] + 12)
    }

    p = voicing[note.pitch]
  } else {
    p = parseInt(p.toString())
  }
  const resolvedNote: ConcreteNote = {
    pitch: p,
    instrument: instrument,
    duration: note.duration,
    volume: note.volume || 1,
    start: note.start,
  }

  if (note.octave !== undefined) {
    resolvedNote.pitch += note.octave * 12
  }
  return resolvedNote
}

export function renderConfiguredLoop(
  loopinfo: SongProject['loops'][string],
  beatOffset: number,
  beatPosition: number,
): AbstractNote[] {
  const notes: AbstractNote[] = []
  const wrapped = beatPosition % loopinfo.length

  for (const note of loopinfo.data) {
    const noteStart = note.start / loopinfo.divisions
    const noteLength = note.duration / loopinfo.divisions

    if (noteStart >= wrapped && noteStart < wrapped + 1) {
      notes.push({
        pitch: note.note,
        duration: noteLength,
        volume: note.volume,
        start: (noteStart - wrapped) + beatOffset,
        range: [
          note.rangeMin,
          TonalNote.fromMidi((TonalNote.midi(TonalNote.get(note.rangeMin) || 'C3') || 0) + 12 + 10),
        ],
        octave: note.octave,
        loopLayer: loopinfo.instrument,
      })
    }
  }
  return notes
}

/* Split a list of notes at a split point, splitting individual notes if needed */
export function splitAbstractNotes(notes: AbstractNote[], splitPoint: number): AbstractNote[][] {
  const before = []
  const after = []

  for (const note of notes) {
    if (note.start < splitPoint && note.start + note.duration < splitPoint) {
      before.push(note)
    } else if (note.start >= splitPoint) {
      if (note.start < splitPoint + note.duration) {
        note.duration = note.start + note.duration - splitPoint
        note.start = splitPoint
      } else {
        const note1 = {
          pitch: note.pitch,
          duration: splitPoint - note.start,
          volume: note.volume,
          start: note.start,
          range: note.range,
        }
        const note2 = {
          pitch: note.pitch,
          duration: note.start + note.duration - splitPoint,
          volume: note.volume,
          start: splitPoint,
          range: note.range,
        }
        before.push(note1)
        after.push(note2)
      }
    }
  }
  return [before, after]
}

/**
 * Beatoffset is the exact position to start rendering at
 * Beatposition is how far into the the loop we are since loops don't have to
 * start on beats
 */
export interface loopFunction {
  (beatOffset: number, beatPosition: number, args: string): AbstractNote[]
}

export interface LoopData {
  f: loopFunction
  instrument: string
  defaultLayer: string
}

export const loopLibrary: { [k: string]: LoopData } = {}

loopLibrary['whole-note-block'] = {
  instrument: 'piano',
  defaultLayer: 'piano',
  f: (beatOffset: number, beatPosition: number, args: string) => {
    if (beatPosition - Math.floor(beatPosition) > 0.001) {
      return []
    }
    const notes: AbstractNote[] = [
      {
        pitch: 0,
        duration: 1,
        volume: 0.6,
        start: beatOffset,
        range: ['C2', 'C3'],
      },
      {
        pitch: 1,
        duration: 1,
        volume: 0.5,

        start: beatOffset,
        range: ['C2', 'C4'],
        octave: 1,
      },
      {
        pitch: 0,
        duration: 1,
        volume: 0.5,

        start: beatOffset,
        range: ['C3', 'G5'],
      },
      {
        pitch: 1,
        duration: 1,
        volume: 0.5,

        start: beatOffset,
        range: ['C3', 'G5'],
      },
      {
        pitch: 2,
        duration: 1,
        volume: 0.4,

        start: beatOffset,
        range: ['C3', 'G5'],
      },
      {
        pitch: 3,
        duration: 1,
        volume: 0.4,
        start: beatOffset,
        range: ['C3', 'G5'],
        octave: 1,
      },
    ]
    return notes
  },
}

loopLibrary['just-root-piano'] = {
  instrument: 'piano',
  defaultLayer: 'piano',
  f: (beatOffset: number, beatPosition: number, args: string) => {
    if (beatOffset - Math.floor(beatOffset) > 0.0001) {
      return []
    }
    const notes: AbstractNote[] = [
      {
        pitch: 0,
        duration: 0.97,
        start: beatOffset,
        range: ['C2', 'G3'],
      },
    ]
    return notes
  },
}

import { Voicing, Note as TonalNote } from 'tonal'
import VoicingDictionary from '@tonaljs/voicing-dictionary'

import type { ConcreteNote, SongProject } from './song_interface'
import { parse } from 'vue/compiler-sfc'

/* An abstract note is a description like "the root of the chord, played between C2 and C4"
It exists to specify loop patterns independently of the actual notes,
so we can separate chord logic from loop pattern logic
*/
export interface AbstractNote {
  // If string, can be root, 1st, 2nd, 3rd, 4th to refer to the non inverted chord notes
  // or a number to index into the inversion.
  pitch: string | number
  duration: number
  volume?: number
  start: number
  // The range of notes to resolve this abstratct note
  range?: string[]
  loopLayer?: string
  loopName?: string
}

/*Given an abstract note and a chord, resolve it to a concrete note*/
export function resolveAbstractNote(
  note: AbstractNote,
  chord: string,
  instrument: string,
): ConcreteNote {
  const voicing = Voicing.get(chord, note.range || ['C3', 'C5'], VoicingDictionary.all)
  const uninverted = Voicing.get(chord, note.range || ['C3', 'C5'], VoicingDictionary.all)

  const pitches: number[] = voicing.map((n: string) => {
    const n2 = TonalNote.get(n)
    return TonalNote.midi(n2) || 64
  })

  const uninvertedPitches: number[] = uninverted.map((n: string) => {
    const n2 = TonalNote.get(n)
    return TonalNote.midi(n2) || 64
  })

  const p = note.pitch
  const resolvedNote: ConcreteNote = {
    pitch: 0,
    instrument: instrument,
    duration: note.duration,
    volume: note.volume || 1,
    start: note.start,
  }
  if (p === 'root') {
    resolvedNote.pitch = uninvertedPitches[0]
  } else if (p === '1st') {
    resolvedNote.pitch = uninvertedPitches[0]
  } else if (p === '2nd') {
    resolvedNote.pitch = uninvertedPitches[1]
  } else if (p === '3rd') {
    resolvedNote.pitch = uninvertedPitches[2]
  } else if (p === '4th') {
    resolvedNote.pitch = uninvertedPitches[3]
  } else if (typeof p === 'number') {
    resolvedNote.pitch = pitches[p]
  } else {
    // Error fallback
    if (pitches[parseInt(p)]) {
      resolvedNote.pitch = pitches[parseInt(p)]
    } else {
      resolvedNote.pitch = pitches[0]
    }
  }
  return resolvedNote
}

export function renderConfiguredLoop(
  loopinfo: SongProject['loops'][string],
  beatOffset: number,
): AbstractNote[] {
  const notes: AbstractNote[] = []
  const wrapped = beatOffset % loopinfo.length

  for (const note of loopinfo.data) {
    if (note.start >= wrapped && note.start < wrapped + 1) {
      notes.push({
        pitch: note.note,
        duration: note.duration,
        volume: note.volume,
        start: note.start - wrapped + beatOffset,
        range: [note.rangeMin, note.rangeMax],
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

export interface loopFunction {
  (beatOffset: number, args: string): AbstractNote[]
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
  f: (beatOffset: number, args: string) => {
    if (beatOffset - Math.floor(beatOffset) > 0.0001) {
      return []
    }
    const notes: AbstractNote[] = [
      {
        pitch: 'root',
        duration: 1,
        start: beatOffset,
        range: ['C2', 'C3'],
      },
      {
        pitch: 'root',
        duration: 1,
        start: beatOffset,
        range: ['C3', 'C4'],
      },
      {
        pitch: 'root',
        duration: 1,
        start: beatOffset,
        range: ['C4', 'G5'],
      },
      {
        pitch: 1,
        duration: 1,
        start: beatOffset,
        range: ['C4', 'G5'],
      },
      {
        pitch: 2,
        duration: 1,
        volume: 1,
        start: beatOffset,
        range: ['C4', 'G5'],
      },
      {
        pitch: 2,
        duration: 1,
        volume: 1,
        start: beatOffset,
        range: ['C4', 'G5'],
      },
    ]
    return notes
  },
}

loopLibrary['just-root-piano'] = {
  instrument: 'piano',
  defaultLayer: 'piano',
  f: (beatOffset: number, args: string) => {
    if (beatOffset - Math.floor(beatOffset) > 0.0001) {
      return []
    }
    const notes: AbstractNote[] = [
      {
        pitch: 'root',
        duration: 0.97,
        start: beatOffset,
        range: ['C2', 'G3'],
      },
    ]
    return notes
  },
}

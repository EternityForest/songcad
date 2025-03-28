import { Chord } from 'tonal'
export const chromatic_scale = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab']

const commonChordTypes = ['', 'min', 'sus4', 'sus2', '7sus4', 'min7', '7']

export const commonChords: { [k: string]: string[] } = {}

for (const i of chromatic_scale) {
  for (const j of commonChordTypes) {
    const chord = i + j
    commonChords[chord] = Chord.get(chord).notes
  }
}

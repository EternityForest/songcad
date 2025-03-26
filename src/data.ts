import { Chord } from 'tonal'
import VoicingDictionary from '@tonaljs/voicing-dictionary'

export const chromatic_scale = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab']

const commonChordTypes = ['', 'min', 'sus4', 'sus2', '7sus4', 'min7', '7']

export const commonChords: { [k: string]: string[] } = {}

for (const i of chromatic_scale) {
  for (const j of commonChordTypes) {
    const chord = i + j
    commonChords[chord] = Chord.get(chord).notes
  }
}

VoicingDictionary.all['sus2'] = ['1P 2M P5', '2M P5 1P', 'P5 1P 2M']

VoicingDictionary.all['sus4'] = ['1P 4p P5', '4p P5 1P', 'P5 4P 2M']

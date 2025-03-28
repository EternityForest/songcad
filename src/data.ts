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

export const midiToDrumName: { [k: number]: string } = {
  35: 'Acoustic Bass Drum or Low Bass Drum',
  36: 'Electric Bass Drum or High Bass Drum',
  37: 'Side Stick',
  38: 'Acoustic Snare',
  39: 'Hand Clap',
  40: 'Electric Snare or Rimshot',
  41: 'Low Floor Tom',
  42: 'Closed Hi-hat',
  43: 'High Floor Tom',
  44: 'Pedal Hi-hat',
  45: 'Low Tom',
  46: 'Open Hi-hat',
  47: 'Low-Mid Tom',
  48: 'High-Mid Tom',
  49: 'Crash Cymbal 1',
  50: 'High Tom',
  51: 'Ride Cymbal 1',
  52: 'Chinese Cymbal',
  53: 'Ride Bell',
  54: 'Tambourine',
  55: 'Splash Cymbal',
  56: 'Cowbell',
  57: 'Crash Cymbal 2',
  58: 'Vibraslap',
  59: 'Ride Cymbal 2',
  60: 'High Bongo',
  61: 'Low Bongo',
  62: 'Mute High Conga',
  63: 'Open High Conga',
  64: 'Low Conga',
  65: 'High Timbale',
  66: 'Low Timbale',
  67: 'High Agogô',
  68: 'Low Agogô',
  69: 'Cabasa',
  70: 'Maracas',
  71: 'Short Whistle',
  72: 'Long Whistle',
  73: 'Short Güiro',
  74: 'Long Güiro',
  75: 'Claves',
  76: 'High Woodblock',
  77: 'Low Woodblock',
  78: 'Mute Cuíca',
  79: 'Open Cuíca',
  80: 'Mute Triangle',
  81: 'Open Triangle',
}

// import the modules
import { Sequencer } from 'spessasynth_lib/sequencer/sequencer'
import { Synthetizer } from 'spessasynth_lib/synthetizer/synthetizer.js'
import { WORKLET_URL_ABSOLUTE } from 'spessasynth_lib/synthetizer/worklet_url.js'

import { writeMidi } from 'midi-file'

let midiPlayer = null

export let runningSeq = null

export function playMidi(midi) {
  if (midiPlayer) {
    midiPlayer(midi)
  }
}

export function stopMidi() {
  if (runningSeq) {
    runningSeq.stop()
  }
}

// load the soundfont
fetch('/Baby_font_for_musescore.sf3').then(async (response) => {
  // load the soundfont into an array buffer
  const soundFontArrayBuffer = await response.arrayBuffer()
  const context = new AudioContext() // create an audioContext
  await context.audioWorklet.addModule(
    new URL('/node_modules/spessasynth_lib/' + WORKLET_URL_ABSOLUTE, import.meta.url),
  ) // add the worklet
  const synth = new Synthetizer(context.destination, soundFontArrayBuffer) // create the synthetizer

  midiPlayer = async (midiFile) => {
    const seq = new Sequencer([{ binary: midiFile }], synth) // create the sequencer
    seq.loop = false
    seq.play()
    runningSeq = seq
  }
})

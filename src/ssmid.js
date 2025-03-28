// import the modules
import { Sequencer } from 'spessasynth_lib/sequencer/sequencer'
import { Synthetizer } from 'spessasynth_lib/synthetizer/synthetizer.js'
import { WORKLET_URL_ABSOLUTE } from 'spessasynth_lib/synthetizer/worklet_url.js'

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

export function startAudioContext() {
  // load the soundfont
  fetch('./Baby_font_for_musescore.sf3').then(async (response) => {
    // load the soundfont into an array buffer
    const soundFontArrayBuffer = await response.arrayBuffer()
    const context = new AudioContext() // create an audioContext
    await context.audioWorklet.addModule("./worklet_processor.min.js") // add the worklet
    const synth = new Synthetizer(context.destination, soundFontArrayBuffer) // create the synthetizer

    midiPlayer = async (midiFile) => {
      const seq = new Sequencer([{ binary: midiFile }], synth, {
        skipToFirstNoteOn: false,
        autoPlay: true,
        preservePlaybackState: false,
      }) // create the sequencer
      seq.loop = false
      seq.play()
      runningSeq = seq
    }
  })
}

startAudioContext()
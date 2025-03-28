import { project } from './song_state'
import type { SongProject, ConcreteNote, LoopEvent } from './song_interface'
import { playNote } from './midi'
import { loopLibrary, resolveAbstractNote } from './loops'
import type { AbstractNote } from './loops'
import { Chord, note } from 'tonal'
/*This function takes a beat index and section index and looks backwards through all
the chord changes to find the chord at the start of the beat, and any loops that
were activated at the start of the beat.
*/

function divisionsToMs(
  section: SongProject['sections'][number],
  beat: SongProject['sections'][number]['beats'][number],
  divisions: number,
) {
  const ms_per_whole = 60000 / (section?.tempo || 120)
  return ms_per_whole * (divisions / (beat?.divisions || 4))
}

async function playNewBeat(section_idx: number, beat_idx: number) {
  const beat = project.value.sections[section_idx].beats[beat_idx]

  // Iterate divisions
  for (let i = 0; i < (beat?.divisions || 0); i++) {
    if (beat.melody !== undefined) {
      for (const layer in beat.melody) {
        for (const note of beat.melody[layer]) {
          if (note.position === i) {
            playNote(
              note?.pitch || 0,
              divisionsToMs(project.value.sections[section_idx], beat, note?.duration || 0),
              note?.volume || 0,
              layer,
            )
          }
        }
      }
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 200)
    })
  }
}

function countBeatsBetween(
  section_idx: number,
  beat_idx: number,
  end_section_idx: number,
  end_beat_idx: number,
) {
  let count = 0
  for (
    let section_idx_pointer = section_idx;
    section_idx_pointer <= end_section_idx;
    section_idx_pointer++
  ) {
    const section = project.value.sections[section_idx_pointer]
    for (
      let beat_idx_pointer = beat_idx;
      beat_idx_pointer < section.beats.length;
      beat_idx_pointer++
    ) {
      count++
      if (section_idx_pointer === end_section_idx && beat_idx_pointer === end_beat_idx) {
        break
      }
    }
  }
  return count
}

function findNoteCutOff(
  inputNote: AbstractNote,
  project: SongProject,
  section_idx: number,
  beat_idx: number,
): number {
  const bpm = project.sections[section_idx].tempo
  let beatCount = inputNote.start

  const inputNoteEnd = inputNote.start + inputNote.duration

  for (
    let section_idx_pointer = section_idx;
    section_idx_pointer < project.sections.length;
    section_idx_pointer++
  ) {
    if (project.sections[section_idx_pointer].tempo !== bpm) {
      return beatCount
    }

    for (let i = beat_idx; i < project.sections[section_idx].beats.length; i++) {
      const beat = project.sections[section_idx].beats[i]
      if (beat.chordChanges !== undefined) {
        for (const change of beat.chordChanges) {
          const pos_in_whole_notes = change.position / (beat.divisions || 4) + beatCount
          if (pos_in_whole_notes > inputNote.start && pos_in_whole_notes < inputNoteEnd) {
            return pos_in_whole_notes
          }
        }
      }

      if (beat.loopEvents !== undefined) {
        for (const loopEvent of beat.loopEvents) {
          const pos_in_whole_notes = loopEvent.position / (beat.divisions || 4) + beatCount
          if (
            (loopEvent.loop == '' && loopEvent.layer == inputNote.loopLayer) ||
            loopEvent.loop == inputNote.loopName
          ) {
            if (pos_in_whole_notes > inputNote.start && pos_in_whole_notes < inputNoteEnd) {
              return pos_in_whole_notes
            }
          }
        }
      }
      beatCount++
      if (beatCount >= inputNoteEnd) {
        return inputNoteEnd
      }
    }
  }
  return inputNoteEnd
}

/* Render a song into a list of notes grouped by section then beat */
export function renderSong(
  song: SongProject,
  startSection: number,
  startBeat: number,
): ConcreteNote[][][] {
  const outputSections: ConcreteNote[][][] = []

  const state = backtrackBeat(startSection, startBeat)
  const activeNotes: AbstractNote[] = []

  const lastBeatsNotes: AbstractNote[] = []

  let beatCounter = 0
  let beatMsCounter = 0

  function cleanOldNotes(position: number) {
    for (let i = activeNotes.length - 1; i >= 0; i--) {
      if (activeNotes[i].start + activeNotes[i].duration <= position) {
        activeNotes.splice(i, 1)
      }
    }
  }

  for (let section_idx = 0; section_idx < song.sections.length; section_idx++) {
    const outputSection: ConcreteNote[][] = []
    outputSections.push(outputSection)
    const timePerBeat = 60000 / (song.sections[section_idx].tempo || 120)
    for (let beat_idx = 0; beat_idx < song.sections[section_idx].beats.length; beat_idx++) {
      const outputBeat: ConcreteNote[] = []
      outputSection.push(outputBeat)

      // No need to compute anything before start point
      if (section_idx < startSection || (section_idx === startSection && beat_idx < startBeat)) {
        continue
      }
      const beat = song.sections[section_idx].beats[beat_idx]

      if (beat.melody !== undefined) {
        for (const layer in beat.melody) {
          for (const note of beat.melody[layer]) {
            outputBeat.push({
              pitch: note.pitch || 64,
              duration: ((note.duration || 0.25) / (beat.divisions || 4)) * timePerBeat,
              volume: note.volume || 1,
              start: beatMsCounter + ((note.position || 0) / (beat.divisions || 4)) * timePerBeat,
              instrument: layer,
            })
          }
        }
      }

      const chordChanges: { [k: number]: string } = {}
      const loopEventsByPosition: { [k: number]: LoopEvent[] } = {}

      if (beat.chordChanges !== undefined) {
        for (const change of beat.chordChanges) {
          chordChanges[change.position] = change.chord
        }
      }

      if (beat.loopEvents !== undefined) {
        for (const loopEvent of beat.loopEvents) {
          if (loopEventsByPosition[loopEvent.position] === undefined) {
            loopEventsByPosition[loopEvent.position] = []
          }
          loopEventsByPosition[loopEvent.position].push(loopEvent)
        }
      }

      for (let divisionIndex = 0; divisionIndex < (beat.divisions || 4); divisionIndex++) {
        if (chordChanges[divisionIndex] !== undefined) {
          state.chord = chordChanges[divisionIndex]
        }
        const loopEventsThisDivision = loopEventsByPosition[divisionIndex] || []

        for (const loopEvent of loopEventsThisDivision) {
          if (loopEvent.action === 'start') {
            state.loops.push({
              loop: loopEvent.loop || '',
              layer: loopEvent.layer || '',
              startBeat: beatCounter + divisionIndex / (beat.divisions || 4),
            })
          } else if (loopEvent.action === 'stop') {
            // Either matching layer and no loop name or matching loop name can remove it
            state.loops = state.loops.filter(
              (loop) =>
                !(
                  loop.loop !== loopEvent.loop &&
                  (loopEvent.layer == '' || loopEvent.layer == loop.layer)
                ) || !(loop.layer !== loopEvent.layer && loopEvent.loop == ''),
            )
          } else if (loopEvent.action === 'fill') {
            state.fills[loopEvent.layer || ''] = {
              loop: loopEvent.loop || '',
              layer: loopEvent.layer || '',
              remaining: loopEvent.fillLength || 0,
              startBeat: beatCounter + divisionIndex / (beat.divisions || 4),
            }
          }
        }

        // Decrement all the fills, remove any that are done
        for (const layer in state.fills) {
          state.fills[layer].remaining -= timePerBeat
          if (state.fills[layer].remaining <= 0) {
            delete state.fills[layer]
          }
        }

        if (divisionIndex == 0 || loopEventsThisDivision.length > 0) {
          // Loop over all the active loops and add any notes from them
          for (const loop of state.loops) {
            const loopType = loop.loop.split(':')[0]
            const loopData = loopLibrary[loopType]
            const beats_into_loop = beatCounter - loop.startBeat
            const notes = loopData.f(beats_into_loop, loop.loop.split(':')[1] || '')

            for (const note of notes) {
              const res_note = resolveAbstractNote(note, state.chord, loopData.instrument)
              res_note.duration *= timePerBeat

              //Get the time relative to the current beat, since out input
              // scale was relative to the loop start
              res_note.start -= beats_into_loop

              // Millisecond scale and convert to absolute
              res_note.start *= timePerBeat

              // Add abs time of the start of this beat
              res_note.start += beatMsCounter

              outputBeat.push(res_note)
            }
          }
        }
      }

      beatCounter++
      beatMsCounter += 60000 / (song.sections[section_idx].tempo || 120)
    }
  }
  return outputSections
}

export function flattenNotes(notes: ConcreteNote[][][]): ConcreteNote[] {
  const output: ConcreteNote[] = []
  for (const section of notes) {
    for (const beat of section) {
      for (const note of beat) {
        output.push(note)
      }
    }
  }
  return output
}
class PlayerState {}

function backtrackBeat(section_idx: number, beat_idx: number) {
  const loops: {
    loop: string
    layer: string
    // Absolute beat rel to song start
    startBeat: number
  }[] = []

  const fills: {
    [k: string]: {
      loop: string
      layer: string
      startBeat: number
      // Remaining as of the input beat position
      remaining: number
    }
  } = {}
  let chord = ''

  let beatCounter = 0

  for (let section_idx_pointer = 0; section_idx_pointer <= section_idx; section_idx_pointer++) {
    const section = project.value.sections[section_idx_pointer]

    for (let beat_idx_pointer = 0; beat_idx_pointer < section.beats.length; beat_idx_pointer++) {
      if (section_idx_pointer === section_idx && beat_idx_pointer === beat_idx) {
        break
      }

      const beat = section.beats[beat_idx_pointer]

      if (beat.chordChanges !== undefined) {
        const chordChangesCopy: SongProject['sections'][number]['beats'][number]['chordChanges'] =
          JSON.parse(JSON.stringify(beat.chordChanges))
        if (chordChangesCopy !== undefined) {
          chordChangesCopy.sort((a, b) => b?.position - a?.position)
          for (const change of beat.chordChanges) {
            chord = change.chord
          }
        }
      }

      if (beat.loopEvents !== undefined) {
        for (const loop of beat.loopEvents) {
          if (loop !== undefined && loop.action !== undefined && loop.loop !== undefined) {
            if (loop.action === 'start') {
              if (loop.loop !== undefined) {
                continue
              }
              // Zero fill length is what determines just a normal loop
              if (loop?.fillLength || 0 < 1) {
                if (!loops.includes(loop.loop)) {
                  loops.push({
                    loop: loop.loop,
                    layer: loop.layer || '',
                    startBeat: beatCounter + loop.position / (beat.divisions || 4),
                  })
                }
              } else {
                const fillCount =
                  (loop?.fillLength || 1) -
                  countBeatsBetween(section_idx_pointer, beat_idx_pointer, section_idx, beat_idx)

                if (fillCount >= 0) {
                  fills[loop.loop] = {
                    loop: loop.loop,
                    layer: loop.layer || '',
                    remaining: fillCount,
                    startBeat: beatCounter + loop.position / (beat.divisions || 4),
                  }
                }
              }
            }
          }
        }
      }
      beatCounter++
    }
  }
  return {
    chord: chord,
    loops: loops,
    fills: fills,
  }
}

export { playNewBeat, backtrackBeat }

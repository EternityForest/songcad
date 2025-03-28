/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface ConcreteNote {
  pitch: number
  instrument: number | string
  duration: number
  volume: number
  start: number
  source_id?: string | number

  beat?: number
  section?: number
}

export interface LoopEvent {
  /**
   * One of the midi loops
   */
  loop?: string
  /**
   * Loop action
   */
  action: 'start' | 'stop' | 'fill'
  /**
   * How many beats the fill should last.  If 0, it's not a fill
   */
  fillLength?: number
  /**
   * Layer name
   */
  layer?: string
  /**
   * On which loop division the event should happen
   */
  position: number
  [k: string]: unknown
}
export interface Melody {
  [k: string]: {
    /**
     * Position in divisions
     */
    position?: number
    /**
     * Note number
     */
    pitch?: number
    /**
     * Note volume
     */
    volume?: number
    /**
     * Note duration as float whole notes
     */
    duration?: number
    lyric?: string
    [k: string]: unknown
  }[]
}

export interface SongProject {
  /**
   * Number of rows in the UI beat grid
   */
  beatRows: number
  loops: {
    [k: string]: {
      instrument: string
      length: number
      divisions: number
      data: {
        /**
         * Note number
         */
        note: number
        ignoreInversion?: boolean
        /**
         * Note volume
         */
        volume?: number
        /**
         * Note duration as divisions
         */
        duration: number
        start: number
        octave?: number

        /** Range of notes to resolve within */
        rangeMin: string
        rangeMax: string
      }[]
    }
  }
  sections: {
    /**
     * Opaque UID
     */
    id: string
    /**
     * Section name
     */
    name: string
    /**
     * BPM
     */
    tempo?: number
    beats: {
      /**
       * The chord that was happening when this beat started
       */
      propagatedChordCache?: string
      /**
       * The loops that were happening when this beat started
       */
      propagatedLoopCache?: {
        loop?: string
        layer?: string
        [k: string]: unknown
      }[]
      /**
       * Fills are indexed by layer.
       */
      propagatedFillCache?: {
        [k: string]: {
          loop?: string
          layer?: string
          /**
           * After this one, how many beats till the fill ends
           */
          beats?: number
          [k: string]: unknown
        }
      }
      /**
       * Divisions for this beat
       */
      divisions?: number
      chordChanges?: {
        chord: string
        inversion?: string
        /**
         * Change duration in divisions
         */
        position: number
        [k: string]: unknown
      }[]
      melody?: Melody
      loopEvents?: LoopEvent[]
      [k: string]: unknown
    }[]
    [k: string]: unknown
  }[]
  [k: string]: unknown
}

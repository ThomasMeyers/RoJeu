/** Staging applied to a beat on top of the plain typewriter reveal. */
export type StoryBeatEffect = 'shake' | 'punchline';

export interface StoryBeat {
  /** Stable technical ID, independent from the displayed wording. */
  id: string;
  text: string;
  effect?: StoryBeatEffect;
  /**
   * Word whose first letter fires the effect once the typewriter reaches it.
   * Without one, the effect fires as soon as the beat starts.
   */
  effectTrigger?: string;
}

export interface StorySequenceState {
  beatIndex: number;
  revealedChars: number;
  charAccumulatorMs: number;
}

/** What a player input did: completed the current line, moved on, or ended the story. */
export type StoryAdvanceResult = 'revealed' | 'next' | 'finished';

export const createStorySequence = (): StorySequenceState => ({
  beatIndex: 0,
  revealedChars: 0,
  charAccumulatorMs: 0,
});

export const getCurrentBeat = (state: StorySequenceState, beats: readonly StoryBeat[]): StoryBeat =>
  beats[Math.min(state.beatIndex, beats.length - 1)];

/** Punchlines skip the typewriter: they are shown whole and faded in by the renderer. */
export const isBeatFullyRevealed = (
  state: StorySequenceState,
  beats: readonly StoryBeat[],
): boolean => {
  const beat = getCurrentBeat(state, beats);
  return beat.effect === 'punchline' || state.revealedChars >= beat.text.length;
};

/** Falls back to "reached" when the trigger is absent or missing from the text. */
export const isEffectTriggerReached = (
  state: StorySequenceState,
  beats: readonly StoryBeat[],
): boolean => {
  const beat = getCurrentBeat(state, beats);
  const triggerIndex = beat.effectTrigger ? beat.text.indexOf(beat.effectTrigger) : -1;
  return (
    triggerIndex < 0 || isBeatFullyRevealed(state, beats) || state.revealedChars > triggerIndex
  );
};

export const tickTypewriter = (
  state: StorySequenceState,
  beats: readonly StoryBeat[],
  deltaMs: number,
  msPerChar: number,
): void => {
  if (isBeatFullyRevealed(state, beats)) {
    return;
  }

  state.charAccumulatorMs += Math.max(0, deltaMs);
  const newChars = Math.floor(state.charAccumulatorMs / msPerChar);
  if (newChars === 0) {
    return;
  }

  state.charAccumulatorMs -= newChars * msPerChar;
  state.revealedChars = Math.min(
    getCurrentBeat(state, beats).text.length,
    state.revealedChars + newChars,
  );
};

export const advanceStory = (
  state: StorySequenceState,
  beats: readonly StoryBeat[],
): StoryAdvanceResult => {
  if (!isBeatFullyRevealed(state, beats)) {
    state.revealedChars = getCurrentBeat(state, beats).text.length;
    state.charAccumulatorMs = 0;
    return 'revealed';
  }

  if (state.beatIndex >= beats.length - 1) {
    return 'finished';
  }

  state.beatIndex += 1;
  state.revealedChars = 0;
  state.charAccumulatorMs = 0;
  return 'next';
};

import { describe, expect, it } from 'vitest';
import { INTRO_BEATS } from './storyCatalog';
import {
  advanceStory,
  createStorySequence,
  getCurrentBeat,
  isBeatFullyRevealed,
  isEffectTriggerReached,
  tickTypewriter,
  type StoryBeat,
} from './storySequencer';

const BEATS: StoryBeat[] = [
  { id: 'beat_typed', text: 'Salut' },
  { id: 'beat_punchline', text: 'Boum !', effect: 'punchline' },
];

const MS_PER_CHAR = 10;

describe('tickTypewriter', () => {
  it('reveals one character per elapsed msPerChar and carries the remainder', () => {
    const state = createStorySequence();

    tickTypewriter(state, BEATS, 25, MS_PER_CHAR);
    expect(state.revealedChars).toBe(2);

    tickTypewriter(state, BEATS, 5, MS_PER_CHAR);
    expect(state.revealedChars).toBe(3);
  });

  it('never reveals past the end of the line', () => {
    const state = createStorySequence();

    tickTypewriter(state, BEATS, 1_000, MS_PER_CHAR);

    expect(state.revealedChars).toBe(5);
    expect(isBeatFullyRevealed(state, BEATS)).toBe(true);
  });
});

describe('advanceStory', () => {
  it('completes a partially typed line instead of skipping it', () => {
    const state = createStorySequence();
    tickTypewriter(state, BEATS, 20, MS_PER_CHAR);

    expect(advanceStory(state, BEATS)).toBe('revealed');
    expect(state.beatIndex).toBe(0);
    expect(state.revealedChars).toBe(5);
  });

  it('moves to the next beat once the line is fully shown', () => {
    const state = createStorySequence();
    advanceStory(state, BEATS);

    expect(advanceStory(state, BEATS)).toBe('next');
    expect(getCurrentBeat(state, BEATS).id).toBe('beat_punchline');
    expect(state.revealedChars).toBe(0);
  });

  it('shows punchlines whole, so one input moves past them', () => {
    const state = createStorySequence();
    advanceStory(state, BEATS);
    advanceStory(state, BEATS);

    expect(isBeatFullyRevealed(state, BEATS)).toBe(true);
    expect(advanceStory(state, BEATS)).toBe('finished');
  });

  it('keeps reporting finished on the last beat without moving the index', () => {
    const state = createStorySequence();
    advanceStory(state, BEATS);
    advanceStory(state, BEATS);
    advanceStory(state, BEATS);

    expect(advanceStory(state, BEATS)).toBe('finished');
    expect(state.beatIndex).toBe(1);
  });
});

describe('isEffectTriggerReached', () => {
  const SHAKE_BEATS: StoryBeat[] = [
    { id: 'beat_shake', text: 'Le sol vibre', effect: 'shake', effectTrigger: 'vibre' },
  ];

  it('waits until the first letter of the trigger word is typed', () => {
    const state = createStorySequence();

    tickTypewriter(state, SHAKE_BEATS, 7 * MS_PER_CHAR, MS_PER_CHAR);
    expect(isEffectTriggerReached(state, SHAKE_BEATS)).toBe(false);

    tickTypewriter(state, SHAKE_BEATS, MS_PER_CHAR, MS_PER_CHAR);
    expect(isEffectTriggerReached(state, SHAKE_BEATS)).toBe(true);
  });

  it('counts as reached when the player completes the line before the trigger', () => {
    const state = createStorySequence();

    advanceStory(state, SHAKE_BEATS);

    expect(isEffectTriggerReached(state, SHAKE_BEATS)).toBe(true);
  });

  it('fires on beat start without a trigger or when the trigger is not in the text', () => {
    expect(isEffectTriggerReached(createStorySequence(), BEATS)).toBe(true);
    expect(
      isEffectTriggerReached(createStorySequence(), [
        { id: 'beat_typo', text: 'Le sol vibre', effect: 'shake', effectTrigger: 'tremble' },
      ]),
    ).toBe(true);
  });
});

describe('INTRO_BEATS', () => {
  it('keeps every effect trigger present in its own text', () => {
    INTRO_BEATS.filter((beat) => beat.effectTrigger).forEach((beat) => {
      expect(beat.text).toContain(beat.effectTrigger);
    });
  });

  it('uses unique beat ids', () => {
    const ids = INTRO_BEATS.map((beat) => beat.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

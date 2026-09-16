import { describe, expect, it } from 'vitest';
import {
  advanceSpeech,
  createSpeechState,
  getRevealedChars,
  getScreen,
  getScreenText,
  isScreenFullyRevealed,
  normalizeSpeechScreens,
  rewindSpeech,
  tickSpeech,
  type SpeechState,
} from './finaleSpeech';

const SCREENS = normalizeSpeechScreens([
  'Un',
  { lines: ['Deux', 'Trois'], aside: '(un aparté)' },
  'Quatre',
]);

const MS_PER_CHAR = 10;

/** Completes and leaves lines and screens until `screenIndex` is the current screen. */
const reachScreen = (state: SpeechState, screenIndex: number) => {
  while (state.screenIndex < screenIndex) {
    advanceSpeech(state, SCREENS);
  }
};

describe('normalizeSpeechScreens', () => {
  it('turns a plain string into a one-line screen without aside', () => {
    expect(normalizeSpeechScreens(['Salut'])).toEqual([{ lines: ['Salut'], aside: undefined }]);
  });

  it('keeps lines and aside of an object screen', () => {
    expect(SCREENS[1]).toEqual({ lines: ['Deux', 'Trois'], aside: '(un aparté)' });
  });

  it('tolerates an object screen without lines', () => {
    expect(normalizeSpeechScreens([{ aside: '(seul)' }])[0].lines).toEqual([]);
  });
});

describe('getScreenText', () => {
  it('joins the lines so the whole screen is laid out at once', () => {
    expect(getScreenText(SCREENS[1])).toBe('Deux\nTrois');
  });
});

describe('tickSpeech', () => {
  it('reveals the current line only, and stops at its end', () => {
    const state = createSpeechState();

    tickSpeech(state, SCREENS, 15, MS_PER_CHAR);
    expect(state.revealedChars).toBe(1);

    tickSpeech(state, SCREENS, 1_000, MS_PER_CHAR);
    expect(state.revealedChars).toBe(2);
    expect(isScreenFullyRevealed(state, SCREENS)).toBe(true);
  });
});

describe('advanceSpeech', () => {
  it('completes a partially typed line instead of skipping it', () => {
    const state = createSpeechState();
    tickSpeech(state, SCREENS, 10, MS_PER_CHAR);

    expect(advanceSpeech(state, SCREENS)).toBe('revealed');
    expect(state.revealedChars).toBe(2);
    expect(state.screenIndex).toBe(0);
  });

  it('walks line by line inside a screen before moving on', () => {
    const state = createSpeechState();
    advanceSpeech(state, SCREENS);

    expect(advanceSpeech(state, SCREENS)).toBe('next_screen');
    expect(state.lineIndex).toBe(0);

    expect(advanceSpeech(state, SCREENS)).toBe('revealed');
    expect(advanceSpeech(state, SCREENS)).toBe('next_line');
    expect(state.lineIndex).toBe(1);
    expect(state.revealedChars).toBe(0);
  });

  it('reports finished on the last line of the last screen', () => {
    const state = createSpeechState();
    reachScreen(state, 2);
    advanceSpeech(state, SCREENS);

    expect(isScreenFullyRevealed(state, SCREENS)).toBe(true);
    expect(advanceSpeech(state, SCREENS)).toBe('finished');
    expect(state.screenIndex).toBe(2);
  });
});

describe('getRevealedChars', () => {
  it('counts whole lines above the current one, line break included', () => {
    const state = createSpeechState();
    reachScreen(state, 1);
    advanceSpeech(state, SCREENS); // reveals "Deux"
    advanceSpeech(state, SCREENS); // moves to "Trois"
    tickSpeech(state, SCREENS, 2 * MS_PER_CHAR, MS_PER_CHAR);

    // "Deux" (4) + the line break (1) + "Tr" (2)
    expect(getRevealedChars(state, SCREENS)).toBe(7);
  });
});

describe('rewindSpeech', () => {
  it('refuses to go back from the first screen', () => {
    const state = createSpeechState();

    expect(rewindSpeech(state, SCREENS)).toBe(false);
    expect(state.screenIndex).toBe(0);
  });

  it('goes back one whole screen, shown complete', () => {
    const state = createSpeechState();
    reachScreen(state, 1);

    expect(rewindSpeech(state, SCREENS)).toBe(true);
    expect(state.screenIndex).toBe(0);
    expect(isScreenFullyRevealed(state, SCREENS)).toBe(true);
  });

  it('shows an already-reached screen whole when moving forward again', () => {
    const state = createSpeechState();
    reachScreen(state, 1);
    rewindSpeech(state, SCREENS);

    expect(advanceSpeech(state, SCREENS)).toBe('next_screen');
    expect(getScreen(state, SCREENS).lines).toEqual(['Deux', 'Trois']);
    expect(state.lineIndex).toBe(1);
    expect(isScreenFullyRevealed(state, SCREENS)).toBe(true);
  });

  it('still types a never-reached screen from scratch', () => {
    const state = createSpeechState();
    reachScreen(state, 1);
    rewindSpeech(state, SCREENS);
    advanceSpeech(state, SCREENS);

    expect(advanceSpeech(state, SCREENS)).toBe('next_screen');
    expect(state.screenIndex).toBe(2);
    expect(state.revealedChars).toBe(0);
  });
});

/** One screen of the finale speech. */
export interface FinaleSpeechScreen {
  /** Revealed one per player input; earlier lines stay on screen. */
  lines: string[];
  /** Small italic line fading in under the screen once every line is revealed. */
  aside?: string;
}

/** Authoring shape: a plain string is a one-line screen without aside. */
export type RawFinaleSpeechScreen = string | { lines?: string[]; aside?: string };

export const normalizeSpeechScreens = (
  raw: readonly RawFinaleSpeechScreen[],
): FinaleSpeechScreen[] =>
  raw.map((entry) =>
    typeof entry === 'string' ? { lines: [entry] } : { lines: entry.lines ?? [], aside: entry.aside },
  );

export interface SpeechState {
  screenIndex: number;
  /** Line being typed inside the current screen. */
  lineIndex: number;
  /** Characters revealed of the current line only. */
  revealedChars: number;
  charAccumulatorMs: number;
  /** Furthest screen reached: going back then forward shows it whole instead of retyping it. */
  furthestScreenIndex: number;
}

/** What a player input did inside the speech. */
export type SpeechAdvanceResult = 'revealed' | 'next_line' | 'next_screen' | 'finished';

export const createSpeechState = (): SpeechState => ({
  screenIndex: 0,
  lineIndex: 0,
  revealedChars: 0,
  charAccumulatorMs: 0,
  furthestScreenIndex: 0,
});

export const getScreen = (
  state: SpeechState,
  screens: readonly FinaleSpeechScreen[],
): FinaleSpeechScreen => screens[Math.min(state.screenIndex, screens.length - 1)];

/** The whole screen, laid out in one go so revealing a line never moves the ones above. */
export const getScreenText = (screen: FinaleSpeechScreen): string => screen.lines.join('\n');

const getCurrentLine = (state: SpeechState, screens: readonly FinaleSpeechScreen[]): string => {
  const screen = getScreen(state, screens);
  return screen.lines[Math.min(state.lineIndex, screen.lines.length - 1)] ?? '';
};

export const isLineFullyRevealed = (
  state: SpeechState,
  screens: readonly FinaleSpeechScreen[],
): boolean => state.revealedChars >= getCurrentLine(state, screens).length;

export const isScreenFullyRevealed = (
  state: SpeechState,
  screens: readonly FinaleSpeechScreen[],
): boolean =>
  state.lineIndex >= getScreen(state, screens).lines.length - 1 &&
  isLineFullyRevealed(state, screens);

/**
 * Character count to hand to the typed text block: every line above the current one in full
 * (plus the line break that joined them), then the revealed part of the current line.
 */
export const getRevealedChars = (
  state: SpeechState,
  screens: readonly FinaleSpeechScreen[],
): number => {
  const { lines } = getScreen(state, screens);
  const before = lines
    .slice(0, state.lineIndex)
    .reduce((total, line) => total + line.length + 1, 0);
  return before + state.revealedChars;
};

export const tickSpeech = (
  state: SpeechState,
  screens: readonly FinaleSpeechScreen[],
  deltaMs: number,
  msPerChar: number,
): void => {
  if (isLineFullyRevealed(state, screens)) {
    return;
  }

  state.charAccumulatorMs += Math.max(0, deltaMs);
  const newChars = Math.floor(state.charAccumulatorMs / msPerChar);
  if (newChars === 0) {
    return;
  }

  state.charAccumulatorMs -= newChars * msPerChar;
  state.revealedChars = Math.min(
    getCurrentLine(state, screens).length,
    state.revealedChars + newChars,
  );
};

const revealWholeScreen = (state: SpeechState, screens: readonly FinaleSpeechScreen[]): void => {
  const { lines } = getScreen(state, screens);
  state.lineIndex = Math.max(0, lines.length - 1);
  state.revealedChars = (lines[state.lineIndex] ?? '').length;
};

export const advanceSpeech = (
  state: SpeechState,
  screens: readonly FinaleSpeechScreen[],
): SpeechAdvanceResult => {
  if (!isLineFullyRevealed(state, screens)) {
    state.revealedChars = getCurrentLine(state, screens).length;
    state.charAccumulatorMs = 0;
    return 'revealed';
  }

  const screen = getScreen(state, screens);
  if (state.lineIndex < screen.lines.length - 1) {
    state.lineIndex += 1;
    state.revealedChars = 0;
    state.charAccumulatorMs = 0;
    return 'next_line';
  }

  if (state.screenIndex >= screens.length - 1) {
    return 'finished';
  }

  state.screenIndex += 1;
  const alreadyReached = state.screenIndex <= state.furthestScreenIndex;
  state.furthestScreenIndex = Math.max(state.furthestScreenIndex, state.screenIndex);
  if (alreadyReached) {
    revealWholeScreen(state, screens);
  } else {
    state.lineIndex = 0;
    state.revealedChars = 0;
  }
  state.charAccumulatorMs = 0;
  return 'next_screen';
};

/** Steps back one whole screen, shown complete. Returns false on the first screen. */
export const rewindSpeech = (
  state: SpeechState,
  screens: readonly FinaleSpeechScreen[],
): boolean => {
  if (state.screenIndex === 0) {
    return false;
  }

  state.screenIndex -= 1;
  revealWholeScreen(state, screens);
  state.charAccumulatorMs = 0;
  return true;
};

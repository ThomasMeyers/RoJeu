/** Progress through the finale riddle: one expected answer per prompt, in order. */
export interface RiddleState {
  stepIndex: number;
  /** Counts every wrong answer across all steps; drives the quip rotation. */
  wrongAttempts: number;
}

/** `ignored` means nothing was left to compare once normalised (blank or punctuation only). */
export type RiddleSubmitResult = 'ignored' | 'wrong' | 'next' | 'solved';

export const createRiddleState = (): RiddleState => ({ stepIndex: 0, wrongAttempts: 0 });

/**
 * Forgives what a player who knows the line by heart may still type differently:
 * case, accents, punctuation (apostrophes included, straight or typographic) and extra spaces.
 * The words themselves must match.
 */
export const normalizeRiddleAnswer = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export const isRiddleSolved = (state: RiddleState, answers: readonly string[]): boolean =>
  state.stepIndex >= answers.length;

/** A wrong answer keeps the player on the same step: there is no reset. */
export const submitRiddleAnswer = (
  state: RiddleState,
  input: string,
  answers: readonly string[],
): RiddleSubmitResult => {
  if (isRiddleSolved(state, answers)) {
    return 'solved';
  }

  const normalized = normalizeRiddleAnswer(input);
  if (!normalized) {
    return 'ignored';
  }

  if (normalized !== normalizeRiddleAnswer(answers[state.stepIndex])) {
    state.wrongAttempts += 1;
    return 'wrong';
  }

  state.stepIndex += 1;
  return isRiddleSolved(state, answers) ? 'solved' : 'next';
};

/** Quip for the latest wrong answer, looping over the list; null before any mistake. */
export const getWrongAnswerQuip = (state: RiddleState, quips: readonly string[]): string | null =>
  state.wrongAttempts === 0 || quips.length === 0
    ? null
    : quips[(state.wrongAttempts - 1) % quips.length];

import { describe, expect, it } from 'vitest';
import {
  createRiddleState,
  getWrongAnswerQuip,
  normalizeRiddleAnswer,
  submitRiddleAnswer,
} from './finaleRiddle';

// Stand-in answers: the real ones must never appear in clear in the repository.
const ANSWERS = ['Les frites', "De manger à l'heure", "l'accessoire"];

describe('normalizeRiddleAnswer', () => {
  it('ignores case and trailing punctuation', () => {
    expect(normalizeRiddleAnswer('LES FRITES.')).toBe(normalizeRiddleAnswer('les frites'));
  });

  it('ignores accents', () => {
    expect(normalizeRiddleAnswer('De manger a l’heure')).toBe(
      normalizeRiddleAnswer("De manger à l'heure"),
    );
  });

  it('treats typographic and straight apostrophes alike, and missing ones too', () => {
    const expected = normalizeRiddleAnswer("l'accessoire");
    expect(normalizeRiddleAnswer('L’accessoire !')).toBe(expected);
    expect(normalizeRiddleAnswer('laccessoire')).toBe(expected);
  });

  it('collapses and trims whitespace', () => {
    expect(normalizeRiddleAnswer('  les   frites ')).toBe('les frites');
  });
});

describe('submitRiddleAnswer', () => {
  it('walks through every step, then reports the riddle solved', () => {
    const state = createRiddleState();

    expect(submitRiddleAnswer(state, 'les frites', ANSWERS)).toBe('next');
    expect(submitRiddleAnswer(state, 'DE MANGER A L HEURE', ANSWERS)).toBe('wrong');
    expect(submitRiddleAnswer(state, 'de manger à l’heure.', ANSWERS)).toBe('next');
    expect(submitRiddleAnswer(state, "L'accessoire", ANSWERS)).toBe('solved');
    expect(state.stepIndex).toBe(3);
  });

  it('keeps the player on the same step after a wrong answer', () => {
    const state = createRiddleState();
    submitRiddleAnswer(state, 'les frites', ANSWERS);

    expect(submitRiddleAnswer(state, 'les frites', ANSWERS)).toBe('wrong');
    expect(state.stepIndex).toBe(1);
    expect(state.wrongAttempts).toBe(1);
  });

  it('demands the exact words: a missing article is wrong', () => {
    expect(submitRiddleAnswer(createRiddleState(), 'frites', ANSWERS)).toBe('wrong');
  });

  it('ignores blank or punctuation-only input without counting a mistake', () => {
    const state = createRiddleState();

    expect(submitRiddleAnswer(state, '   ', ANSWERS)).toBe('ignored');
    expect(submitRiddleAnswer(state, '...', ANSWERS)).toBe('ignored');
    expect(state).toEqual(createRiddleState());
  });

  it('keeps reporting solved once every step is answered', () => {
    const state = { stepIndex: ANSWERS.length, wrongAttempts: 0 };
    expect(submitRiddleAnswer(state, 'nimporte quoi', ANSWERS)).toBe('solved');
  });
});

describe('getWrongAnswerQuip', () => {
  const QUIPS = ['Non.', 'Toujours pas.'];

  it('has nothing to say before the first mistake', () => {
    expect(getWrongAnswerQuip(createRiddleState(), QUIPS)).toBeNull();
  });

  it('rotates through the quips and loops', () => {
    const state = createRiddleState();
    const seen: Array<string | null> = [];
    for (let i = 0; i < 3; i += 1) {
      submitRiddleAnswer(state, 'faux', ANSWERS);
      seen.push(getWrongAnswerQuip(state, QUIPS));
    }
    expect(seen).toEqual(['Non.', 'Toujours pas.', 'Non.']);
  });
});

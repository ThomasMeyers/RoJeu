import { describe, expect, it } from 'vitest';
import { decodeFinaleSecret, FINALE_RIDDLE_PROMPTS, FINALE_WRONG_ANSWER_QUIPS } from './finaleCatalog';
import { normalizeRiddleAnswer } from './finaleRiddle';
import { normalizeSpeechScreens } from './finaleSpeech';

const encodeUtf8Base64 = (value: unknown): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))));

describe('decodeFinaleSecret', () => {
  it('round-trips accented UTF-8 text through base64', () => {
    const secret = { answers: ['à', 'ç', 'œ'], speechScreens: ['Déjà là, l’été.'], closing: 'Fin.' };
    expect(decodeFinaleSecret(encodeUtf8Base64(secret))).toEqual(secret);
  });

  it('ships a generated secret that fits the riddle', () => {
    const secret = decodeFinaleSecret();

    expect(secret.answers).toHaveLength(FINALE_RIDDLE_PROMPTS.length);
    secret.answers.forEach((answer) => expect(normalizeRiddleAnswer(answer)).not.toBe(''));
    const screens = normalizeSpeechScreens(secret.speechScreens);
    expect(screens.length).toBeGreaterThan(0);
    screens.forEach((screen) => {
      expect(screen.lines.length).toBeGreaterThan(0);
      screen.lines.forEach((line) => expect(line.trim()).not.toBe(''));
      if (screen.aside !== undefined) {
        expect(screen.aside.trim()).not.toBe('');
      }
    });
    expect(secret.closing.trim()).not.toBe('');
  });
});

describe('FINALE_WRONG_ANSWER_QUIPS', () => {
  it('has at least one quip', () => {
    expect(FINALE_WRONG_ANSWER_QUIPS.length).toBeGreaterThan(0);
  });
});

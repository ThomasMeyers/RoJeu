import Phaser from 'phaser';
import {
  decodeFinaleSecret,
  FINALE_COPY,
  FINALE_RIDDLE_PROMPTS,
  FINALE_WRONG_ANSWER_QUIPS,
  type FinaleSecret,
} from '../game/finaleCatalog';
import {
  createRiddleState,
  getWrongAnswerQuip,
  submitRiddleAnswer,
  type RiddleState,
} from '../game/finaleRiddle';
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
  type FinaleSpeechScreen,
  type SpeechState,
} from '../game/finaleSpeech';
import { FONT_FAMILY } from '../render/layout';
import { TypedTextBlock } from '../ui/typedTextBlock';

const MS_PER_CHAR = 28;
const SCENE_FADE_MS = 600;
const STEP_FADE_MS = 400;
const CORRECT_ANSWER_HOLD_MS = 500;
const WRONG_SHAKE_MS = 250;
const WRONG_SHAKE_INTENSITY = 0.008;
const QUIP_FADE_MS = 300;
const CLOSING_FADE_MS = 1200;
const CLOSING_INPUT_LOCK_MS = 1500;
const MAX_ANSWER_LENGTH = 40;
/** Let the last line land before the aside undercuts it. */
const ASIDE_DELAY_MS = 500;
const ASIDE_FADE_MS = 400;
const ASIDE_GAP = 26;

const TEXT_COLOR = '#f5edd8';
const SOFT_COLOR = '#c4b898';
const MUTED_COLOR = '#8a7e66';
const ANSWER_COLOR = '#ffd892';
const CORRECT_COLOR = '#a8d98a';

const ADVANCE_CODES = ['Enter', 'NumpadEnter', 'Space', 'ArrowRight', 'ArrowDown'];
const REWIND_CODES = ['ArrowUp', 'ArrowLeft'];

type FinaleMode = 'riddle' | 'transition' | 'speech' | 'closing' | 'leaving';
/** An aside waits a beat after its screen completes, then fades in. */
type AsideStage = 'hidden' | 'pending' | 'shown';

/**
 * Ending unlocked by the `ending_unlock` talent: the player completes three lines by
 * typing, reads the speech screen by screen (lines revealed one at a time, with a way
 * back), then a closing card hands over to the title screen. Every visit starts again
 * at the riddle.
 */
export class FinaleScene extends Phaser.Scene {
  private secret!: FinaleSecret;

  private screens: FinaleSpeechScreen[] = [];

  private mode: FinaleMode = 'riddle';

  private inputLockedUntilMs = 0;

  /** Native key events already handled: see `handleKeyDown`. */
  private readonly handledKeyEvents = new WeakSet<KeyboardEvent>();

  private riddle!: RiddleState;

  private typedAnswer = '';

  private riddleObjects: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle> = [];

  private stepText!: Phaser.GameObjects.Text;

  private promptText!: Phaser.GameObjects.Text;

  private answerText!: Phaser.GameObjects.Text;

  private cursorText!: Phaser.GameObjects.Text;

  private quipText!: Phaser.GameObjects.Text;

  private speech!: SpeechState;

  private speechText!: TypedTextBlock;

  private asideText!: Phaser.GameObjects.Text;

  private asideStage: AsideStage = 'hidden';

  private asideDueAtMs = 0;

  private pageText!: Phaser.GameObjects.Text;

  private continueIndicator!: Phaser.GameObjects.Text;

  private rewindHintText!: Phaser.GameObjects.Text;

  private closingText!: Phaser.GameObjects.Text;

  private closingHintText!: Phaser.GameObjects.Text;

  constructor() {
    super('FinaleScene');
  }

  create() {
    this.mode = 'riddle';
    this.inputLockedUntilMs = 0;
    this.typedAnswer = '';
    this.riddle = createRiddleState();
    this.speech = createSpeechState();
    this.secret = decodeFinaleSecret();
    this.screens = normalizeSpeechScreens(this.secret.speechScreens);

    const centerX = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#0c0b07');
    this.cameras.main.fadeIn(SCENE_FADE_MS);

    this.createRiddle(centerX);
    this.createSpeech(centerX);
    this.createClosing(centerX);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));
    this.input.on('pointerdown', () => {
      if (this.mode === 'speech') {
        this.advanceSpeechScreen();
      } else if (this.mode === 'closing') {
        this.leave();
      }
    });

    this.showRiddleStep();
  }

  update(_time: number, deltaMs: number) {
    if (this.mode !== 'speech') {
      return;
    }

    tickSpeech(this.speech, this.screens, deltaMs, MS_PER_CHAR);
    const fullyRevealed = isScreenFullyRevealed(this.speech, this.screens);
    this.speechText.render(getRevealedChars(this.speech, this.screens), fullyRevealed);
    this.updateAside(fullyRevealed);
    this.continueIndicator.setVisible(
      fullyRevealed && this.asideStage !== 'pending' && this.time.now >= this.inputLockedUntilMs,
    );
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Phaser replays its whole pending key queue on every new key until the frame ends, and its
    // duplicate guard only compares with the previous event: a fast burst would type a character
    // twice. Handle each native event once.
    if (this.handledKeyEvents.has(event)) {
      return;
    }
    this.handledKeyEvents.add(event);

    // Cmd shortcuts must not type or advance. AltGr arrives as Ctrl+Alt and still types.
    if (event.metaKey || (event.ctrlKey && !event.altKey)) {
      return;
    }
    if (event.repeat && !(this.mode === 'riddle' && event.key === 'Backspace')) {
      return;
    }
    if (this.time.now < this.inputLockedUntilMs) {
      return;
    }

    switch (this.mode) {
      case 'riddle':
        this.handleRiddleKey(event);
        break;
      case 'speech':
        if (ADVANCE_CODES.includes(event.code)) {
          this.advanceSpeechScreen();
        } else if (REWIND_CODES.includes(event.code)) {
          this.rewindSpeechScreen();
        }
        break;
      case 'closing':
        if (REWIND_CODES.includes(event.code)) {
          this.backToSpeech();
        } else {
          this.leave();
        }
        break;
      default:
        break;
    }
  }

  // --- Riddle ---------------------------------------------------------------

  private createRiddle(centerX: number): void {
    const headerText = this.add
      .text(centerX, 110, FINALE_COPY.riddleHeader, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: MUTED_COLOR,
      })
      .setOrigin(0.5);
    this.stepText = this.add
      .text(centerX, 138, '', { fontFamily: FONT_FAMILY, fontSize: '14px', color: MUTED_COLOR })
      .setOrigin(0.5);
    this.promptText = this.add
      .text(centerX, 240, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        color: TEXT_COLOR,
        align: 'center',
        wordWrap: { width: 480 },
      })
      .setOrigin(0.5);
    this.answerText = this.add
      .text(centerX, 320, '', { fontFamily: FONT_FAMILY, fontSize: '24px', color: ANSWER_COLOR })
      .setOrigin(0.5);
    this.cursorText = this.add
      .text(centerX, 320, '|', { fontFamily: FONT_FAMILY, fontSize: '24px', color: ANSWER_COLOR })
      .setOrigin(0, 0.5);
    this.tweens.add({ targets: this.cursorText, alpha: 0, duration: 450, yoyo: true, repeat: -1 });
    const underline = this.add.rectangle(centerX, 344, 380, 2, 0x5a4e3a);
    const hintText = this.add
      .text(centerX, 372, FINALE_COPY.inputHint, {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: MUTED_COLOR,
      })
      .setOrigin(0.5);
    this.quipText = this.add
      .text(centerX, 440, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        fontStyle: 'italic',
        color: SOFT_COLOR,
        align: 'center',
        wordWrap: { width: 460 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.riddleObjects = [
      headerText,
      this.stepText,
      this.promptText,
      this.answerText,
      this.cursorText,
      underline,
      hintText,
      this.quipText,
    ];
  }

  private handleRiddleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.submitAnswer();
    } else if (event.key === 'Backspace') {
      this.setTypedAnswer(this.typedAnswer.slice(0, -1));
    } else if (event.key.length === 1 && this.typedAnswer.length < MAX_ANSWER_LENGTH) {
      // Dead keys report "Dead" and are skipped; the composed character follows as its own key.
      this.setTypedAnswer(this.typedAnswer + event.key);
    }
  }

  private setTypedAnswer(value: string): void {
    this.typedAnswer = value;
    this.answerText.setText(value);
    this.cursorText.setX(this.answerText.x + this.answerText.width / 2 + 1);
  }

  private showRiddleStep(): void {
    const step = this.riddle.stepIndex;
    this.stepText.setText(`${step + 1} / ${FINALE_RIDDLE_PROMPTS.length}`);
    this.promptText.setText(FINALE_RIDDLE_PROMPTS[step]);
    this.answerText.setColor(ANSWER_COLOR);
    this.setTypedAnswer('');
    this.hideQuip();

    const targets = [this.stepText, this.promptText];
    targets.forEach((target) => target.setAlpha(0));
    this.tweens.add({ targets, alpha: 1, duration: STEP_FADE_MS });
  }

  private submitAnswer(): void {
    const result = submitRiddleAnswer(this.riddle, this.typedAnswer, this.secret.answers);
    if (result === 'ignored') {
      return;
    }

    if (result === 'wrong') {
      this.setTypedAnswer('');
      this.cameras.main.shake(WRONG_SHAKE_MS, WRONG_SHAKE_INTENSITY);
      this.showQuip(getWrongAnswerQuip(this.riddle, FINALE_WRONG_ANSWER_QUIPS));
      return;
    }

    this.answerText.setColor(CORRECT_COLOR);
    this.hideQuip();
    this.inputLockedUntilMs = this.time.now + CORRECT_ANSWER_HOLD_MS + STEP_FADE_MS;
    this.time.delayedCall(CORRECT_ANSWER_HOLD_MS, () => {
      if (result === 'solved') {
        this.startSpeech();
      } else {
        this.showRiddleStep();
      }
    });
  }

  private showQuip(quip: string | null): void {
    if (!quip) {
      return;
    }
    this.tweens.killTweensOf(this.quipText);
    this.quipText.setText(quip).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.quipText, alpha: 1, duration: QUIP_FADE_MS });
  }

  private hideQuip(): void {
    this.tweens.killTweensOf(this.quipText);
    this.quipText.setVisible(false);
  }

  // --- Speech ---------------------------------------------------------------

  private createSpeech(centerX: number): void {
    this.speechText = new TypedTextBlock(this, {
      centerX,
      centerY: 275,
      wrapWidth: 480,
      lineSpacing: 8,
      style: { fontFamily: FONT_FAMILY, fontSize: '19px', color: TEXT_COLOR },
    });
    this.asideText = this.add
      .text(centerX, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        fontStyle: 'italic',
        color: SOFT_COLOR,
        align: 'center',
        wordWrap: { width: 440 },
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.pageText = this.add
      .text(centerX, 56, '', { fontFamily: FONT_FAMILY, fontSize: '13px', color: MUTED_COLOR })
      .setOrigin(0.5)
      .setVisible(false);
    this.continueIndicator = this.add
      .text(centerX, 505, '▼', { fontFamily: FONT_FAMILY, fontSize: '18px', color: SOFT_COLOR })
      .setOrigin(0.5)
      .setVisible(false);
    this.tweens.add({
      targets: this.continueIndicator,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    this.rewindHintText = this.add
      .text(centerX, 560, FINALE_COPY.rewindHint, {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: MUTED_COLOR,
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private startSpeech(): void {
    this.mode = 'transition';
    this.cameras.main.fadeOut(STEP_FADE_MS);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.riddleObjects.forEach((object) => object.setVisible(false));
      this.tweens.killTweensOf(this.cursorText);
      this.mode = 'speech';
      this.enterScreen();
      this.cameras.main.fadeIn(STEP_FADE_MS);
    });
  }

  private enterScreen(): void {
    const screen = getScreen(this.speech, this.screens);
    this.speechText.layout(getScreenText(screen));
    this.speechText.render(
      getRevealedChars(this.speech, this.screens),
      isScreenFullyRevealed(this.speech, this.screens),
    );
    this.hideAside();
    this.pageText.setText(`${this.speech.screenIndex + 1} / ${this.screens.length}`).setVisible(true);
    this.rewindHintText.setVisible(this.speech.screenIndex > 0);
  }

  private advanceSpeechScreen(): void {
    if (this.time.now < this.inputLockedUntilMs) {
      return;
    }

    const result = advanceSpeech(this.speech, this.screens);
    if (result === 'next_screen') {
      this.enterScreen();
    } else if (result === 'finished') {
      this.showClosing();
    }
  }

  private rewindSpeechScreen(): void {
    if (rewindSpeech(this.speech, this.screens)) {
      this.enterScreen();
    }
  }

  /** Placed under the finished block, so it reads as an afterthought rather than a line of its own. */
  private updateAside(screenFullyRevealed: boolean): void {
    const { aside } = getScreen(this.speech, this.screens);
    if (!aside || !screenFullyRevealed) {
      this.hideAside();
      return;
    }

    if (this.asideStage === 'hidden') {
      this.asideStage = 'pending';
      this.asideDueAtMs = this.time.now + ASIDE_DELAY_MS;
      return;
    }

    if (this.asideStage === 'pending' && this.time.now >= this.asideDueAtMs) {
      this.asideStage = 'shown';
      this.asideText
        .setText(aside)
        .setY(this.speechText.bottomY + ASIDE_GAP)
        .setAlpha(0)
        .setVisible(true);
      this.tweens.add({ targets: this.asideText, alpha: 1, duration: ASIDE_FADE_MS });
    }
  }

  private hideAside(): void {
    if (this.asideStage === 'hidden') {
      return;
    }
    this.tweens.killTweensOf(this.asideText);
    this.asideText.setVisible(false);
    this.asideStage = 'hidden';
  }

  // --- Closing --------------------------------------------------------------

  private createClosing(centerX: number): void {
    this.closingText = this.add
      .text(centerX, 280, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: TEXT_COLOR,
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: 460 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.closingHintText = this.add
      .text(centerX, 505, FINALE_COPY.closingHint, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: MUTED_COLOR,
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private showClosing(): void {
    this.mode = 'closing';
    this.speechText.clear();
    this.hideAside();
    this.pageText.setVisible(false);
    this.continueIndicator.setVisible(false);
    this.rewindHintText.setVisible(false);

    this.closingText.setText(this.secret.closing).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.closingText, alpha: 1, duration: CLOSING_FADE_MS });
    this.closingHintText.setAlpha(0).setVisible(true);
    this.tweens.add({
      targets: this.closingHintText,
      alpha: 1,
      delay: CLOSING_INPUT_LOCK_MS,
      duration: QUIP_FADE_MS,
    });
    this.inputLockedUntilMs = this.time.now + CLOSING_INPUT_LOCK_MS;
  }

  /** ↑ on the closing card returns to the last screen. */
  private backToSpeech(): void {
    this.tweens.killTweensOf([this.closingText, this.closingHintText]);
    this.closingText.setVisible(false);
    this.closingHintText.setVisible(false);
    this.mode = 'speech';
    this.enterScreen();
  }

  private leave(): void {
    if (this.mode !== 'closing' || this.time.now < this.inputLockedUntilMs) {
      return;
    }

    this.mode = 'leaving';
    this.cameras.main.fadeOut(SCENE_FADE_MS);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('TitleScene');
    });
  }
}

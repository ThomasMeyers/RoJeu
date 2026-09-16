import Phaser from 'phaser';
import { createDefaultMetaState, saveMetaState } from '../game/metaState';
import { INTRO_BEATS, MISSION_BRIEF } from '../game/storyCatalog';
import {
  advanceStory,
  createStorySequence,
  getCurrentBeat,
  isBeatFullyRevealed,
  isEffectTriggerReached,
  tickTypewriter,
  type StorySequenceState,
} from '../game/storySequencer';
import { FONT_FAMILY } from '../render/layout';
import { MenuButton } from '../ui/menuButton';
import { TypedTextBlock } from '../ui/typedTextBlock';

const MS_PER_CHAR = 35;
const PUNCHLINE_FADE_MS = 600;
const PUNCHLINE_INPUT_LOCK_MS = 900;
const MISSION_FADE_MS = 500;
const MISSION_INPUT_LOCK_MS = 400;
const SHAKE_DURATION_MS = 600;
const SHAKE_INTENSITY = 0.012;
const TEXT_CENTER_Y = 270;
const TEXT_WRAP_WIDTH = 460;
const LINE_SPACING = 8;
const INDICATOR_Y = 420;
const SKIP_QUIP_Y = 355;
const SKIP_QUIP_FADE_MS = 300;

const STORY_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY,
  fontSize: '22px',
  color: '#f5edd8',
};

type StoryMode = 'intro' | 'mission' | 'leaving';

/**
 * New-game intro: typewriter beats driven by `storySequencer`, then the mission
 * brief, whose CTA creates the save and hands over to `GameScene`.
 */
export class StoryScene extends Phaser.Scene {
  private sequence!: StorySequenceState;

  private mode: StoryMode = 'intro';

  private inputLockedUntilMs = 0;

  private pendingShake = false;

  private typedText!: TypedTextBlock;

  private punchlineText!: Phaser.GameObjects.Text;

  private continueIndicator!: Phaser.GameObjects.Text;

  private skipQuipText!: Phaser.GameObjects.Text;

  private missionTexts: Phaser.GameObjects.Text[] = [];

  private ctaButton!: MenuButton;

  constructor() {
    super('StoryScene');
  }

  create() {
    this.mode = 'intro';
    this.inputLockedUntilMs = 0;
    this.pendingShake = false;
    this.sequence = createStorySequence();

    const centerX = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#0c0b07');
    this.cameras.main.fadeIn(600);

    this.typedText = new TypedTextBlock(this, {
      centerX,
      centerY: TEXT_CENTER_Y,
      wrapWidth: TEXT_WRAP_WIDTH,
      lineSpacing: LINE_SPACING,
      style: STORY_TEXT_STYLE,
    });

    this.punchlineText = this.add
      .text(centerX, TEXT_CENTER_Y, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#f5edd8',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.continueIndicator = this.add
      .text(centerX, INDICATOR_Y, '▼', { fontFamily: FONT_FAMILY, fontSize: '18px', color: '#c4b898' })
      .setOrigin(0.5)
      .setVisible(false);
    this.tweens.add({
      targets: this.continueIndicator,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.skipQuipText = this.add
      .text(centerX, SKIP_QUIP_Y, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#c4b898',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.createMissionBrief(centerX);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));
    this.input.on('pointerdown', () => {
      if (this.mode === 'intro') {
        this.advanceIntro();
      }
    });

    this.enterBeat();
  }

  update(_time: number, deltaMs: number) {
    if (this.mode !== 'intro') {
      return;
    }

    tickTypewriter(this.sequence, INTRO_BEATS, deltaMs, MS_PER_CHAR);
    const fullyRevealed = isBeatFullyRevealed(this.sequence, INTRO_BEATS);
    this.typedText.render(this.sequence.revealedChars, fullyRevealed);
    if (this.pendingShake && isEffectTriggerReached(this.sequence, INTRO_BEATS)) {
      this.pendingShake = false;
      this.cameras.main.shake(SHAKE_DURATION_MS, SHAKE_INTENSITY);
    }
    this.continueIndicator.setVisible(fullyRevealed && this.time.now >= this.inputLockedUntilMs);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore auto-repeat and shortcuts (Cmd+Tab and friends should not advance the story).
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (this.mode === 'intro') {
      this.advanceIntro();
      return;
    }

    if (this.mode === 'mission' && ['Enter', 'NumpadEnter', 'Space'].includes(event.code)) {
      this.ctaButton.activate();
    }
  }

  private advanceIntro(): void {
    if (this.time.now < this.inputLockedUntilMs) {
      return;
    }

    const result = advanceStory(this.sequence, INTRO_BEATS);
    if (result === 'revealed' && this.sequence.effectTriggerSkipped) {
      this.showSkipQuip();
    } else if (result === 'next') {
      this.enterBeat();
    } else if (result === 'finished') {
      this.showMissionBrief();
    }
  }

  private enterBeat(): void {
    const beat = getCurrentBeat(this.sequence, INTRO_BEATS);
    this.typedText.clear();
    this.hideSkipQuip();
    this.tweens.killTweensOf(this.punchlineText);
    this.punchlineText.setVisible(false);

    if (beat.effect === 'punchline') {
      this.punchlineText.setText(beat.text).setAlpha(0).setVisible(true);
      this.tweens.add({ targets: this.punchlineText, alpha: 1, duration: PUNCHLINE_FADE_MS });
      this.inputLockedUntilMs = this.time.now + PUNCHLINE_INPUT_LOCK_MS;
    } else {
      this.typedText.layout(beat.text);
    }

    // Fired from update() once the typewriter reaches the beat's effect trigger.
    this.pendingShake = beat.effect === 'shake';
  }

  /** The player rushed past the effect trigger: the effect still fires, just too early. */
  private showSkipQuip(): void {
    const quip = getCurrentBeat(this.sequence, INTRO_BEATS).effectSkipQuip;
    if (!quip) {
      return;
    }
    this.skipQuipText.setText(quip).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.skipQuipText, alpha: 1, duration: SKIP_QUIP_FADE_MS });
  }

  private hideSkipQuip(): void {
    this.tweens.killTweensOf(this.skipQuipText);
    this.skipQuipText.setVisible(false);
  }

  private createMissionBrief(centerX: number): void {
    const briefText = this.add
      .text(centerX, 230, MISSION_BRIEF.text, {
        ...STORY_TEXT_STYLE,
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: TEXT_WRAP_WIDTH },
      })
      .setOrigin(0.5);
    const hintText = this.add
      .text(centerX, 318, MISSION_BRIEF.controlsHint, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#8a7e66',
      })
      .setOrigin(0.5);
    this.missionTexts = [briefText, hintText];

    this.ctaButton = new MenuButton(this, {
      x: centerX,
      y: 410,
      width: 340,
      height: 58,
      label: MISSION_BRIEF.ctaLabel,
      variant: 'primary',
      onActivate: () => this.launchFirstRun(),
    }).setFocused(true);

    this.setMissionVisible(false);
  }

  private setMissionVisible(visible: boolean): void {
    this.missionTexts.forEach((text) => text.setVisible(visible));
    this.ctaButton.setVisible(visible);
  }

  private showMissionBrief(): void {
    this.mode = 'mission';
    this.typedText.clear();
    this.hideSkipQuip();
    this.punchlineText.setVisible(false);
    this.continueIndicator.setVisible(false);

    this.setMissionVisible(true);
    const targets = [...this.missionTexts, ...this.ctaButton.gameObjects];
    targets.forEach((target) => target.setAlpha(0));
    this.tweens.add({ targets, alpha: 1, duration: MISSION_FADE_MS });
    // Keeps the input that ended the intro from also firing the CTA.
    this.inputLockedUntilMs = this.time.now + MISSION_INPUT_LOCK_MS;
  }

  private launchFirstRun(): void {
    if (this.mode !== 'mission' || this.time.now < this.inputLockedUntilMs) {
      return;
    }

    this.mode = 'leaving';
    saveMetaState(createDefaultMetaState());
    this.cameras.main.fadeOut(400);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }
}

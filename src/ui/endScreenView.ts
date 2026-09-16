import Phaser from 'phaser';
import { FINALE_COPY } from '../game/finaleCatalog';
import { isEndingUnlocked } from '../game/metaState';
import type { MetaState, RunState } from '../game/types';
import {
  BOARD_CENTER_X,
  BOARD_CENTER_Y,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BUTTON_PRIMARY,
  BUTTON_PRIMARY_HOVER,
  BUTTON_PRIMARY_PRESS,
  BUTTON_SECONDARY,
  BUTTON_SECONDARY_HOVER,
  BUTTON_SECONDARY_PRESS,
  FONT_FAMILY,
} from '../render/layout';

export interface EndScreenHandlers {
  onRestart: () => void;
  onOpenStore: () => void;
  /** Guards the store button against clicks once the run is no longer ended. */
  canOpenStore: () => boolean;
  /** Only reachable once `ending_unlock` is owned: the button is hidden before that. */
  onReplayFinale: () => void;
}

const REPLAY_BUTTON_FILL = 0x2e2820;
const REPLAY_BUTTON_FILL_HOVER = 0x3d3426;

const resolveSubtitle = (state: RunState): string => {
  switch (state.deathReason) {
    case 'wall_collision':
      return "La collision avec un mur t'a arrete.";
    case 'self_collision':
      return "Tu t'es percute toi-meme.";
    case 'timer_end':
      return "Le temps est ecoule, Rogie s'en est alle.";
    case 'no_lives':
      return "Tu n'as plus de vie.";
    case 'suicide':
      return 'rm -rf';
    default:
      return 'La run est terminee.';
  }
};

/**
 * Game-over overlay: title, contextual subtitle, run stats, the two CTAs, and the
 * finale replay button that takes the store hint's place once the ending is owned.
 */
export class EndScreenView {
  private readonly scene: Phaser.Scene;

  private replayAvailable = false;

  private overlayBg!: Phaser.GameObjects.Rectangle;

  private titleText!: Phaser.GameObjects.Text;

  private subtitleText!: Phaser.GameObjects.Text;

  private statsText!: Phaser.GameObjects.Text;

  private restartButtonBg!: Phaser.GameObjects.Rectangle;

  private restartButtonText!: Phaser.GameObjects.Text;

  private upgradeButtonBg!: Phaser.GameObjects.Rectangle;

  private upgradeButtonText!: Phaser.GameObjects.Text;

  private upgradeHintText!: Phaser.GameObjects.Text;

  private replayButtonBg!: Phaser.GameObjects.Rectangle;

  private replayButtonText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(handlers: EndScreenHandlers): void {
    const centerX = BOARD_CENTER_X;
    const centerY = BOARD_CENTER_Y;

    this.overlayBg = this.scene.add
      .rectangle(centerX, centerY, BOARD_WIDTH, BOARD_HEIGHT, 0x0c0b07, 1)
      .setStrokeStyle(1, 0x3d362a)
      .setVisible(false);

    this.titleText = this.scene.add
      .text(centerX, centerY - 150, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '36px',
        color: '#f5edd8',
        align: 'center',
        wordWrap: { width: BOARD_WIDTH - 48 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.subtitleText = this.scene.add
      .text(centerX, centerY - 95, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '17px',
        color: '#c4b898',
        align: 'center',
        wordWrap: { width: BOARD_WIDTH - 64 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.statsText = this.scene.add
      .text(centerX, centerY - 15, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#ede5cc',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: BOARD_WIDTH - 56 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.restartButtonBg = this.scene.add
      .rectangle(centerX, centerY + 95, 280, 52, BUTTON_PRIMARY, 1)
      .setStrokeStyle(2, 0xb89850)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.restartButtonBg.on('pointerdown', () => {
      this.restartButtonBg.setFillStyle(BUTTON_PRIMARY_PRESS, 1);
      handlers.onRestart();
    });
    this.restartButtonBg.on('pointerover', () => {
      this.restartButtonBg.setFillStyle(BUTTON_PRIMARY_HOVER, 1);
    });
    this.restartButtonBg.on('pointerout', () => {
      this.restartButtonBg.setFillStyle(BUTTON_PRIMARY, 1);
    });
    this.restartButtonBg.on('pointerup', () => {
      this.restartButtonBg.setFillStyle(BUTTON_PRIMARY_HOVER, 1);
    });

    this.restartButtonText = this.scene.add
      .text(centerX, centerY + 95, 'Relancer une run', {
        fontFamily: FONT_FAMILY,
        fontSize: '19px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.upgradeButtonBg = this.scene.add
      .rectangle(centerX, centerY + 162, 280, 52, BUTTON_SECONDARY, 1)
      .setStrokeStyle(2, 0xa08838)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.upgradeButtonBg.on('pointerdown', () => {
      if (!handlers.canOpenStore()) {
        return;
      }
      this.upgradeButtonBg.setFillStyle(BUTTON_SECONDARY_PRESS, 1);
      handlers.onOpenStore();
    });
    this.upgradeButtonBg.on('pointerover', () => {
      this.upgradeButtonBg.setFillStyle(BUTTON_SECONDARY_HOVER, 1);
    });
    this.upgradeButtonBg.on('pointerout', () => {
      this.upgradeButtonBg.setFillStyle(BUTTON_SECONDARY, 1);
    });
    this.upgradeButtonBg.on('pointerup', () => {
      this.upgradeButtonBg.setFillStyle(BUTTON_SECONDARY_HOVER, 1);
    });

    this.upgradeButtonText = this.scene.add
      .text(centerX, centerY + 162, 'Ameliorer la limace', {
        fontFamily: FONT_FAMILY,
        fontSize: '19px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.upgradeHintText = this.scene.add
      .text(centerX, centerY + 198, 'Ouvre la boutique des talents', {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: '#8a7e66',
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Smaller than the CTAs: the board ends 18px below it.
    this.replayButtonBg = this.scene.add
      .rectangle(centerX, centerY + 215, 240, 34, REPLAY_BUTTON_FILL, 1)
      .setStrokeStyle(1, 0xb89850)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.replayButtonBg.on('pointerdown', () => handlers.onReplayFinale());
    this.replayButtonBg.on('pointerover', () => {
      this.replayButtonBg.setFillStyle(REPLAY_BUTTON_FILL_HOVER, 1);
    });
    this.replayButtonBg.on('pointerout', () => {
      this.replayButtonBg.setFillStyle(REPLAY_BUTTON_FILL, 1);
    });

    this.replayButtonText = this.scene.add
      .text(centerX, centerY + 215, FINALE_COPY.replayLabel, {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#ffd892',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  setVisible(visible: boolean): void {
    this.overlayBg.setVisible(visible);
    this.titleText.setVisible(visible);
    this.subtitleText.setVisible(visible);
    this.statsText.setVisible(visible);
    this.restartButtonBg.setVisible(visible);
    this.restartButtonText.setVisible(visible);
    this.upgradeButtonBg.setVisible(visible);
    this.upgradeButtonText.setVisible(visible);
    this.upgradeHintText.setVisible(visible && !this.replayAvailable);
    this.replayButtonBg.setVisible(visible && this.replayAvailable);
    this.replayButtonText.setVisible(visible && this.replayAvailable);
  }

  /** Disabled while the store is open, so clicks do not fall through to it. */
  setButtonsInteractive(enabled: boolean): void {
    const buttons = [this.restartButtonBg, this.upgradeButtonBg, this.replayButtonBg];
    if (enabled) {
      buttons.forEach((button) => button.setInteractive({ useHandCursor: true }));
      return;
    }
    buttons.forEach((button) => button.disableInteractive());
  }

  refresh(state: RunState, meta: MetaState): void {
    const survivalMs =
      state.startedAtMs === null || state.endedAtMs === null
        ? 0
        : Math.max(0, state.endedAtMs - state.startedAtMs);
    const survivalSec = Math.floor(survivalMs / 1000);

    this.titleText.setText("L'important dans la vie, c'est de faire de son mieux");
    this.subtitleText.setText(resolveSubtitle(state));
    this.statsText.setText(
      `Points obtenus: ${state.score}\nPoints totaux: ${meta.totalPoints}\nTemps de survie: ${survivalSec}s`,
    );

    this.replayAvailable = isEndingUnlocked(meta);
    this.upgradeHintText.setVisible(!this.replayAvailable);
    this.replayButtonBg.setVisible(this.replayAvailable);
    this.replayButtonText.setVisible(this.replayAvailable);
  }
}

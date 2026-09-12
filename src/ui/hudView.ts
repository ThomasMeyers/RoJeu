import Phaser from 'phaser';
import { getCurrentVisionRadius } from '../game/runState';
import type { MetaState, RunState } from '../game/types';
import {
  BOARD_HEIGHT,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  BOARD_WIDTH,
  FONT_FAMILY,
  HUD_BG_COLOR,
} from '../render/layout';

const SUDOKU_BG_NORMAL = 0x5c3018;
const SUDOKU_BG_HOVER = 0x7a3c20;
const SUDOKU_BG_PRESS = 0x4a2612;

/** Top status bar, bottom status line, and the in-run "commit sudoku" button. */
export class HudView {
  private readonly scene: Phaser.Scene;

  private hudBg!: Phaser.GameObjects.Rectangle;

  private scoreText!: Phaser.GameObjects.Text;

  private runInfoText!: Phaser.GameObjects.Text;

  private statusText!: Phaser.GameObjects.Text;

  private waitingText!: Phaser.GameObjects.Text;

  private sudokuButtonBg!: Phaser.GameObjects.Rectangle;

  private sudokuButtonText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.hudBg = this.scene.add
      .rectangle(BOARD_OFFSET_X + BOARD_WIDTH / 2, 34, BOARD_WIDTH, 54, HUD_BG_COLOR, 0.92)
      .setStrokeStyle(1, 0x3d362a)
      .setDepth(0);

    this.scoreText = this.scene.add.text(24, 20, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '17px',
      color: '#f5edd8',
    });

    this.runInfoText = this.scene.add.text(24, 42, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#c4b898',
    });

    this.statusText = this.scene.add.text(24, BOARD_OFFSET_Y + BOARD_HEIGHT + 16, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#ddd4b8',
    });

    this.waitingText = this.scene.add
      .text(24, BOARD_OFFSET_Y + BOARD_HEIGHT + 16, 'Appuie sur une direction pour lancer la run.', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#ffe2a8',
      })
      .setVisible(false);
  }

  /**
   * Created separately from the rest of the HUD: these objects carry no explicit
   * depth, so their z-order depends on creation order and they must stay last.
   */
  createSudokuButton(onCommit: () => void): void {
    const btnX = BOARD_OFFSET_X + BOARD_WIDTH - 78;
    const btnY = BOARD_OFFSET_Y + BOARD_HEIGHT + 24;

    this.sudokuButtonBg = this.scene.add
      .rectangle(btnX, btnY, 140, 32, SUDOKU_BG_NORMAL, 1)
      .setStrokeStyle(1, 0x9e5a30)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.sudokuButtonBg.on('pointerover', () => this.sudokuButtonBg.setFillStyle(SUDOKU_BG_HOVER));
    this.sudokuButtonBg.on('pointerout', () => this.sudokuButtonBg.setFillStyle(SUDOKU_BG_NORMAL));
    this.sudokuButtonBg.on('pointerup', () => this.sudokuButtonBg.setFillStyle(SUDOKU_BG_HOVER));
    this.sudokuButtonBg.on('pointerdown', () => {
      this.sudokuButtonBg.setFillStyle(SUDOKU_BG_PRESS);
      onCommit();
    });

    this.sudokuButtonText = this.scene.add
      .text(btnX, btnY, 'Commit sudoku', {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: '#ffc8a0',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  /** Hiding the HUD also hides the waiting line and the sudoku button. */
  setVisible(visible: boolean): void {
    this.hudBg.setVisible(visible);
    this.scoreText.setVisible(visible);
    this.runInfoText.setVisible(visible);
    this.statusText.setVisible(visible);
    if (!visible) {
      this.waitingText.setVisible(false);
      this.setSudokuButtonVisible(false);
    }
  }

  private setSudokuButtonVisible(visible: boolean): void {
    this.sudokuButtonBg.setVisible(visible);
    this.sudokuButtonText.setVisible(visible);
  }

  refresh(state: RunState, meta: MetaState, nowMs: number): void {
    const timeLeft = Math.ceil(state.remainingMs / 1000);
    const currentVisionRadius = getCurrentVisionRadius(state, nowMs);
    this.scoreText.setText(
      `Run: ${state.score} pts   |   Total: ${meta.totalPoints} pts   |   Vies: ${state.lives}`,
    );
    this.runInfoText.setText(`Temps restant: ${timeLeft}s   |   Vision: ${currentVisionRadius}`);

    this.setSudokuButtonVisible(state.phase === 'running');

    if (state.phase === 'waiting_start') {
      this.statusText.setVisible(false);
      this.waitingText.setVisible(true);
      this.waitingText.setText('Le chrono commence a la premiere direction.');
      return;
    }

    this.statusText.setVisible(true);
    this.waitingText.setVisible(false);
    this.statusText.setText('Attrape Rogie avant la fin du temps.');
  }
}

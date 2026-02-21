import Phaser from 'phaser';
import { collectTalentEffectIds, loadMetaState, saveMetaState } from '../game/metaState';
import { createInitialRunState, queueDirection, stepRun } from '../game/runState';
import { ensureRogieSpawn } from '../game/spawnSystem';
import type { Direction, GridSize, MetaState, RunState } from '../game/types';
import { isVisibleFromHead } from '../game/visibility';

const GRID: GridSize = { cols: 20, rows: 20 };
const CELL_SIZE = 24;
const BOARD_WIDTH = GRID.cols * CELL_SIZE;
const BOARD_HEIGHT = GRID.rows * CELL_SIZE;
const BOARD_OFFSET_X = 24;
const BOARD_OFFSET_Y = 72;
const HUD_BG_COLOR = 0x111829;
const BUTTON_PRIMARY = 0x396dff;
const BUTTON_PRIMARY_HOVER = 0x4b7dff;
const BUTTON_PRIMARY_PRESS = 0x2d5de3;

export class GameScene extends Phaser.Scene {
  private runState!: RunState;

  private meta!: MetaState;

  private graphics!: Phaser.GameObjects.Graphics;

  private hudBg!: Phaser.GameObjects.Rectangle;

  private scoreText!: Phaser.GameObjects.Text;

  private runInfoText!: Phaser.GameObjects.Text;

  private statusText!: Phaser.GameObjects.Text;

  private waitingText!: Phaser.GameObjects.Text;

  private endOverlayBg!: Phaser.GameObjects.Rectangle;

  private endTitleText!: Phaser.GameObjects.Text;

  private endSubtitleText!: Phaser.GameObjects.Text;

  private endStatsText!: Phaser.GameObjects.Text;

  private restartButtonBg!: Phaser.GameObjects.Rectangle;

  private restartButtonText!: Phaser.GameObjects.Text;

  private upgradeButtonBg!: Phaser.GameObjects.Rectangle;

  private upgradeButtonText!: Phaser.GameObjects.Text;

  private upgradeHintText!: Phaser.GameObjects.Text;

  private tickAccumulatorMs = 0;

  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#101622');
    this.meta = loadMetaState();
    this.runState = this.createFreshRunState();
    this.graphics = this.add.graphics();
    this.hudBg = this.add
      .rectangle(BOARD_OFFSET_X + BOARD_WIDTH / 2, 34, BOARD_WIDTH, 54, HUD_BG_COLOR, 0.92)
      .setStrokeStyle(1, 0x2d3958)
      .setDepth(0);

    this.scoreText = this.add.text(24, 20, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#f4f8ff',
    });

    this.runInfoText = this.add.text(24, 42, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#b8c7eb',
    });

    this.statusText = this.add.text(24, BOARD_OFFSET_Y + BOARD_HEIGHT + 16, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#d7e2ff',
    });

    this.waitingText = this.add
      .text(24, BOARD_OFFSET_Y + BOARD_HEIGHT + 16, "Appuie sur une direction pour lancer la run.", {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffe2a8',
      })
      .setVisible(false);

    this.createEndScreenUi();
    this.registerInputs();
    this.redraw();
  }

  update(_time: number, deltaMs: number) {
    if (this.runState.phase === 'running') {
      this.tickAccumulatorMs += deltaMs;

      while (this.tickAccumulatorMs >= this.runState.stats.tickMs && this.runState.phase === 'running') {
        this.tickAccumulatorMs -= this.runState.stats.tickMs;
        stepRun(this.runState, GRID, this.time.now, this.runState.stats.tickMs);
      }
    } else if (this.runState.phase === 'ended' && !this.runState.runCommitted) {
      this.meta.totalPoints += this.runState.score;
      this.meta.runCount += 1;
      saveMetaState(this.meta);
      this.runState.runCommitted = true;
    }

    this.redraw();
  }

  private registerInputs() {
    const bindDirection = (key: string, direction: Direction) => {
      this.input.keyboard?.on(`keydown-${key}`, () => {
        queueDirection(this.runState, direction, this.time.now);
      });
    };

    bindDirection('UP', 'up');
    bindDirection('W', 'up');
    bindDirection('DOWN', 'down');
    bindDirection('S', 'down');
    bindDirection('LEFT', 'left');
    bindDirection('A', 'left');
    bindDirection('RIGHT', 'right');
    bindDirection('D', 'right');

    this.input.keyboard?.on('keydown-R', () => {
      this.restartRun();
    });
  }

  private createFreshRunState(): RunState {
    const state = createInitialRunState(GRID, collectTalentEffectIds(this.meta), this.time.now);
    ensureRogieSpawn(state, GRID, this.time.now);
    return state;
  }

  private restartRun() {
    this.tickAccumulatorMs = 0;
    this.runState = this.createFreshRunState();
    this.redraw();
  }

  private createEndScreenUi() {
    const centerX = BOARD_OFFSET_X + BOARD_WIDTH / 2;
    const centerY = BOARD_OFFSET_Y + BOARD_HEIGHT / 2;

    this.endOverlayBg = this.add
      .rectangle(centerX, centerY, BOARD_WIDTH, BOARD_HEIGHT, 0x060810, 1)
      .setStrokeStyle(1, 0x303955)
      .setVisible(false);

    this.endTitleText = this.add
      .text(centerX, centerY - 150, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        color: '#f5f7ff',
        align: 'center',
        wordWrap: { width: BOARD_WIDTH - 48 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.endSubtitleText = this.add
      .text(centerX, centerY - 95, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#cdd8f0',
        align: 'center',
        wordWrap: { width: BOARD_WIDTH - 64 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.endStatsText = this.add
      .text(centerX, centerY - 15, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#f0f4ff',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: BOARD_WIDTH - 56 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.restartButtonBg = this.add
      .rectangle(centerX, centerY + 95, 280, 52, BUTTON_PRIMARY, 1)
      .setStrokeStyle(2, 0x87a8ff)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.restartButtonBg.on('pointerdown', () => {
      this.restartButtonBg.setFillStyle(BUTTON_PRIMARY_PRESS, 1);
      this.restartRun();
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

    this.restartButtonText = this.add
      .text(centerX, centerY + 95, 'Relancer une run', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.upgradeButtonBg = this.add
      .rectangle(centerX, centerY + 162, 280, 52, 0x2f3340, 1)
      .setStrokeStyle(2, 0x4c5368)
      .setVisible(false);

    this.upgradeButtonText = this.add
      .text(centerX, centerY + 162, 'Ameliorer la limace', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        color: '#9da3b8',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.upgradeHintText = this.add
      .text(centerX, centerY + 198, 'Disponible bientot', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#7f889f',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private setEndScreenVisible(visible: boolean) {
    this.endOverlayBg.setVisible(visible);
    this.endTitleText.setVisible(visible);
    this.endSubtitleText.setVisible(visible);
    this.endStatsText.setVisible(visible);
    this.restartButtonBg.setVisible(visible);
    this.restartButtonText.setVisible(visible);
    this.upgradeButtonBg.setVisible(visible);
    this.upgradeButtonText.setVisible(visible);
    this.upgradeHintText.setVisible(visible);
  }

  private redraw() {
    this.graphics.clear();
    if (this.runState.phase === 'ended') {
      this.setEndScreenVisible(true);
      this.drawEndScreen();
      this.hudBg.setVisible(false);
      this.scoreText.setVisible(false);
      this.runInfoText.setVisible(false);
      this.statusText.setVisible(false);
      this.waitingText.setVisible(false);
      return;
    }

    this.setEndScreenVisible(false);
    this.hudBg.setVisible(true);
    this.scoreText.setVisible(true);
    this.runInfoText.setVisible(true);
    this.statusText.setVisible(true);

    this.drawBoard();
    this.drawEntities();
    this.drawSlug();
    this.drawFog();
    this.drawHud();
  }

  private drawBoard() {
    this.graphics.fillStyle(0x1a2233, 1);
    this.graphics.fillRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, BOARD_WIDTH, BOARD_HEIGHT);

    this.graphics.lineStyle(1, 0x2f3a55, 0.5);
    for (let c = 0; c <= GRID.cols; c += 1) {
      const x = BOARD_OFFSET_X + c * CELL_SIZE;
      this.graphics.lineBetween(x, BOARD_OFFSET_Y, x, BOARD_OFFSET_Y + BOARD_HEIGHT);
    }
    for (let r = 0; r <= GRID.rows; r += 1) {
      const y = BOARD_OFFSET_Y + r * CELL_SIZE;
      this.graphics.lineBetween(BOARD_OFFSET_X, y, BOARD_OFFSET_X + BOARD_WIDTH, y);
    }
  }

  private drawEntities() {
    const head = this.runState.slug[0];
    const radius = this.runState.stats.baseVisionRadius;

    this.runState.entities.forEach((entity) => {
      if (!isVisibleFromHead(entity.position, head, radius)) {
        return;
      }

      const x = BOARD_OFFSET_X + entity.position.x * CELL_SIZE + CELL_SIZE / 2;
      const y = BOARD_OFFSET_Y + entity.position.y * CELL_SIZE + CELL_SIZE / 2;

      switch (entity.kind) {
        case 'rogie':
          this.graphics.fillStyle(0xffd35f, 1);
          this.graphics.fillCircle(x, y, CELL_SIZE * 0.38);
          break;
        default:
          break;
      }
    });
  }

  private drawSlug() {
    this.runState.slug.forEach((segment, index) => {
      const x = BOARD_OFFSET_X + segment.x * CELL_SIZE + 2;
      const y = BOARD_OFFSET_Y + segment.y * CELL_SIZE + 2;
      const size = CELL_SIZE - 4;

      this.graphics.fillStyle(index === 0 ? 0x8ed76f : 0x5bbf68, 1);
      this.graphics.fillRoundedRect(x, y, size, size, 6);
    });
  }

  private drawFog() {
    const head = this.runState.slug[0];
    const radius = this.runState.stats.baseVisionRadius;

    this.graphics.fillStyle(0x05070c, 1);
    for (let y = 0; y < GRID.rows; y += 1) {
      for (let x = 0; x < GRID.cols; x += 1) {
        if (isVisibleFromHead({ x, y }, head, radius)) {
          continue;
        }
        this.graphics.fillRect(
          BOARD_OFFSET_X + x * CELL_SIZE,
          BOARD_OFFSET_Y + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        );
      }
    }
  }

  private drawHud() {
    const timeLeft = Math.ceil(this.runState.remainingMs / 1000);
    this.scoreText.setText(
      `Run: ${this.runState.score} pts   |   Total: ${this.meta.totalPoints} pts   |   Vies: ${this.runState.lives}`,
    );
    this.runInfoText.setText(
      `Temps restant: ${timeLeft}s   |   Vision: ${this.runState.stats.baseVisionRadius}   |   Bord: ${this.runState.boundaryMode}`,
    );

    if (this.runState.phase === 'waiting_start') {
      this.statusText.setVisible(false);
      this.waitingText.setVisible(true);
      this.waitingText.setText('Le chrono commence a la premiere direction.');
      return;
    }

    this.statusText.setVisible(true);
    this.waitingText.setVisible(false);
    this.statusText.setText('Attrape Rogie avant la fin du temps.');
  }

  private resolveEndSubtitle(): string {
    switch (this.runState.deathReason) {
      case 'wall_collision':
        return "La collision avec un mur t'a arrete.";
      case 'self_collision':
        return "Tu t'es percute toi-meme.";
      case 'timer_end':
        return "Le temps est ecoule, Rogie s'est echappe.";
      case 'no_lives':
        return "Tu n'as plus de vie.";
      default:
        return 'La run est terminee.';
    }
  }

  private drawEndScreen() {
    const survivalMs =
      this.runState.startedAtMs === null || this.runState.endedAtMs === null
        ? 0
        : Math.max(0, this.runState.endedAtMs - this.runState.startedAtMs);
    const survivalSec = Math.floor(survivalMs / 1000);

    this.endTitleText.setText("L'important, c'est de faire de son mieux");
    this.endSubtitleText.setText(this.resolveEndSubtitle());
    this.endStatsText.setText(
      `Points obtenus: ${this.runState.score}\nPoints totaux: ${this.meta.totalPoints}\nTemps de survie: ${survivalSec}s`,
    );
  }
}

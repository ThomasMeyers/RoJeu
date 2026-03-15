import Phaser from 'phaser';
import {
  collectTalentEffectIds,
  getStoreTalentItems,
  loadMetaState,
  saveMetaState,
  upgradeTalentLevel,
} from '../game/metaState';
import { commitSudoku, createInitialRunState, getCurrentTickMs, getCurrentVisionRadius, queueDirection, stepRun } from '../game/runState';
import { ensureOrbSpawn } from '../game/spawnSystem';
import { getPickupDefinitionById } from '../game/pickupCatalog';
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
const BUTTON_DISABLED = 0x343848;
const BUTTON_SECONDARY = 0x2e5fd8;
const BUTTON_SECONDARY_HOVER = 0x3d6fe6;
const BUTTON_SECONDARY_PRESS = 0x2650b6;
const STORE_OVERLAY_BG = 0x0a0e17;
const STORE_CARD_BG = 0x1b2233;
const STORE_CARD_BORDER = 0x364563;
const STORE_CARD_IMAGE_BG = 0x2b3856;
const STORE_POPUP_BG = 0x0f1523;
const STORE_CARD_LOCKED_BG = 0x121621;
const STORE_CARD_LOCKED_BORDER = 0x2a3144;
const STORE_CARD_LOCKED_IMAGE_BG = 0x1c2538;

interface StoreCardUi {
  talentId: string;
  baseCenterY: number;
  bg: Phaser.GameObjects.Rectangle;
  imageBg: Phaser.GameObjects.Rectangle;
  imageText: Phaser.GameObjects.Text;
  titleText: Phaser.GameObjects.Text;
  lockText: Phaser.GameObjects.Text;
  requirementText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private runState!: RunState;

  private meta!: MetaState;

  private isPaused = false;

  private sudokuButtonBg!: Phaser.GameObjects.Rectangle;

  private sudokuButtonText!: Phaser.GameObjects.Text;

  private graphics!: Phaser.GameObjects.Graphics;

  private coffeeOrbTexts: Phaser.GameObjects.Text[] = [];
  private coffeeOrbIndex = 0;


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

  private isStoreOpen = false;

  private selectedStoreTalentId: string | null = null;

  private storeOverlayBg!: Phaser.GameObjects.Rectangle;

  private storeTitleText!: Phaser.GameObjects.Text;

  private storePointsText!: Phaser.GameObjects.Text;

  private storeCloseBg!: Phaser.GameObjects.Rectangle;

  private storeCloseText!: Phaser.GameObjects.Text;

  private storeCardUis: StoreCardUi[] = [];

  private storeHeaderBg!: Phaser.GameObjects.Rectangle;

  private storeHeaderSeparator!: Phaser.GameObjects.Graphics;

  private storePopupBg!: Phaser.GameObjects.Rectangle;

  private storePopupCloseText!: Phaser.GameObjects.Text;

  private storePopupImageBg!: Phaser.GameObjects.Rectangle;

  private storePopupImageText!: Phaser.GameObjects.Text;

  private storePopupTitleText!: Phaser.GameObjects.Text;

  private storePopupDescriptionText!: Phaser.GameObjects.Text;

  private storePopupUpgradeBg!: Phaser.GameObjects.Rectangle;

  private storePopupUpgradeText!: Phaser.GameObjects.Text;

  private storeScrollY = 0;

  private storeMaxScrollY = 0;

  private storeCardHeight = 0;

  private storeImgOffsetY = 0;

  private storeTitleOffsetY = 0;

  private storeBadgeOffsetY = 0;

  private storeScrollUpIndicator!: Phaser.GameObjects.Text;

  private storeScrollDownIndicator!: Phaser.GameObjects.Text;

  private tickAccumulatorMs = 0;

  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#101622');
    this.meta = loadMetaState();
    this.runState = this.createFreshRunState();
    this.graphics = this.add.graphics();
    for (let i = 0; i < 3; i += 1) {
      this.coffeeOrbTexts.push(
        this.add.text(0, 0, '☕', { fontSize: '16px' }).setOrigin(0.5).setVisible(false).setDepth(10),
      );
    }
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
    this.createStoreUi();
    this.createSudokuButton();
    this.registerInputs();
    this.redraw();
  }

  update(_time: number, deltaMs: number) {
    if (this.runState.phase === 'running' && !this.isPaused) {
      this.tickAccumulatorMs += deltaMs;

      while (this.tickAccumulatorMs >= getCurrentTickMs(this.runState, this.time.now) && this.runState.phase === 'running') {
        const tickMs = getCurrentTickMs(this.runState, this.time.now);
        this.tickAccumulatorMs -= tickMs;
        stepRun(this.runState, GRID, this.time.now, tickMs);
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

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.runState.phase === 'running') {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
          this.tickAccumulatorMs = 0;
        }
      }
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (!this.isStoreOpen || this.selectedStoreTalentId) return;
      this.storeScrollY = Phaser.Math.Clamp(this.storeScrollY + deltaY * 0.5, 0, this.storeMaxScrollY);
      this.refreshStoreUi();
    });
  }

  private createSudokuButton() {
    const btnX = BOARD_OFFSET_X + BOARD_WIDTH - 78;
    const btnY = BOARD_OFFSET_Y + BOARD_HEIGHT + 24;
    const BG_NORMAL = 0x5c2020;
    const BG_HOVER = 0x7a2a2a;
    const BG_PRESS = 0x4a1818;

    this.sudokuButtonBg = this.add
      .rectangle(btnX, btnY, 140, 32, BG_NORMAL, 1)
      .setStrokeStyle(1, 0x9e3a3a)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.sudokuButtonBg.on('pointerover', () => this.sudokuButtonBg.setFillStyle(BG_HOVER));
    this.sudokuButtonBg.on('pointerout', () => this.sudokuButtonBg.setFillStyle(BG_NORMAL));
    this.sudokuButtonBg.on('pointerup', () => this.sudokuButtonBg.setFillStyle(BG_HOVER));
    this.sudokuButtonBg.on('pointerdown', () => {
      this.sudokuButtonBg.setFillStyle(BG_PRESS);
      if (this.runState.phase === 'running') {
        commitSudoku(this.runState, this.time.now);
        this.redraw();
      }
    });

    this.sudokuButtonText = this.add
      .text(btnX, btnY, 'Commit sudoku', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#ffb3b3',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private createFreshRunState(): RunState {
    const state = createInitialRunState(GRID, collectTalentEffectIds(this.meta), this.time.now);
    ensureOrbSpawn(state, GRID, this.time.now);
    return state;
  }

  private restartRun() {
    this.tickAccumulatorMs = 0;
    this.isPaused = false;
    this.closeStore();
    this.runState = this.createFreshRunState();
    this.redraw();
  }

  private setEndScreenButtonsInteractive(enabled: boolean) {
    if (enabled) {
      this.restartButtonBg.setInteractive({ useHandCursor: true });
      this.upgradeButtonBg.setInteractive({ useHandCursor: true });
      return;
    }
    this.restartButtonBg.disableInteractive();
    this.upgradeButtonBg.disableInteractive();
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
      .rectangle(centerX, centerY + 162, 280, 52, BUTTON_SECONDARY, 1)
      .setStrokeStyle(2, 0x7ea4ff)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.upgradeButtonBg.on('pointerdown', () => {
      if (this.runState.phase !== 'ended') {
        return;
      }
      this.upgradeButtonBg.setFillStyle(BUTTON_SECONDARY_PRESS, 1);
      this.openStore();
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

    this.upgradeButtonText = this.add
      .text(centerX, centerY + 162, 'Ameliorer la limace', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.upgradeHintText = this.add
      .text(centerX, centerY + 198, 'Ouvre la boutique des talents', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#7f889f',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private createStoreUi() {
    const centerX = BOARD_OFFSET_X + BOARD_WIDTH / 2;
    const centerY = BOARD_OFFSET_Y + BOARD_HEIGHT / 2;
    const storeItems = getStoreTalentItems(this.meta);
    const cardWidth = 142;
    const cardGap = 12;
    const rowGap = 10;
    const rows = Array.from(new Set(storeItems.map((item) => item.storeRow))).sort((a, b) => a - b);
    const rowItemsMap = new Map<number, typeof storeItems>();
    storeItems.forEach((item) => {
      const entries = rowItemsMap.get(item.storeRow) ?? [];
      entries.push(item);
      rowItemsMap.set(item.storeRow, entries);
    });
    rowItemsMap.forEach((items) => items.sort((a, b) => a.storeOrder - b.storeOrder));
    // Fixed card size — scrolling handles overflow when there are many rows.
    const STORE_HEADER_H = 76; // space reserved for title + points line
    const STORE_FOOTER_H = 8;  // bottom margin
    const cardHeight = 162;
    const availableH = BOARD_HEIGHT - STORE_HEADER_H - STORE_FOOTER_H;
    const imgSize = 72;
    const imgOffsetY = -36;
    const titleFontPx = 14;
    const titleOffsetY = 10;
    const badgeFontPx = 13;
    const badgeOffsetY = 58;
    const imageTokenFontPx = 22;
    const costFontPx = 16;
    // Center the card grid in the available area; scroll handles any overflow.
    // Clamp so row 1 is never above the header bottom — when totalRowsHeight > availableH
    // the centering formula overflows both top and bottom; the clamp removes the top overflow.
    const totalRowsHeight = rows.length * cardHeight + Math.max(0, rows.length - 1) * rowGap;
    const cardsAreaCenterY = BOARD_OFFSET_Y + STORE_HEADER_H + availableH / 2;
    const topBound = BOARD_OFFSET_Y + STORE_HEADER_H;
    const firstRowCenterY = Math.max(
      Math.round(cardsAreaCenterY - totalRowsHeight / 2 + cardHeight / 2),
      topBound + cardHeight / 2,
    );

    this.storeOverlayBg = this.add
      .rectangle(centerX, centerY, BOARD_WIDTH, BOARD_HEIGHT, STORE_OVERLAY_BG, 0.96)
      .setDepth(40)
      .setVisible(false);

    // Header mask — covers any cards that scroll under (or above) the header zone.
    // Extends 200px above BOARD_OFFSET_Y so cards never peek above the board.
    const maskExtraTop = 200;
    const maskHeight = STORE_HEADER_H + maskExtraTop;
    const maskCenterY = BOARD_OFFSET_Y + STORE_HEADER_H - maskHeight / 2;
    this.storeHeaderBg = this.add
      .rectangle(centerX, maskCenterY, BOARD_WIDTH, maskHeight, STORE_OVERLAY_BG, 1)
      .setDepth(44)
      .setVisible(false);

    this.storeHeaderSeparator = this.add.graphics()
      .lineStyle(1, 0x2a3a5c, 0.8)
      .lineBetween(BOARD_OFFSET_X, BOARD_OFFSET_Y + STORE_HEADER_H, BOARD_OFFSET_X + BOARD_WIDTH, BOARD_OFFSET_Y + STORE_HEADER_H)
      .setDepth(44)
      .setVisible(false);

    this.storeTitleText = this.add
      .text(centerX, BOARD_OFFSET_Y + 28, 'Boutique de la limace', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        color: '#eef3ff',
      })
      .setOrigin(0.5)
      .setDepth(45)
      .setVisible(false);

    this.storePointsText = this.add
      .text(BOARD_OFFSET_X + 20, BOARD_OFFSET_Y + 52, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#ffd892',
      })
      .setDepth(45)
      .setVisible(false);

    this.storeCloseBg = this.add
      .rectangle(BOARD_OFFSET_X + BOARD_WIDTH - 26, BOARD_OFFSET_Y + 24, 28, 28, 0x2f3b56, 1)
      .setStrokeStyle(1, 0x596a90)
      .setInteractive({ useHandCursor: true })
      .setDepth(50)
      .setVisible(false);
    this.storeCloseBg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.closeStore();
    });

    this.storeCloseText = this.add
      .text(BOARD_OFFSET_X + BOARD_WIDTH - 26, BOARD_OFFSET_Y + 24, 'X', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(51)
      .setVisible(false);

    this.storeCardUis = [];
    rows.forEach((row, rowIndex) => {
      const rowItems = rowItemsMap.get(row) ?? [];
      const rowWidth = rowItems.length * cardWidth + Math.max(0, rowItems.length - 1) * cardGap;
      const rowStartX = centerX - rowWidth / 2 + cardWidth / 2;
      const cardY = firstRowCenterY + rowIndex * (cardHeight + rowGap);

      rowItems.forEach((item, itemIndex) => {
        const cardCenterX = rowStartX + itemIndex * (cardWidth + cardGap);
        const bg = this.add
          .rectangle(cardCenterX, cardY, cardWidth, cardHeight, STORE_CARD_BG, 1)
          .setStrokeStyle(2, STORE_CARD_BORDER)
          .setInteractive({ useHandCursor: true })
          .setDepth(41)
          .setVisible(false);
        bg.on(
          'pointerdown',
          (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (this.selectedStoreTalentId) {
              return;
            }
            this.openStoreTalentDetails(item.id);
          },
        );

        const imageBg = this.add
          .rectangle(cardCenterX, cardY + imgOffsetY, imgSize, imgSize, STORE_CARD_IMAGE_BG, 1)
          .setStrokeStyle(1, 0x6178ad)
          .setDepth(42)
          .setVisible(false);

        const imageText = this.add
          .text(cardCenterX, cardY + imgOffsetY, item.imageToken, {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${imageTokenFontPx}px`,
            color: '#d9e5ff',
          })
          .setOrigin(0.5)
          .setDepth(43)
          .setVisible(false);

        const titleText = this.add
          .text(cardCenterX, cardY + titleOffsetY, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${titleFontPx}px`,
            color: '#f3f6ff',
            align: 'center',
            wordWrap: { width: cardWidth - 16 },
          })
          .setOrigin(0.5)
          .setDepth(42)
          .setVisible(false);

        const lockText = this.add
          .text(cardCenterX, cardY + badgeOffsetY, 'LOCK', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${badgeFontPx}px`,
            color: '#95a0ba',
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(42)
          .setVisible(false);

        // requirementText is kept for interface compatibility but not shown on cards
        // (full requirement is shown in the detail popup).
        const requirementText = this.add
          .text(cardCenterX, cardY + badgeOffsetY, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#8f9ab3',
            align: 'center',
            wordWrap: { width: cardWidth - 18 },
          })
          .setOrigin(0.5)
          .setDepth(42)
          .setVisible(false);

        const costText = this.add
          .text(cardCenterX, cardY + badgeOffsetY, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${costFontPx}px`,
            color: '#ffd892',
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(42)
          .setVisible(false);

        this.storeCardUis.push({
          talentId: item.id,
          baseCenterY: cardY,
          bg,
          imageBg,
          imageText,
          titleText,
          lockText,
          requirementText,
          costText,
        });
      });
    });

    // Store layout constants for use in refreshStoreUi.
    this.storeCardHeight = cardHeight;
    this.storeImgOffsetY = imgOffsetY;
    this.storeTitleOffsetY = titleOffsetY;
    this.storeBadgeOffsetY = badgeOffsetY;
    this.storeMaxScrollY = Math.max(0, totalRowsHeight - availableH);

    // Scroll indicators — shown when more content exists above/below the visible area.
    const bottomBound = BOARD_OFFSET_Y + BOARD_HEIGHT - STORE_FOOTER_H;
    this.storeScrollUpIndicator = this.add
      .text(centerX, topBound + 12, '▲', { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#8a9cc0' })
      .setOrigin(0.5)
      .setDepth(49)
      .setVisible(false);
    this.storeScrollDownIndicator = this.add
      .text(centerX, bottomBound - 12, '▼', { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#8a9cc0' })
      .setOrigin(0.5)
      .setDepth(49)
      .setVisible(false);

    this.storePopupBg = this.add
      .rectangle(centerX, centerY + 8, 360, 262, STORE_POPUP_BG, 1)
      .setStrokeStyle(2, 0x4f618d)
      .setDepth(45)
      .setVisible(false);

    this.storePopupCloseText = this.add
      .text(centerX + 164, centerY - 110, 'X', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#ffffff',
      })
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5)
      .setDepth(46)
      .setVisible(false);
    this.storePopupCloseText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
      this.closeStoreTalentDetails();
      },
    );

    this.storePopupImageBg = this.add
      .rectangle(centerX - 132, centerY - 76, 78, 78, STORE_CARD_IMAGE_BG, 1)
      .setStrokeStyle(1, 0x6178ad)
      .setDepth(46)
      .setVisible(false);

    this.storePopupImageText = this.add
      .text(centerX - 132, centerY - 76, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#d9e5ff',
      })
      .setOrigin(0.5)
      .setDepth(47)
      .setVisible(false);

    this.storePopupTitleText = this.add
      .text(centerX - 74, centerY - 90, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#f2f6ff',
        wordWrap: { width: 236 },
      })
      .setDepth(46)
      .setVisible(false);

    this.storePopupDescriptionText = this.add
      .text(centerX - 132, centerY - 24, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#c4d0e8',
        align: 'left',
        wordWrap: { width: 300 },
      })
      .setDepth(46)
      .setVisible(false);

    this.storePopupUpgradeBg = this.add
      .rectangle(centerX, centerY + 88, 284, 64, BUTTON_PRIMARY, 1)
      .setStrokeStyle(2, 0x87a8ff)
      .setInteractive({ useHandCursor: true })
      .setDepth(46)
      .setVisible(false);
    this.storePopupUpgradeBg.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
      if (!this.selectedStoreTalentId) {
        return;
      }
      if (upgradeTalentLevel(this.meta, this.selectedStoreTalentId)) {
        this.refreshStoreUi();
      }
      },
    );

    this.storePopupUpgradeText = this.add
      .text(centerX, centerY + 88, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 252 },
      })
      .setOrigin(0.5)
      .setDepth(47)
      .setVisible(false);
  }

  private openStore() {
    this.isStoreOpen = true;
    this.storeScrollY = 0;
    this.selectedStoreTalentId = null;
    this.setEndScreenButtonsInteractive(false);
    this.setStorePopupVisible(false);
    this.refreshStoreUi();
  }

  private closeStore() {
    this.isStoreOpen = false;
    this.selectedStoreTalentId = null;
    this.setEndScreenButtonsInteractive(true);
    this.setStoreVisible(false);
    this.setStorePopupVisible(false);
  }

  private openStoreTalentDetails(talentId: string) {
    this.selectedStoreTalentId = talentId;
    this.setStorePopupVisible(true);
    this.refreshStoreUi();
  }

  private closeStoreTalentDetails() {
    this.selectedStoreTalentId = null;
    this.setStorePopupVisible(false);
  }

  private setStoreVisible(visible: boolean) {
    this.storeOverlayBg.setVisible(visible);
    this.storeHeaderBg.setVisible(visible);
    this.storeHeaderSeparator.setVisible(visible);
    this.storeTitleText.setVisible(visible);
    this.storePointsText.setVisible(visible);
    this.storeCloseBg.setVisible(visible);
    this.storeCloseText.setVisible(visible);
    this.storeScrollUpIndicator.setVisible(visible && this.storeScrollY > 0);
    this.storeScrollDownIndicator.setVisible(visible && this.storeScrollY < this.storeMaxScrollY);
    this.storeCardUis.forEach((card) => {
      card.bg.setVisible(visible);
      card.imageBg.setVisible(visible);
      card.imageText.setVisible(visible);
      card.titleText.setVisible(visible);
      card.lockText.setVisible(visible);
      card.requirementText.setVisible(visible);
      card.costText.setVisible(visible);
    });
  }

  private setStorePopupVisible(visible: boolean) {
    this.storePopupBg.setVisible(visible);
    this.storePopupCloseText.setVisible(visible);
    this.storePopupImageBg.setVisible(visible);
    this.storePopupImageText.setVisible(visible);
    this.storePopupTitleText.setVisible(visible);
    this.storePopupDescriptionText.setVisible(visible);
    this.storePopupUpgradeBg.setVisible(visible);
    this.storePopupUpgradeText.setVisible(visible);
    this.storeCardUis.forEach((card) => {
      if (visible) {
        card.bg.disableInteractive();
      } else {
        card.bg.setInteractive({ useHandCursor: true });
      }
    });
  }

  private refreshStoreUi() {
    const storeItems = getStoreTalentItems(this.meta);
    this.storePointsText.setText(`Points dispo: ${this.meta.totalPoints} p.`);
    const topBound = BOARD_OFFSET_Y + 76;  // STORE_HEADER_H
    const bottomBound = BOARD_OFFSET_Y + BOARD_HEIGHT - 8;  // STORE_FOOTER_H
    const halfH = this.storeCardHeight / 2;
    this.storeCardUis.forEach((card) => {
      const item = storeItems.find((entry) => entry.id === card.talentId);
      if (!item) {
        card.bg.setVisible(false);
        card.imageBg.setVisible(false);
        card.imageText.setVisible(false);
        card.titleText.setVisible(false);
        card.lockText.setVisible(false);
        card.requirementText.setVisible(false);
        card.costText.setVisible(false);
        return;
      }

      // Apply scroll offset and clip cards outside the visible area.
      const displayY = card.baseCenterY - this.storeScrollY;
      if (displayY + halfH <= topBound || displayY - halfH >= bottomBound) {
        card.bg.setVisible(false);
        card.imageBg.setVisible(false);
        card.imageText.setVisible(false);
        card.titleText.setVisible(false);
        card.lockText.setVisible(false);
        card.requirementText.setVisible(false);
        card.costText.setVisible(false);
        return;
      }
      card.bg.setY(displayY);
      card.imageBg.setY(displayY + this.storeImgOffsetY);
      card.imageText.setY(displayY + this.storeImgOffsetY);
      card.titleText.setY(displayY + this.storeTitleOffsetY);
      card.lockText.setY(displayY + this.storeBadgeOffsetY);
      card.requirementText.setY(displayY + this.storeBadgeOffsetY);
      card.costText.setY(displayY + this.storeBadgeOffsetY);

      card.imageText.setText(item.imageToken);
      if (!item.isUnlocked) {
        card.bg.setFillStyle(STORE_CARD_LOCKED_BG, 1);
        card.bg.setStrokeStyle(2, STORE_CARD_LOCKED_BORDER);
        card.imageBg.setFillStyle(STORE_CARD_LOCKED_IMAGE_BG, 1);
        card.imageBg.setStrokeStyle(1, 0x4a5879);
        card.imageText.setColor('#8d9ab5');
        card.titleText.setText(item.title);
        card.titleText.setColor('#b1bad0');
        card.lockText.setText('LOCK');
        card.lockText.setVisible(true);
        card.requirementText.setText(item.unlockRequirementText ?? 'Prerequis manquant');
        card.requirementText.setVisible(false); // full requirement shown in detail popup, not on card
        card.costText.setVisible(false);
      } else {
        card.bg.setFillStyle(STORE_CARD_BG, 1);
        card.bg.setStrokeStyle(2, STORE_CARD_BORDER);
        card.imageBg.setFillStyle(STORE_CARD_IMAGE_BG, 1);
        card.imageBg.setStrokeStyle(1, 0x6178ad);
        card.imageText.setColor('#d9e5ff');
        card.titleText.setText(`${item.title} (${item.level}/${item.maxLevel})`);
        card.titleText.setColor('#f3f6ff');
        card.lockText.setVisible(false);
        card.requirementText.setVisible(false);
        card.costText.setVisible(true);
        if (item.isMaxed) {
          card.costText.setText('MAX');
          card.costText.setColor('#aeb8d1');
        } else if (item.nextCost === null) {
          card.costText.setText('---');
          card.costText.setColor('#aeb8d1');
        } else {
          card.costText.setText(`${item.nextCost} p.`);
          card.costText.setColor('#ffd892');
        }
      }
    });

    this.storeScrollUpIndicator.setVisible(this.storeScrollY > 0);
    this.storeScrollDownIndicator.setVisible(this.storeScrollY < this.storeMaxScrollY);

    if (!this.selectedStoreTalentId) {
      return;
    }

    const selected = storeItems.find((item) => item.id === this.selectedStoreTalentId);
    if (!selected) {
      this.closeStoreTalentDetails();
      return;
    }
    this.storePopupImageText.setText(selected.imageToken);
    this.storePopupTitleText.setText(
      selected.isUnlocked ? `${selected.title} (${selected.level}/${selected.maxLevel})` : `${selected.title} (LOCK)`,
    );
    this.storePopupDescriptionText.setText(selected.description);

    if (!selected.isUnlocked) {
      this.storePopupUpgradeText.setText(selected.unlockRequirementText ?? 'Prerequis manquant.');
      this.storePopupUpgradeBg.setFillStyle(BUTTON_DISABLED, 1);
      this.storePopupUpgradeBg.disableInteractive();
      return;
    }

    if (selected.isMaxed) {
      this.storePopupUpgradeText.setText('MAX atteint');
      this.storePopupUpgradeBg.setFillStyle(BUTTON_DISABLED, 1);
      this.storePopupUpgradeBg.disableInteractive();
      return;
    }

    const labelCost = selected.nextCost ?? 0;
    this.storePopupUpgradeText.setText(`Ameliorer pour ${labelCost}p.`);
    if (selected.canUpgrade) {
      this.storePopupUpgradeBg.setFillStyle(BUTTON_PRIMARY, 1);
      this.storePopupUpgradeBg.setInteractive({ useHandCursor: true });
    } else {
      this.storePopupUpgradeBg.setFillStyle(BUTTON_DISABLED, 1);
      this.storePopupUpgradeBg.disableInteractive();
    }
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
    if (visible) {
      this.sudokuButtonBg.setVisible(false);
      this.sudokuButtonText.setVisible(false);
    }
  }

  private redraw() {
    this.graphics.clear();
    this.coffeeOrbTexts.forEach((t) => t.setVisible(false));
    this.coffeeOrbIndex = 0;
    if (this.runState.phase === 'ended') {
      this.setEndScreenVisible(true);
      this.drawEndScreen();
      if (this.isStoreOpen) {
        this.setStoreVisible(true);
        this.refreshStoreUi();
      } else {
        this.setStoreVisible(false);
        this.setStorePopupVisible(false);
      }
      this.hudBg.setVisible(false);
      this.scoreText.setVisible(false);
      this.runInfoText.setVisible(false);
      this.statusText.setVisible(false);
      this.waitingText.setVisible(false);
      return;
    }

    this.closeStore();
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
    const radius = getCurrentVisionRadius(this.runState, this.time.now);

    this.runState.entities.forEach((entity) => {
      if (!isVisibleFromHead(entity.position, head, radius)) {
        return;
      }

      const x = BOARD_OFFSET_X + entity.position.x * CELL_SIZE + CELL_SIZE / 2;
      const y = BOARD_OFFSET_Y + entity.position.y * CELL_SIZE + CELL_SIZE / 2;

      switch (entity.kind) {
        case 'orb':
          this.drawFriendOrb(x, y);
          break;
        case 'pickup': {
          if (entity.pickupTypeId === 'speed_boost_orb' && this.coffeeOrbIndex < this.coffeeOrbTexts.length) {
            this.coffeeOrbTexts[this.coffeeOrbIndex].setPosition(x, y).setVisible(true);
            this.coffeeOrbIndex += 1;
          } else if (entity.pickupTypeId === 'vision_clarity_orb') {
            this.drawBulbOrb(x, y);
          } else {
            const pickupDefinition = getPickupDefinitionById(entity.pickupTypeId);
            this.graphics.fillStyle(pickupDefinition?.color ?? 0xffffff, 1);
            this.graphics.fillCircle(x, y, CELL_SIZE * 0.34);
          }
          break;
        }
        default:
          break;
      }
    });
  }

  private drawSlug() {
    const slug = this.runState.slug;
    if (slug.length === 0) return;

    const dir = this.runState.direction;
    const total = slug.length;

    // Color gradient: bright lime head -> dark olive tail
    const headColor = { r: 0x9d, g: 0xe8, b: 0x7a };
    const tailColor = { r: 0x2e, g: 0x62, b: 0x2e };

    const lerpColor = (t: number) => {
      const r = Math.round(headColor.r + (tailColor.r - headColor.r) * t);
      const g = Math.round(headColor.g + (tailColor.g - headColor.g) * t);
      const b = Math.round(headColor.b + (tailColor.b - headColor.b) * t);
      return (r << 16) | (g << 8) | b;
    };

    // Draw connector circles between consecutive segment centers to smooth gaps
    for (let i = 0; i < total - 1; i += 1) {
      const t = i / Math.max(total - 1, 1);
      const tNext = (i + 1) / Math.max(total - 1, 1);
      const color = lerpColor((t + tNext) / 2);

      const cx1 = BOARD_OFFSET_X + slug[i].x * CELL_SIZE + CELL_SIZE / 2;
      const cy1 = BOARD_OFFSET_Y + slug[i].y * CELL_SIZE + CELL_SIZE / 2;
      const cx2 = BOARD_OFFSET_X + slug[i + 1].x * CELL_SIZE + CELL_SIZE / 2;
      const cy2 = BOARD_OFFSET_Y + slug[i + 1].y * CELL_SIZE + CELL_SIZE / 2;

      // Only draw connector if segments are adjacent (not when wrapping around board)
      const dx = Math.abs(slug[i].x - slug[i + 1].x);
      const dy = Math.abs(slug[i].y - slug[i + 1].y);
      if (dx <= 1 && dy <= 1) {
        const taperT = (t + tNext) / 2;
        const connectorRadius = Math.round(CELL_SIZE * (0.42 - taperT * 0.18));
        this.graphics.fillStyle(color, 1);
        // Fill rectangle between the two centers to avoid gap
        const minX = Math.min(cx1, cx2) - connectorRadius;
        const minY = Math.min(cy1, cy2) - connectorRadius;
        const w = Math.abs(cx2 - cx1) + connectorRadius * 2;
        const h = Math.abs(cy2 - cy1) + connectorRadius * 2;
        this.graphics.fillRect(minX, minY, w, h);
      }
    }

    // Draw each segment as a circle (tapered toward tail)
    for (let i = total - 1; i >= 0; i -= 1) {
      const t = i / Math.max(total - 1, 1);
      const color = lerpColor(t);
      const cx = BOARD_OFFSET_X + slug[i].x * CELL_SIZE + CELL_SIZE / 2;
      const cy = BOARD_OFFSET_Y + slug[i].y * CELL_SIZE + CELL_SIZE / 2;
      // Head is widest (0.46), tail tapers to 0.22
      const radius = Math.round(CELL_SIZE * (0.46 - t * 0.24));
      this.graphics.fillStyle(color, 1);
      this.graphics.fillCircle(cx, cy, radius);
    }

    // Eyes on head
    const headCx = BOARD_OFFSET_X + slug[0].x * CELL_SIZE + CELL_SIZE / 2;
    const headCy = BOARD_OFFSET_Y + slug[0].y * CELL_SIZE + CELL_SIZE / 2;
    const eyeOffset = 4;
    const eyeForward = 3;

    let ex1: number, ey1: number, ex2: number, ey2: number;
    if (dir === 'right' || dir === 'left') {
      const fwd = dir === 'right' ? 1 : -1;
      ex1 = headCx + fwd * eyeForward; ey1 = headCy - eyeOffset;
      ex2 = headCx + fwd * eyeForward; ey2 = headCy + eyeOffset;
    } else {
      const fwd = dir === 'down' ? 1 : -1;
      ex1 = headCx - eyeOffset; ey1 = headCy + fwd * eyeForward;
      ex2 = headCx + eyeOffset; ey2 = headCy + fwd * eyeForward;
    }

    // White sclera
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(ex1, ey1, 3);
    this.graphics.fillCircle(ex2, ey2, 3);
    // Dark pupil
    this.graphics.fillStyle(0x111111, 1);
    this.graphics.fillCircle(ex1, ey1, 1.5);
    this.graphics.fillCircle(ex2, ey2, 1.5);
  }

  private drawFriendOrb(cx: number, cy: number) {
    const hair = 0x6b4c36;  // warmer brown, visible on dark bg
    const skin = 0xf0c090;
    const hazel = 0x7a9060;

    // Skin face
    this.graphics.fillStyle(skin, 1);
    this.graphics.fillCircle(cx, cy - 1, 10);

    // Hair — short strip across the top (visible on dark bg)
    this.graphics.fillStyle(hair, 1);
    this.graphics.fillEllipse(cx, cy - 9, 18, 7);

    // Beard — dominant feature
    this.graphics.fillEllipse(cx, cy + 6, 20, 14);

    // Mustache
    this.graphics.fillEllipse(cx, cy + 2, 10, 4);

    // Teeth — small hint of smile
    this.graphics.fillStyle(0xfffde0, 1);
    this.graphics.fillRoundedRect(cx - 3, cy + 3, 7, 3, 1);

    // Eyes — hazel irises
    this.graphics.fillStyle(hazel, 1);
    this.graphics.fillCircle(cx - 4, cy - 4, 2);
    this.graphics.fillCircle(cx + 4, cy - 4, 2);

    // Pupils
    this.graphics.fillStyle(0x111111, 1);
    this.graphics.fillCircle(cx - 4, cy - 4, 1);
    this.graphics.fillCircle(cx + 4, cy - 4, 1);
  }

  private drawBulbOrb(cx: number, cy: number) {
    // Bulb — warm yellow circle, shifted up to leave room for socket
    this.graphics.fillStyle(0xf5c518, 1);
    this.graphics.fillCircle(cx, cy - 3, 7);

    // Inner highlight — off-center bright spot
    this.graphics.fillStyle(0xfffde0, 1);
    this.graphics.fillCircle(cx - 2, cy - 5, 2.5);

    // Socket — small grey rounded rect below bulb
    this.graphics.fillStyle(0x8899aa, 1);
    this.graphics.fillRoundedRect(cx - 3, cy + 4, 6, 4, 1);
  }

  private drawFog() {
    const head = this.runState.slug[0];
    const radius = getCurrentVisionRadius(this.runState, this.time.now);

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
    const currentVisionRadius = getCurrentVisionRadius(this.runState, this.time.now);
    this.scoreText.setText(
      `Run: ${this.runState.score} pts   |   Total: ${this.meta.totalPoints} pts   |   Vies: ${this.runState.lives}`,
    );
    this.runInfoText.setText(
      `Temps restant: ${timeLeft}s   |   Vision: ${currentVisionRadius}`,
    );

    const isRunning = this.runState.phase === 'running';
    this.sudokuButtonBg.setVisible(isRunning);
    this.sudokuButtonText.setVisible(isRunning);

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
      case 'suicide':
        return 'rm -rf';
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

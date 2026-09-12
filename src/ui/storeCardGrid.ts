import Phaser from 'phaser';
import type { TalentStoreItem } from '../game/metaState';
import {
  BOARD_CENTER_X,
  BOARD_HEIGHT,
  BOARD_OFFSET_Y,
  FONT_FAMILY,
  STORE_CARD_BG,
  STORE_CARD_BORDER,
  STORE_CARD_IMAGE_BG,
  STORE_CARD_LOCKED_BG,
  STORE_CARD_LOCKED_BORDER,
  STORE_CARD_LOCKED_IMAGE_BG,
  STORE_FOOTER_H,
  STORE_HEADER_H,
} from '../render/layout';

const CARD_WIDTH = 142;
const CARD_HEIGHT = 162;
const CARD_GAP = 12;
const ROW_GAP = 10;
const IMG_SIZE = 72;
const IMG_OFFSET_Y = -36;
const TITLE_OFFSET_Y = 20;
const LEVEL_OFFSET_Y = 36;
const LOCK_OFFSET_Y = 58;
const COST_OFFSET_Y = 65;
const TITLE_FONT_PX = 14;
const IMAGE_TOKEN_FONT_PX = 22;
const COST_FONT_PX = 16;

interface StoreCardUi {
  talentId: string;
  baseCenterY: number;
  bg: Phaser.GameObjects.Rectangle;
  imageBg: Phaser.GameObjects.Rectangle;
  imageText: Phaser.GameObjects.Text;
  imageSprite: Phaser.GameObjects.Image | null;
  pipsText: Phaser.GameObjects.Text;
  titleText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  lockText: Phaser.GameObjects.Text;
  costBadgeBg: Phaser.GameObjects.Rectangle;
  costText: Phaser.GameObjects.Text;
}

/**
 * Scrollable grid of talent cards. Owns its own layout maths and per-card
 * styling; the surrounding chrome and the detail popup live in `StoreView`.
 */
export class StoreCardGrid {
  private readonly scene: Phaser.Scene;

  private cards: StoreCardUi[] = [];

  private maxScroll = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Largest scroll offset that still keeps content on screen. */
  get maxScrollY(): number {
    return this.maxScroll;
  }

  create(items: TalentStoreItem[], onCardClick: (talentId: string) => void): void {
    const centerX = BOARD_CENTER_X;
    const rows = Array.from(new Set(items.map((item) => item.storeRow))).sort((a, b) => a - b);
    const rowItemsMap = new Map<number, TalentStoreItem[]>();
    items.forEach((item) => {
      const entries = rowItemsMap.get(item.storeRow) ?? [];
      entries.push(item);
      rowItemsMap.set(item.storeRow, entries);
    });
    rowItemsMap.forEach((rowItems) => rowItems.sort((a, b) => a.storeOrder - b.storeOrder));

    const availableH = BOARD_HEIGHT - STORE_HEADER_H - STORE_FOOTER_H;
    // Center the card grid in the available area; scroll handles any overflow.
    // Clamp so row 1 is never above the header bottom — when totalRowsHeight > availableH
    // the centering formula overflows both top and bottom; the clamp removes the top overflow.
    const totalRowsHeight = rows.length * CARD_HEIGHT + Math.max(0, rows.length - 1) * ROW_GAP;
    const cardsAreaCenterY = BOARD_OFFSET_Y + STORE_HEADER_H + availableH / 2;
    const topBound = BOARD_OFFSET_Y + STORE_HEADER_H;
    const firstRowCenterY = Math.max(
      Math.round(cardsAreaCenterY - totalRowsHeight / 2 + CARD_HEIGHT / 2),
      topBound + CARD_HEIGHT / 2 + 8,
    );
    this.maxScroll = Math.max(0, totalRowsHeight - availableH);

    this.cards = [];
    rows.forEach((row, rowIndex) => {
      const rowItems = rowItemsMap.get(row) ?? [];
      const rowWidth = rowItems.length * CARD_WIDTH + Math.max(0, rowItems.length - 1) * CARD_GAP;
      const rowStartX = centerX - rowWidth / 2 + CARD_WIDTH / 2;
      const cardY = firstRowCenterY + rowIndex * (CARD_HEIGHT + ROW_GAP);

      rowItems.forEach((item, itemIndex) => {
        const cardCenterX = rowStartX + itemIndex * (CARD_WIDTH + CARD_GAP);
        this.cards.push(this.createCard(item, cardCenterX, cardY, onCardClick));
      });
    });
  }

  private createCard(
    item: TalentStoreItem,
    cardCenterX: number,
    cardY: number,
    onCardClick: (talentId: string) => void,
  ): StoreCardUi {
    const bg = this.scene.add
      .rectangle(cardCenterX, cardY, CARD_WIDTH, CARD_HEIGHT, STORE_CARD_BG, 1)
      .setStrokeStyle(2, STORE_CARD_BORDER)
      .setInteractive({ useHandCursor: true })
      .setDepth(41)
      .setVisible(false);
    bg.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        onCardClick(item.id);
      },
    );

    const imageBg = this.scene.add
      .rectangle(cardCenterX, cardY + IMG_OFFSET_Y, IMG_SIZE, IMG_SIZE, STORE_CARD_IMAGE_BG, 1)
      .setStrokeStyle(1, 0x6b5a38)
      .setDepth(42)
      .setVisible(false);

    const imageText = this.scene.add
      .text(cardCenterX, cardY + IMG_OFFSET_Y, item.imageToken, {
        fontFamily: FONT_FAMILY,
        fontSize: `${IMAGE_TOKEN_FONT_PX}px`,
        color: '#ddd4b8',
      })
      .setOrigin(0.5)
      .setDepth(43)
      .setVisible(false);

    let imageSprite: Phaser.GameObjects.Image | null = null;
    if (item.imageAsset && this.scene.textures.exists(item.imageAsset)) {
      imageSprite = this.scene.add
        .image(cardCenterX, cardY + IMG_OFFSET_Y, item.imageAsset)
        .setDisplaySize(IMG_SIZE, IMG_SIZE)
        .setOrigin(0.5)
        .setDepth(43)
        .setVisible(false);
    }

    const pipsText = this.scene.add
      .text(cardCenterX, cardY + 50, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#c4b898',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(42)
      .setVisible(false);

    const titleText = this.scene.add
      .text(cardCenterX, cardY + TITLE_OFFSET_Y, '', {
        fontFamily: FONT_FAMILY,
        fontSize: `${TITLE_FONT_PX}px`,
        color: '#f5edd8',
        align: 'center',
        wordWrap: { width: CARD_WIDTH - 16 },
      })
      .setOrigin(0.5)
      .setDepth(42)
      .setVisible(false);

    const levelText = this.scene.add
      .text(cardCenterX, cardY + LEVEL_OFFSET_Y, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        color: '#8a7e66',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(42)
      .setVisible(false);

    const lockText = this.scene.add
      .text(cardCenterX, cardY + LOCK_OFFSET_Y, '🔒', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#6b6050',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(42)
      .setVisible(false);

    const costBadgeBg = this.scene.add
      .rectangle(cardCenterX, cardY + COST_OFFSET_Y, CARD_WIDTH - 16, 24, 0x18160e, 1)
      .setStrokeStyle(1, 0x3a3428)
      .setDepth(42)
      .setVisible(false);

    const costText = this.scene.add
      .text(cardCenterX, cardY + COST_OFFSET_Y, '', {
        fontFamily: FONT_FAMILY,
        fontSize: `${COST_FONT_PX}px`,
        color: '#ffd892',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(43)
      .setVisible(false);

    return {
      talentId: item.id,
      baseCenterY: cardY,
      bg,
      imageBg,
      imageText,
      imageSprite,
      pipsText,
      titleText,
      levelText,
      lockText,
      costBadgeBg,
      costText,
    };
  }

  private setCardVisible(card: StoreCardUi, visible: boolean): void {
    card.bg.setVisible(visible);
    card.imageBg.setVisible(visible);
    card.imageText.setVisible(visible);
    if (card.imageSprite) card.imageSprite.setVisible(visible);
    card.pipsText.setVisible(visible);
    card.titleText.setVisible(visible);
    card.levelText.setVisible(visible);
    card.lockText.setVisible(visible);
    card.costBadgeBg.setVisible(visible);
    card.costText.setVisible(visible);
  }

  setVisible(visible: boolean): void {
    this.cards.forEach((card) => this.setCardVisible(card, visible));
  }

  /** Cards stop responding while the detail popup is up. */
  setInteractive(enabled: boolean): void {
    this.cards.forEach((card) => {
      if (enabled) {
        card.bg.setInteractive({ useHandCursor: true });
      } else {
        card.bg.disableInteractive();
      }
    });
  }

  refresh(items: TalentStoreItem[], scrollY: number): void {
    const topBound = BOARD_OFFSET_Y + STORE_HEADER_H;
    const bottomBound = BOARD_OFFSET_Y + BOARD_HEIGHT - STORE_FOOTER_H;
    const halfH = CARD_HEIGHT / 2;

    this.cards.forEach((card) => {
      const item = items.find((entry) => entry.id === card.talentId);
      if (!item) {
        this.setCardVisible(card, false);
        return;
      }

      // Apply scroll offset and clip cards outside the visible area.
      const displayY = card.baseCenterY - scrollY;
      if (displayY + halfH <= topBound || displayY - halfH >= bottomBound) {
        this.setCardVisible(card, false);
        return;
      }

      this.setCardVisible(card, true);
      this.positionCard(card, displayY);
      this.styleCard(card, item);
    });
  }

  private positionCard(card: StoreCardUi, displayY: number): void {
    card.bg.setY(displayY);
    card.imageBg.setY(displayY + IMG_OFFSET_Y);
    card.imageText.setY(displayY + IMG_OFFSET_Y);
    if (card.imageSprite) card.imageSprite.setY(displayY + IMG_OFFSET_Y);
    card.titleText.setY(displayY + TITLE_OFFSET_Y);
    card.levelText.setY(displayY + LEVEL_OFFSET_Y);
    card.lockText.setY(displayY + LOCK_OFFSET_Y);
    card.costBadgeBg.setY(displayY + COST_OFFSET_Y);
    card.costText.setY(displayY + COST_OFFSET_Y);
  }

  private styleCard(card: StoreCardUi, item: TalentStoreItem): void {
    const hasSprite = !!card.imageSprite;

    if (!item.isUnlocked && item.isDeeplyLocked) {
      card.imageText.setText('?');
      if (hasSprite) {
        card.imageSprite!.setVisible(false);
        card.imageText.setVisible(true);
      }
    } else {
      card.imageText.setText(item.imageToken);
      if (hasSprite) {
        card.imageSprite!.setVisible(true);
        card.imageText.setVisible(false);
      }
    }

    if (!item.isUnlocked) {
      card.bg.setFillStyle(item.isDeeplyLocked ? 0x0e0c08 : STORE_CARD_LOCKED_BG, 1);
      card.bg.setStrokeStyle(2, STORE_CARD_LOCKED_BORDER);
      card.imageBg.setFillStyle(item.isDeeplyLocked ? 0x16140e : STORE_CARD_LOCKED_IMAGE_BG, 1);
      card.imageBg.setStrokeStyle(1, 0x4a4030);
      card.imageText.setColor(item.isDeeplyLocked ? '#5a5442' : '#8a7e66');
      if (hasSprite && !item.isDeeplyLocked) {
        card.imageSprite!.setTint(0x887755);
        card.imageSprite!.setAlpha(0.6);
      }
      card.titleText.setText(item.isDeeplyLocked ? '???' : item.title);
      card.titleText.setColor(item.isDeeplyLocked ? '#5a5442' : '#b8a880');
      card.pipsText.setVisible(false);
      card.levelText.setVisible(false);
      card.lockText.setText('🔒');
      card.lockText.setVisible(true);
      card.costBadgeBg.setVisible(false);
      card.costText.setVisible(false);
      return;
    }

    card.bg.setFillStyle(STORE_CARD_BG, 1);
    card.bg.setStrokeStyle(2, STORE_CARD_BORDER);
    card.imageBg.setFillStyle(STORE_CARD_IMAGE_BG, 1);
    card.imageBg.setStrokeStyle(1, 0x6b5a38);
    card.imageText.setColor('#ddd4b8');
    if (hasSprite) {
      card.imageSprite!.clearTint();
      card.imageSprite!.setAlpha(1);
    }
    card.titleText.setText(item.title);
    card.titleText.setColor('#f5edd8');
    card.lockText.setVisible(false);
    card.levelText.setVisible(false);

    // Pips — positioned dynamically below title
    const pipsFilled = '● '.repeat(item.level).trim();
    const pipsEmpty = '○ '.repeat(item.maxLevel - item.level).trim();
    card.pipsText.setText(pipsFilled + (pipsFilled && pipsEmpty ? ' ' : '') + pipsEmpty);
    card.pipsText.setY(card.titleText.y + card.titleText.height / 2 + 10);
    card.pipsText.setVisible(true);
    card.pipsText.setColor(item.isMaxed ? '#ffd700' : '#c4b898');

    // Cost badge
    card.costBadgeBg.setVisible(true);
    card.costText.setVisible(true);
    if (item.isMaxed) {
      card.costText.setText('MAX');
      card.costText.setColor('#ffd700');
      card.costBadgeBg.setFillStyle(0x2a2510, 1);
      return;
    }
    if (item.nextCost === null) {
      card.costText.setText('---');
      card.costText.setColor('#a89878');
      card.costBadgeBg.setFillStyle(0x18160e, 1);
      return;
    }
    card.costText.setText(`${item.nextCost} p.`);
    card.costText.setColor('#ffd892');
    card.costBadgeBg.setFillStyle(0x18160e, 1);
  }
}

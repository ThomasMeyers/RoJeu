import Phaser from 'phaser';
import { getStoreTalentItems, upgradeTalentLevel } from '../game/metaState';
import { ENDING_TALENT_ID } from '../game/talentCatalog';
import type { MetaState } from '../game/types';
import {
  BOARD_CENTER_X,
  BOARD_CENTER_Y,
  BOARD_HEIGHT,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  BOARD_WIDTH,
  BUTTON_DISABLED,
  BUTTON_PRIMARY,
  FONT_FAMILY,
  STORE_CARD_IMAGE_BG,
  STORE_FOOTER_H,
  STORE_HEADER_H,
  STORE_OVERLAY_BG,
  STORE_POPUP_BG,
} from '../render/layout';
import { StoreCardGrid } from './storeCardGrid';

export interface StoreHandlers {
  /** End-screen buttons must be inert while the store covers them. */
  onEndScreenInteractiveChange: (enabled: boolean) => void;
  /** Buying the ending talent leaves the run for the finale straight away. */
  onEndingPurchased: () => void;
}

/**
 * Talent store overlay: chrome, scroll state and the single detail popup.
 * The card grid itself lives in `StoreCardGrid`.
 */
export class StoreView {
  private readonly scene: Phaser.Scene;

  private readonly grid: StoreCardGrid;

  private meta!: MetaState;

  private handlers!: StoreHandlers;

  private open = false;

  private selectedTalentId: string | null = null;

  private scrollY = 0;

  private overlayBg!: Phaser.GameObjects.Rectangle;

  private headerBg!: Phaser.GameObjects.Rectangle;

  private headerSeparator!: Phaser.GameObjects.Graphics;

  private titleText!: Phaser.GameObjects.Text;

  private pointsText!: Phaser.GameObjects.Text;

  private closeBg!: Phaser.GameObjects.Rectangle;

  private closeText!: Phaser.GameObjects.Text;

  private scrollUpIndicator!: Phaser.GameObjects.Text;

  private scrollDownIndicator!: Phaser.GameObjects.Text;

  private popupBg!: Phaser.GameObjects.Rectangle;

  private popupCloseText!: Phaser.GameObjects.Text;

  private popupImageBg!: Phaser.GameObjects.Rectangle;

  private popupImageText!: Phaser.GameObjects.Text;

  private popupImageSprite: Phaser.GameObjects.Image | null = null;

  private popupTitleText!: Phaser.GameObjects.Text;

  private popupLevelText!: Phaser.GameObjects.Text;

  private popupDescriptionText!: Phaser.GameObjects.Text;

  private popupSeparator!: Phaser.GameObjects.Graphics;

  private popupUpgradeBg!: Phaser.GameObjects.Rectangle;

  private popupUpgradeText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.grid = new StoreCardGrid(scene);
  }

  get isOpen(): boolean {
    return this.open;
  }

  get hasSelection(): boolean {
    return this.selectedTalentId !== null;
  }

  create(meta: MetaState, handlers: StoreHandlers): void {
    this.meta = meta;
    this.handlers = handlers;

    this.createChrome();
    this.grid.create(getStoreTalentItems(this.meta), (talentId) => {
      if (this.selectedTalentId) {
        return;
      }
      this.openTalentDetails(talentId);
    });
    this.createScrollIndicators();
    this.createPopup();
  }

  private createChrome(): void {
    const centerX = BOARD_CENTER_X;
    const centerY = BOARD_CENTER_Y;

    this.overlayBg = this.scene.add
      .rectangle(centerX, centerY, BOARD_WIDTH, BOARD_HEIGHT, STORE_OVERLAY_BG, 0.96)
      .setDepth(40)
      .setVisible(false);

    // Header mask — covers any cards that scroll under (or above) the header zone.
    // Extends 200px above BOARD_OFFSET_Y so cards never peek above the board.
    const maskExtraTop = 200;
    const maskHeight = STORE_HEADER_H + maskExtraTop;
    const maskCenterY = BOARD_OFFSET_Y + STORE_HEADER_H - maskHeight / 2;
    this.headerBg = this.scene.add
      .rectangle(centerX, maskCenterY, BOARD_WIDTH, maskHeight, STORE_OVERLAY_BG, 1)
      .setDepth(44)
      .setVisible(false);

    this.headerSeparator = this.scene.add
      .graphics()
      .lineStyle(1, 0x3a3428, 0.8)
      .lineBetween(
        BOARD_OFFSET_X,
        BOARD_OFFSET_Y + STORE_HEADER_H,
        BOARD_OFFSET_X + BOARD_WIDTH,
        BOARD_OFFSET_Y + STORE_HEADER_H,
      )
      .setDepth(44)
      .setVisible(false);

    this.titleText = this.scene.add
      .text(centerX, BOARD_OFFSET_Y + 28, 'Boutique de la limace', {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        color: '#f5edd8',
      })
      .setOrigin(0.5)
      .setDepth(45)
      .setVisible(false);

    this.pointsText = this.scene.add
      .text(BOARD_OFFSET_X + 20, BOARD_OFFSET_Y + 52, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '19px',
        color: '#ffd892',
      })
      .setDepth(45)
      .setVisible(false);

    this.closeBg = this.scene.add
      .rectangle(BOARD_OFFSET_X + BOARD_WIDTH - 26, BOARD_OFFSET_Y + 24, 28, 28, 0x2e2820, 1)
      .setStrokeStyle(1, 0x5a4e3a)
      .setInteractive({ useHandCursor: true })
      .setDepth(50)
      .setVisible(false);
    this.closeBg.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.close();
      },
    );

    this.closeText = this.scene.add
      .text(BOARD_OFFSET_X + BOARD_WIDTH - 26, BOARD_OFFSET_Y + 24, 'X', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(51)
      .setVisible(false);
  }

  private createScrollIndicators(): void {
    // Shown when more content exists above/below the visible area.
    const topBound = BOARD_OFFSET_Y + STORE_HEADER_H;
    const bottomBound = BOARD_OFFSET_Y + BOARD_HEIGHT - STORE_FOOTER_H;
    this.scrollUpIndicator = this.scene.add
      .text(BOARD_CENTER_X, topBound + 12, '▲', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#8a7e66',
      })
      .setOrigin(0.5)
      .setDepth(49)
      .setVisible(false);
    this.scrollDownIndicator = this.scene.add
      .text(BOARD_CENTER_X, bottomBound - 12, '▼', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#8a7e66',
      })
      .setOrigin(0.5)
      .setDepth(49)
      .setVisible(false);
  }

  private createPopup(): void {
    const centerX = BOARD_CENTER_X;
    const centerY = BOARD_CENTER_Y;

    this.popupBg = this.scene.add
      .rectangle(centerX, centerY + 4, 400, 290, STORE_POPUP_BG, 1)
      .setStrokeStyle(2, 0x5a4e3a)
      .setDepth(45)
      .setVisible(false);

    this.popupCloseText = this.scene.add
      .text(centerX + 184, centerY - 126, 'X', {
        fontFamily: FONT_FAMILY,
        fontSize: '17px',
        color: '#ffffff',
      })
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5)
      .setDepth(46)
      .setVisible(false);
    this.popupCloseText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.closeTalentDetails();
      },
    );

    this.popupImageBg = this.scene.add
      .rectangle(centerX - 115, centerY - 24, 140, 140, STORE_CARD_IMAGE_BG, 1)
      .setStrokeStyle(1, 0x6b5a38)
      .setDepth(46)
      .setVisible(false);

    this.popupImageText = this.scene.add
      .text(centerX - 115, centerY - 24, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: '#ddd4b8',
      })
      .setOrigin(0.5)
      .setDepth(47)
      .setVisible(false);

    this.popupImageSprite = this.scene.add
      .image(centerX - 115, centerY - 24, '__DEFAULT')
      .setDisplaySize(140, 140)
      .setOrigin(0.5)
      .setDepth(47)
      .setVisible(false);

    this.popupTitleText = this.scene.add
      .text(centerX - 30, centerY - 92, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#f5edd8',
        fontStyle: 'bold',
        wordWrap: { width: 210 },
      })
      .setDepth(46)
      .setVisible(false);

    this.popupLevelText = this.scene.add
      .text(centerX - 30, centerY - 68, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#8a7e66',
      })
      .setDepth(46)
      .setVisible(false);

    this.popupDescriptionText = this.scene.add
      .text(centerX - 30, centerY - 44, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: '#c4b898',
        align: 'left',
        wordWrap: { width: 210 },
      })
      .setDepth(46)
      .setVisible(false);

    this.popupSeparator = this.scene.add
      .graphics()
      .lineStyle(1, 0x3a3428, 0.6)
      .lineBetween(centerX - 180, centerY + 62, centerX + 180, centerY + 62)
      .setDepth(46)
      .setVisible(false);

    this.popupUpgradeBg = this.scene.add
      .rectangle(centerX, centerY + 100, 350, 54, BUTTON_PRIMARY, 1)
      .setStrokeStyle(2, 0xb89850)
      .setInteractive({ useHandCursor: true })
      .setDepth(46)
      .setVisible(false);
    this.popupUpgradeBg.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        if (!this.selectedTalentId) {
          return;
        }
        if (!upgradeTalentLevel(this.meta, this.selectedTalentId)) {
          return;
        }
        if (this.selectedTalentId === ENDING_TALENT_ID) {
          this.handlers.onEndingPurchased();
          return;
        }
        this.refresh();
      },
    );

    this.popupUpgradeText = this.scene.add
      .text(centerX, centerY + 100, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5)
      .setDepth(47)
      .setVisible(false);
  }

  openStore(): void {
    this.open = true;
    this.scrollY = 0;
    this.selectedTalentId = null;
    this.handlers.onEndScreenInteractiveChange(false);
    this.setPopupVisible(false);
    this.refresh();
  }

  close(): void {
    this.open = false;
    this.selectedTalentId = null;
    this.handlers.onEndScreenInteractiveChange(true);
    this.setVisible(false);
    this.setPopupVisible(false);
  }

  scrollBy(deltaY: number): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.grid.maxScrollY);
    this.refresh();
  }

  private openTalentDetails(talentId: string): void {
    this.selectedTalentId = talentId;
    this.setPopupVisible(true);
    this.refresh();
  }

  private closeTalentDetails(): void {
    this.selectedTalentId = null;
    this.setPopupVisible(false);
  }

  setVisible(visible: boolean): void {
    this.overlayBg.setVisible(visible);
    this.headerBg.setVisible(visible);
    this.headerSeparator.setVisible(visible);
    this.titleText.setVisible(visible);
    this.pointsText.setVisible(visible);
    this.closeBg.setVisible(visible);
    this.closeText.setVisible(visible);
    this.scrollUpIndicator.setVisible(visible);
    this.scrollDownIndicator.setVisible(visible);
    this.grid.setVisible(visible);
  }

  setPopupVisible(visible: boolean): void {
    this.popupBg.setVisible(visible);
    this.popupCloseText.setVisible(visible);
    this.popupImageBg.setVisible(visible);
    this.popupImageText.setVisible(visible);
    if (this.popupImageSprite) this.popupImageSprite.setVisible(false);
    this.popupTitleText.setVisible(visible);
    this.popupLevelText.setVisible(visible);
    this.popupDescriptionText.setVisible(visible);
    this.popupSeparator.setVisible(visible);
    this.popupUpgradeBg.setVisible(visible);
    this.popupUpgradeText.setVisible(visible);
    this.grid.setInteractive(!visible);
  }

  refresh(): void {
    // Show store chrome (header, overlay, close button).
    this.overlayBg.setVisible(true);
    this.headerBg.setVisible(true);
    this.headerSeparator.setVisible(true);
    this.titleText.setVisible(true);
    this.closeBg.setVisible(true);
    this.closeText.setVisible(true);
    this.pointsText.setVisible(true);

    const storeItems = getStoreTalentItems(this.meta);
    this.pointsText.setText(`✦ ${this.meta.totalPoints} p.`);

    this.grid.refresh(storeItems, this.scrollY);
    this.scrollUpIndicator.setVisible(this.scrollY > 0);
    this.scrollDownIndicator.setVisible(this.scrollY < this.grid.maxScrollY);

    if (!this.selectedTalentId) {
      return;
    }

    const selected = storeItems.find((item) => item.id === this.selectedTalentId);
    if (!selected) {
      this.closeTalentDetails();
      return;
    }

    const popupHasSprite = !!selected.imageAsset && this.scene.textures.exists(selected.imageAsset);
    if (popupHasSprite && !selected.isDeeplyLocked) {
      this.popupImageSprite!.setTexture(selected.imageAsset!);
      this.popupImageSprite!.setDisplaySize(140, 140);
      this.popupImageSprite!.setVisible(true);
      this.popupImageText.setVisible(false);
      if (!selected.isUnlocked) {
        this.popupImageSprite!.setTint(0x887755);
        this.popupImageSprite!.setAlpha(0.6);
      } else {
        this.popupImageSprite!.clearTint();
        this.popupImageSprite!.setAlpha(1);
      }
    } else {
      this.popupImageText.setText(selected.isDeeplyLocked ? '?' : selected.imageToken);
      this.popupImageText.setVisible(true);
      if (this.popupImageSprite) this.popupImageSprite.setVisible(false);
    }

    this.popupTitleText.setText(selected.isDeeplyLocked ? '???' : selected.title);
    // Long titles wrap onto several lines: keep the level and description stacked below.
    this.popupLevelText.setY(this.popupTitleText.y + this.popupTitleText.height);
    this.popupDescriptionText.setY(this.popupLevelText.y + 24);
    if (selected.isUnlocked) {
      if (selected.isMaxed) {
        this.popupLevelText.setText('MAX');
        this.popupLevelText.setColor('#ffd700');
      } else {
        this.popupLevelText.setText(`Niveau ${selected.level}/${selected.maxLevel}`);
        this.popupLevelText.setColor('#8a7e66');
      }
    } else {
      this.popupLevelText.setText('🔒 Verrouillé');
      this.popupLevelText.setColor('#6b6050');
    }
    this.popupDescriptionText.setText(
      selected.isDeeplyLocked ? 'Talent mystère' : selected.description,
    );

    if (!selected.isUnlocked) {
      this.popupUpgradeText.setText(
        selected.isDeeplyLocked
          ? 'Débloquez les talents précédents'
          : (selected.unlockRequirementText ?? 'Prerequis manquant.'),
      );
      this.popupUpgradeBg.setFillStyle(BUTTON_DISABLED, 1);
      this.popupUpgradeBg.disableInteractive();
      return;
    }

    if (selected.isMaxed) {
      this.popupUpgradeText.setText('MAX atteint');
      this.popupUpgradeBg.setFillStyle(BUTTON_DISABLED, 1);
      this.popupUpgradeBg.disableInteractive();
      return;
    }

    const labelCost = selected.nextCost ?? 0;
    this.popupUpgradeText.setText(`Ameliorer — ${labelCost} p.`);
    if (selected.canUpgrade) {
      this.popupUpgradeBg.setFillStyle(BUTTON_PRIMARY, 1);
      this.popupUpgradeBg.setInteractive({ useHandCursor: true });
    } else {
      this.popupUpgradeBg.setFillStyle(BUTTON_DISABLED, 1);
      this.popupUpgradeBg.disableInteractive();
    }
  }
}

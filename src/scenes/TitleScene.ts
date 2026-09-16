import Phaser from 'phaser';
import { clearMetaState, hasSavedMeta } from '../game/metaState';
import { TITLE_SCREEN } from '../game/storyCatalog';
import { FONT_FAMILY, STORE_CARD_BORDER, STORE_POPUP_BG } from '../render/layout';
import { MenuButton } from '../ui/menuButton';

const REJECTED_NAME_DISPLAY_MS = 1500;
const CONFIRM_DEPTH = 10;
/** Swallows the key that brought us here, so it cannot also fire a menu button. */
const ENTRY_INPUT_LOCK_MS = 250;

/**
 * Menu shown on every launch: new game (intro) or continue (straight to the run).
 * Starting a new game over an existing save goes through a confirmation popup.
 */
export class TitleScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;

  private rejectedNameIndex = -1;

  private titleResetTimer: Phaser.Time.TimerEvent | null = null;

  private hasSave = false;

  private menuButtons: MenuButton[] = [];

  private menuFocusIndex = 0;

  private confirmObjects: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text> = [];

  private confirmButtons: MenuButton[] = [];

  private confirmFocusIndex = 1;

  private isConfirmOpen = false;

  private inputLockedUntilMs = 0;

  constructor() {
    super('TitleScene');
  }

  create() {
    this.inputLockedUntilMs = this.time.now + ENTRY_INPUT_LOCK_MS;
    this.rejectedNameIndex = -1;
    this.titleResetTimer = null;
    this.isConfirmOpen = false;
    this.hasSave = hasSavedMeta();

    const centerX = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#14120c');

    this.titleText = this.add
      .text(centerX, 170, TITLE_SCREEN.title, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'italic',
        color: '#f5edd8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.titleText.on('pointerdown', () => this.showNextRejectedName());

    this.add
      .text(centerX, 212, TITLE_SCREEN.subtitle, {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        fontStyle: 'italic',
        color: '#c4b898',
      })
      .setOrigin(0.5);

    const newGameButton = new MenuButton(this, {
      x: centerX,
      y: 330,
      width: 320,
      height: 56,
      label: TITLE_SCREEN.newGameLabel,
      variant: 'primary',
      onActivate: () => this.onNewGame(),
      onHover: () => this.focusMenuButton(0),
    });
    const continueButton = new MenuButton(this, {
      x: centerX,
      y: 404,
      width: 320,
      height: 56,
      label: TITLE_SCREEN.continueLabel,
      variant: 'secondary',
      onActivate: () => this.scene.start('GameScene'),
      onHover: () => this.focusMenuButton(1),
    }).setEnabled(this.hasSave);
    this.menuButtons = [newGameButton, continueButton];
    this.focusMenuButton(this.hasSave ? 1 : 0);

    this.add
      .text(centerX, 560, TITLE_SCREEN.navigationHint, {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: '#8a7e66',
      })
      .setOrigin(0.5);

    this.createConfirmPopup(centerX);
    this.registerKeys();
  }

  private registerKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    // Held keys auto-repeat: without this guard, holding Enter would open the
    // popup and immediately activate its focused button. The entry lock does the same
    // for the key that started this scene, such as the one leaving the finale.
    const onPress = (key: string, handler: () => void) => {
      keyboard.on(`keydown-${key}`, (event: KeyboardEvent) => {
        if (!event.repeat && this.time.now >= this.inputLockedUntilMs) {
          handler();
        }
      });
    };

    ['UP', 'W', 'LEFT', 'A'].forEach((key) => onPress(key, () => this.moveFocus(-1)));
    ['DOWN', 'S', 'RIGHT', 'D'].forEach((key) => onPress(key, () => this.moveFocus(1)));
    ['ENTER', 'SPACE'].forEach((key) => onPress(key, () => this.activateFocused()));
    onPress('ESC', () => this.closeConfirm());
  }

  private createConfirmPopup(centerX: number): void {
    const overlay = this.add
      .rectangle(centerX, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7)
      // Interactive only to swallow clicks aimed at the menu underneath.
      .setInteractive();
    const panel = this.add
      .rectangle(centerX, 300, 400, 220, STORE_POPUP_BG, 1)
      .setStrokeStyle(2, STORE_CARD_BORDER);
    const text = this.add
      .text(centerX, 255, TITLE_SCREEN.resetConfirmText, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#f5edd8',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.confirmObjects = [overlay, panel, text];
    this.confirmObjects.forEach((object) => object.setDepth(CONFIRM_DEPTH));

    const yesButton = new MenuButton(this, {
      x: centerX - 90,
      y: 350,
      width: 150,
      height: 48,
      label: TITLE_SCREEN.resetConfirmYesLabel,
      variant: 'secondary',
      onActivate: () => this.startNewGame(),
      onHover: () => this.focusConfirmButton(0),
    });
    const noButton = new MenuButton(this, {
      x: centerX + 90,
      y: 350,
      width: 150,
      height: 48,
      label: TITLE_SCREEN.resetConfirmNoLabel,
      variant: 'primary',
      onActivate: () => this.closeConfirm(),
      onHover: () => this.focusConfirmButton(1),
    });
    this.confirmButtons = [yesButton, noButton];
    this.confirmButtons.forEach((button) => button.setDepth(CONFIRM_DEPTH + 1));

    this.setConfirmVisible(false);
  }

  private setConfirmVisible(visible: boolean): void {
    this.confirmObjects.forEach((object) => object.setVisible(visible));
    this.confirmButtons.forEach((button) => button.setVisible(visible));
  }

  private onNewGame(): void {
    if (!this.hasSave) {
      this.startNewGame();
      return;
    }
    this.isConfirmOpen = true;
    this.setConfirmVisible(true);
    // Default to the harmless answer.
    this.focusConfirmButton(1);
  }

  private closeConfirm(): void {
    if (!this.isConfirmOpen) {
      return;
    }
    this.isConfirmOpen = false;
    this.setConfirmVisible(false);
  }

  private startNewGame(): void {
    clearMetaState();
    this.scene.start('StoryScene');
  }

  private moveFocus(step: number): void {
    if (this.isConfirmOpen) {
      this.focusConfirmButton(this.confirmFocusIndex === 0 ? 1 : 0);
      return;
    }

    const enabledIndexes = this.menuButtons
      .map((button, index) => (button.isEnabled ? index : -1))
      .filter((index) => index >= 0);
    const position = Math.max(0, enabledIndexes.indexOf(this.menuFocusIndex));
    const nextPosition = (position + step + enabledIndexes.length) % enabledIndexes.length;
    this.focusMenuButton(enabledIndexes[nextPosition]);
  }

  private activateFocused(): void {
    if (this.isConfirmOpen) {
      this.confirmButtons[this.confirmFocusIndex].activate();
      return;
    }
    this.menuButtons[this.menuFocusIndex].activate();
  }

  private focusMenuButton(index: number): void {
    this.menuFocusIndex = index;
    this.menuButtons.forEach((button, buttonIndex) => button.setFocused(buttonIndex === index));
  }

  private focusConfirmButton(index: number): void {
    this.confirmFocusIndex = index;
    this.confirmButtons.forEach((button, buttonIndex) => button.setFocused(buttonIndex === index));
  }

  private showNextRejectedName(): void {
    const names = TITLE_SCREEN.rejectedNames;
    this.rejectedNameIndex = (this.rejectedNameIndex + 1) % names.length;
    this.titleText.setText(names[this.rejectedNameIndex]);

    this.titleResetTimer?.remove(false);
    this.titleResetTimer = this.time.delayedCall(REJECTED_NAME_DISPLAY_MS, () => {
      this.titleText.setText(TITLE_SCREEN.title);
      this.titleResetTimer = null;
    });
  }
}

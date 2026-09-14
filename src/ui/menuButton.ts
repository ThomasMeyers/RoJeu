import Phaser from 'phaser';
import {
  BUTTON_DISABLED,
  BUTTON_PRIMARY,
  BUTTON_PRIMARY_HOVER,
  BUTTON_PRIMARY_PRESS,
  BUTTON_SECONDARY,
  BUTTON_SECONDARY_HOVER,
  BUTTON_SECONDARY_PRESS,
  FONT_FAMILY,
} from '../render/layout';

export type MenuButtonVariant = 'primary' | 'secondary';

export interface MenuButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  variant: MenuButtonVariant;
  onActivate: () => void;
  /** Lets the owning scene move its keyboard focus onto the hovered button. */
  onHover?: () => void;
}

const VARIANT_COLORS = {
  primary: {
    fill: BUTTON_PRIMARY,
    hover: BUTTON_PRIMARY_HOVER,
    press: BUTTON_PRIMARY_PRESS,
    stroke: 0xb89850,
  },
  secondary: {
    fill: BUTTON_SECONDARY,
    hover: BUTTON_SECONDARY_HOVER,
    press: BUTTON_SECONDARY_PRESS,
    stroke: 0xa08838,
  },
};

const FOCUS_STROKE = 0xf5edd8;
const DISABLED_STROKE = 0x3d362a;
const DISABLED_LABEL_COLOR = '#6e6552';

/**
 * Menu button usable with both mouse and keyboard: same look as the end-screen
 * CTAs, plus a focus ring and a disabled state.
 */
export class MenuButton {
  private readonly background: Phaser.GameObjects.Rectangle;

  private readonly labelText: Phaser.GameObjects.Text;

  private readonly colors: (typeof VARIANT_COLORS)[MenuButtonVariant];

  private readonly onActivate: () => void;

  private enabled = true;

  private focused = false;

  private hovered = false;

  constructor(scene: Phaser.Scene, options: MenuButtonOptions) {
    this.colors = VARIANT_COLORS[options.variant];
    this.onActivate = options.onActivate;

    this.background = scene.add
      .rectangle(options.x, options.y, options.width, options.height, this.colors.fill, 1)
      .setInteractive({ useHandCursor: true });

    this.labelText = scene.add
      .text(options.x, options.y, options.label, {
        fontFamily: FONT_FAMILY,
        fontSize: '19px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.background.on('pointerover', () => {
      this.hovered = true;
      options.onHover?.();
      this.applyStyle();
    });
    this.background.on('pointerout', () => {
      this.hovered = false;
      this.applyStyle();
    });
    this.background.on('pointerdown', () => {
      if (!this.enabled) {
        return;
      }
      this.background.setFillStyle(this.colors.press, 1);
      this.onActivate();
    });
    this.background.on('pointerup', () => this.applyStyle());

    this.applyStyle();
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get gameObjects(): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text] {
    return [this.background, this.labelText];
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    if (enabled) {
      this.background.setInteractive({ useHandCursor: true });
    } else {
      this.hovered = false;
      this.background.disableInteractive();
    }
    this.applyStyle();
    return this;
  }

  setFocused(focused: boolean): this {
    this.focused = focused;
    this.applyStyle();
    return this;
  }

  setVisible(visible: boolean): this {
    this.background.setVisible(visible);
    this.labelText.setVisible(visible);
    return this;
  }

  setDepth(depth: number): this {
    this.background.setDepth(depth);
    this.labelText.setDepth(depth);
    return this;
  }

  /** Keyboard path: same guard as a click. */
  activate(): void {
    if (this.enabled) {
      this.onActivate();
    }
  }

  private applyStyle(): void {
    if (!this.enabled) {
      this.background.setFillStyle(BUTTON_DISABLED, 1).setStrokeStyle(2, DISABLED_STROKE);
      this.labelText.setColor(DISABLED_LABEL_COLOR);
      return;
    }

    const highlighted = this.hovered || this.focused;
    this.background.setFillStyle(highlighted ? this.colors.hover : this.colors.fill, 1);
    if (this.focused) {
      this.background.setStrokeStyle(3, FOCUS_STROKE);
    } else {
      this.background.setStrokeStyle(2, this.colors.stroke);
    }
    this.labelText.setColor('#ffffff');
  }
}

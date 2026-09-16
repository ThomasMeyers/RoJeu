import Phaser from 'phaser';

export interface TypedTextBlockOptions {
  centerX: number;
  centerY: number;
  wrapWidth: number;
  lineSpacing: number;
  style: Phaser.Types.GameObjects.Text.TextStyle;
}

/**
 * Centred text block for a typewriter reveal: one left-anchored text per wrapped line,
 * placed where the full line sits once centred, so the reveal grows in place instead of
 * re-wrapping and re-centring.
 */
export class TypedTextBlock {
  private readonly scene: Phaser.Scene;

  private readonly options: TypedTextBlockOptions;

  private readonly wrapMeasure: Phaser.GameObjects.Text;

  private wrappedLines: string[] = [];

  private lineTexts: Phaser.GameObjects.Text[] = [];

  private blockBottomY: number;

  constructor(scene: Phaser.Scene, options: TypedTextBlockOptions) {
    this.scene = scene;
    this.options = options;
    this.blockBottomY = options.centerY;
    this.wrapMeasure = scene.add
      .text(0, 0, '', { ...options.style, wordWrap: { width: options.wrapWidth } })
      .setVisible(false);
  }

  /** Bottom of the laid-out block, for anything that has to sit right under it. */
  get bottomY(): number {
    return this.blockBottomY;
  }

  /** Lays out `text` with nothing revealed yet. */
  layout(text: string): void {
    this.clear();
    const { centerX, centerY, lineSpacing, style } = this.options;
    this.wrappedLines = this.wrapMeasure.getWrappedText(text).map((line) => line.trimEnd());
    this.lineTexts = this.wrappedLines.map((line) => this.scene.add.text(0, 0, line, style));

    const lineHeight = this.lineTexts[0]?.height ?? 0;
    const blockHeight = this.lineTexts.length * (lineHeight + lineSpacing) - lineSpacing;
    this.blockBottomY = centerY + blockHeight / 2;
    this.lineTexts.forEach((lineText, index) => {
      lineText.setPosition(
        centerX - lineText.width / 2,
        centerY - blockHeight / 2 + index * (lineHeight + lineSpacing),
      );
      lineText.setText('');
    });
  }

  render(revealedChars: number, fullyRevealed: boolean): void {
    let remainingChars = revealedChars;

    this.lineTexts.forEach((lineText, index) => {
      const line = this.wrappedLines[index];
      const visible = fullyRevealed ? line : line.slice(0, Math.max(0, remainingChars));
      if (lineText.text !== visible) {
        lineText.setText(visible);
      }
      // Wrapping swallowed the space (or line break) between this line and the next one.
      remainingChars -= line.length + 1;
    });
  }

  clear(): void {
    this.lineTexts.forEach((lineText) => lineText.destroy());
    this.lineTexts = [];
    this.wrappedLines = [];
  }
}

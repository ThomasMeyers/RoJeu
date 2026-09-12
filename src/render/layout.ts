import type { GridSize } from '../game/types';

/** Board geometry. Every on-screen position derives from these. */
export const GRID: GridSize = { cols: 20, rows: 20 };
export const CELL_SIZE = 24;
export const BOARD_WIDTH = GRID.cols * CELL_SIZE;
export const BOARD_HEIGHT = GRID.rows * CELL_SIZE;
export const BOARD_OFFSET_X = 24;
export const BOARD_OFFSET_Y = 72;
export const BOARD_CENTER_X = BOARD_OFFSET_X + BOARD_WIDTH / 2;
export const BOARD_CENTER_Y = BOARD_OFFSET_Y + BOARD_HEIGHT / 2;

export const cellCenterX = (col: number): number => BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
export const cellCenterY = (row: number): number => BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;

/** Shared palette. Warm storybook cartoon direction. */
export const HUD_BG_COLOR = 0x16140e;
export const BUTTON_PRIMARY = 0x8b6b2f;
export const BUTTON_PRIMARY_HOVER = 0xa07a38;
export const BUTTON_PRIMARY_PRESS = 0x725a26;
export const BUTTON_DISABLED = 0x2e2a20;
export const BUTTON_SECONDARY = 0x6b5a30;
export const BUTTON_SECONDARY_HOVER = 0x7d6a38;
export const BUTTON_SECONDARY_PRESS = 0x5a4a26;
export const STORE_OVERLAY_BG = 0x0e0c08;
export const STORE_CARD_BG = 0x1c1a14;
export const STORE_CARD_BORDER = 0x4a4030;
export const STORE_CARD_IMAGE_BG = 0x2a2518;
export const STORE_POPUP_BG = 0x12100a;
export const STORE_CARD_LOCKED_BG = 0x13120e;
export const STORE_CARD_LOCKED_BORDER = 0x332e22;
export const STORE_CARD_LOCKED_IMAGE_BG = 0x1e1a12;
export const STORE_HEADER_H = 76;
export const STORE_FOOTER_H = 8;

export const FONT_FAMILY = 'Arial, sans-serif';

import Phaser from 'phaser';
import { getPickupDefinitionById } from '../game/pickupCatalog';
import { getCurrentVisionRadius } from '../game/runState';
import type { RunState } from '../game/types';
import { isVisibleFromHead } from '../game/visibility';
import {
  BOARD_HEIGHT,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  BOARD_WIDTH,
  CELL_SIZE,
  GRID,
  cellCenterX,
  cellCenterY,
} from './layout';

/**
 * The coffee pickup is an emoji Text object, which cannot be drawn into a
 * Graphics buffer. A small fixed pool is reused across frames instead.
 */
export class CoffeeOrbPool {
  private readonly texts: Phaser.GameObjects.Text[] = [];

  private nextIndex = 0;

  constructor(scene: Phaser.Scene, size = 3) {
    for (let i = 0; i < size; i += 1) {
      this.texts.push(
        scene.add.text(0, 0, '☕', { fontSize: '16px' }).setOrigin(0.5).setVisible(false).setDepth(10),
      );
    }
  }

  /** Call once per frame, before drawing entities. */
  reset(): void {
    this.texts.forEach((text) => text.setVisible(false));
    this.nextIndex = 0;
  }

  place(x: number, y: number): boolean {
    const text = this.texts[this.nextIndex];
    if (!text) {
      return false;
    }
    text.setPosition(x, y).setVisible(true);
    this.nextIndex += 1;
    return true;
  }
}

export const drawBoard = (graphics: Phaser.GameObjects.Graphics): void => {
  graphics.fillStyle(0x1e1c14, 1);
  graphics.fillRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, BOARD_WIDTH, BOARD_HEIGHT);

  graphics.lineStyle(1, 0x3a3528, 0.35);
  for (let c = 0; c <= GRID.cols; c += 1) {
    const x = BOARD_OFFSET_X + c * CELL_SIZE;
    graphics.lineBetween(x, BOARD_OFFSET_Y, x, BOARD_OFFSET_Y + BOARD_HEIGHT);
  }
  for (let r = 0; r <= GRID.rows; r += 1) {
    const y = BOARD_OFFSET_Y + r * CELL_SIZE;
    graphics.lineBetween(BOARD_OFFSET_X, y, BOARD_OFFSET_X + BOARD_WIDTH, y);
  }
};

const drawFriendOrb = (graphics: Phaser.GameObjects.Graphics, cx: number, cy: number): void => {
  const hair = 0x6b4c36; // warmer brown, visible on dark bg
  const skin = 0xf0c090;
  const hazel = 0x7a9060;

  // Skin face
  graphics.fillStyle(skin, 1);
  graphics.fillCircle(cx, cy - 1, 10);

  // Hair — short strip across the top (visible on dark bg)
  graphics.fillStyle(hair, 1);
  graphics.fillEllipse(cx, cy - 9, 18, 7);

  // Beard — dominant feature
  graphics.fillEllipse(cx, cy + 6, 20, 14);

  // Mustache
  graphics.fillEllipse(cx, cy + 2, 10, 4);

  // Teeth — small hint of smile
  graphics.fillStyle(0xfffde0, 1);
  graphics.fillRoundedRect(cx - 3, cy + 3, 7, 3, 1);

  // Eyes — hazel irises
  graphics.fillStyle(hazel, 1);
  graphics.fillCircle(cx - 4, cy - 4, 2);
  graphics.fillCircle(cx + 4, cy - 4, 2);

  // Pupils
  graphics.fillStyle(0x111111, 1);
  graphics.fillCircle(cx - 4, cy - 4, 1);
  graphics.fillCircle(cx + 4, cy - 4, 1);
};

const drawBulbOrb = (graphics: Phaser.GameObjects.Graphics, cx: number, cy: number): void => {
  // Bulb — warm yellow circle, shifted up to leave room for socket
  graphics.fillStyle(0xf5c518, 1);
  graphics.fillCircle(cx, cy - 3, 7);

  // Inner highlight — off-center bright spot
  graphics.fillStyle(0xfffde0, 1);
  graphics.fillCircle(cx - 2, cy - 5, 2.5);

  // Socket — small grey rounded rect below bulb
  graphics.fillStyle(0x8a7a5a, 1);
  graphics.fillRoundedRect(cx - 3, cy + 4, 6, 4, 1);
};

export const drawEntities = (
  graphics: Phaser.GameObjects.Graphics,
  state: RunState,
  nowMs: number,
  coffeeOrbs: CoffeeOrbPool,
): void => {
  const head = state.slug[0];
  const radius = getCurrentVisionRadius(state, nowMs);

  state.entities.forEach((entity) => {
    if (!isVisibleFromHead(entity.position, head, radius)) {
      return;
    }

    const x = cellCenterX(entity.position.x);
    const y = cellCenterY(entity.position.y);

    switch (entity.kind) {
      case 'orb':
        drawFriendOrb(graphics, x, y);
        break;
      case 'pickup': {
        if (entity.pickupTypeId === 'speed_boost_orb' && coffeeOrbs.place(x, y)) {
          break;
        }
        if (entity.pickupTypeId === 'vision_clarity_orb') {
          drawBulbOrb(graphics, x, y);
          break;
        }
        const pickupDefinition = getPickupDefinitionById(entity.pickupTypeId);
        graphics.fillStyle(pickupDefinition?.color ?? 0xffffff, 1);
        graphics.fillCircle(x, y, CELL_SIZE * 0.34);
        break;
      }
      default:
        break;
    }
  });
};

export const drawSlug = (graphics: Phaser.GameObjects.Graphics, state: RunState): void => {
  const slug = state.slug;
  if (slug.length === 0) return;

  const dir = state.direction;
  const total = slug.length;

  // Color gradient: warm golden-olive head -> dark olive-brown tail
  const headColor = { r: 0xc4, g: 0xa8, b: 0x48 };
  const tailColor = { r: 0x5a, g: 0x4a, b: 0x28 };

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

    const cx1 = cellCenterX(slug[i].x);
    const cy1 = cellCenterY(slug[i].y);
    const cx2 = cellCenterX(slug[i + 1].x);
    const cy2 = cellCenterY(slug[i + 1].y);

    // Only draw connector if segments are adjacent (not when wrapping around board)
    const dx = Math.abs(slug[i].x - slug[i + 1].x);
    const dy = Math.abs(slug[i].y - slug[i + 1].y);
    if (dx <= 1 && dy <= 1) {
      const taperT = (t + tNext) / 2;
      const connectorRadius = Math.round(CELL_SIZE * (0.42 - taperT * 0.18));
      graphics.fillStyle(color, 1);
      // Fill rectangle between the two centers to avoid gap
      const minX = Math.min(cx1, cx2) - connectorRadius;
      const minY = Math.min(cy1, cy2) - connectorRadius;
      const w = Math.abs(cx2 - cx1) + connectorRadius * 2;
      const h = Math.abs(cy2 - cy1) + connectorRadius * 2;
      graphics.fillRect(minX, minY, w, h);
    }
  }

  // Draw each segment as a circle (tapered toward tail)
  for (let i = total - 1; i >= 0; i -= 1) {
    const t = i / Math.max(total - 1, 1);
    const color = lerpColor(t);
    const cx = cellCenterX(slug[i].x);
    const cy = cellCenterY(slug[i].y);
    // Head is widest (0.46), tail tapers to 0.22
    const radius = Math.round(CELL_SIZE * (0.46 - t * 0.24));
    graphics.fillStyle(color, 1);
    graphics.fillCircle(cx, cy, radius);

    // Darker olive spots on body segments (not head)
    if (i >= 1 && i <= 3) {
      graphics.fillStyle(0x7a6a30, 0.7);
      const spotOff = i % 2 === 1 ? 2 : -2;
      graphics.fillCircle(cx + spotOff, cy - 1, 2);
    }
  }

  // Eyes on head
  const headCx = cellCenterX(slug[0].x);
  const headCy = cellCenterY(slug[0].y);
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
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(ex1, ey1, 3);
  graphics.fillCircle(ex2, ey2, 3);
  // Dark pupil
  graphics.fillStyle(0x111111, 1);
  graphics.fillCircle(ex1, ey1, 1.5);
  graphics.fillCircle(ex2, ey2, 1.5);

  // Rosy cheeks — below and outside the eyes
  graphics.fillStyle(0xe07860, 0.4);
  if (dir === 'right' || dir === 'left') {
    graphics.fillCircle(ex1 - (dir === 'right' ? 2 : -2), ey1 + 3, 2.5);
    graphics.fillCircle(ex2 - (dir === 'right' ? 2 : -2), ey2 - 3, 2.5);
  } else {
    graphics.fillCircle(ex1 + 3, ey1 - (dir === 'down' ? 2 : -2), 2.5);
    graphics.fillCircle(ex2 - 3, ey2 - (dir === 'down' ? 2 : -2), 2.5);
  }

  // Antennae — two stalks extending forward from head with round tips
  const antennaLen = 7;
  const antennaSpread = 4;
  graphics.fillStyle(0xa08838, 1);
  let a1x: number, a1y: number, a2x: number, a2y: number;
  if (dir === 'right' || dir === 'left') {
    const fwd = dir === 'right' ? 1 : -1;
    a1x = headCx + fwd * antennaLen; a1y = headCy - antennaSpread;
    a2x = headCx + fwd * antennaLen; a2y = headCy + antennaSpread;
    graphics.fillRect(headCx + fwd * 2 - 1, headCy - antennaSpread - 1, Math.abs(antennaLen - 2), 2);
    graphics.fillRect(headCx + fwd * 2 - 1, headCy + antennaSpread - 1, Math.abs(antennaLen - 2), 2);
  } else {
    const fwd = dir === 'down' ? 1 : -1;
    a1x = headCx - antennaSpread; a1y = headCy + fwd * antennaLen;
    a2x = headCx + antennaSpread; a2y = headCy + fwd * antennaLen;
    graphics.fillRect(headCx - antennaSpread - 1, headCy + fwd * 2 - 1, 2, Math.abs(antennaLen - 2));
    graphics.fillRect(headCx + antennaSpread - 1, headCy + fwd * 2 - 1, 2, Math.abs(antennaLen - 2));
  }
  // Round antenna tips
  graphics.fillCircle(a1x, a1y, 2);
  graphics.fillCircle(a2x, a2y, 2);
};

export const drawFog = (
  graphics: Phaser.GameObjects.Graphics,
  state: RunState,
  nowMs: number,
): void => {
  const head = state.slug[0];
  const radius = getCurrentVisionRadius(state, nowMs);

  graphics.fillStyle(0x0a0906, 1);
  for (let y = 0; y < GRID.rows; y += 1) {
    for (let x = 0; x < GRID.cols; x += 1) {
      if (isVisibleFromHead({ x, y }, head, radius)) {
        continue;
      }
      graphics.fillRect(
        BOARD_OFFSET_X + x * CELL_SIZE,
        BOARD_OFFSET_Y + y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE,
      );
    }
  }
};

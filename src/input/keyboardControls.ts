import Phaser from 'phaser';
import type { Direction } from '../game/types';

export interface GameInputHandlers {
  onDirection: (direction: Direction) => void;
  onRestart: () => void;
  onTogglePause: () => void;
  onScroll: (deltaY: number) => void;
}

/**
 * Direction bindings use Phaser key codes, which macOS resolves from the
 * physical key position: the WASD block is ZQSD on an AZERTY keyboard.
 */
const DIRECTION_KEYS: ReadonlyArray<readonly [string, Direction]> = [
  ['UP', 'up'],
  ['W', 'up'],
  ['DOWN', 'down'],
  ['S', 'down'],
  ['LEFT', 'left'],
  ['A', 'left'],
  ['RIGHT', 'right'],
  ['D', 'right'],
];

export const registerGameInputs = (scene: Phaser.Scene, handlers: GameInputHandlers): void => {
  DIRECTION_KEYS.forEach(([key, direction]) => {
    scene.input.keyboard?.on(`keydown-${key}`, () => handlers.onDirection(direction));
  });

  scene.input.keyboard?.on('keydown-R', () => handlers.onRestart());
  scene.input.keyboard?.on('keydown-SPACE', () => handlers.onTogglePause());

  scene.input.on(
    'wheel',
    (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      handlers.onScroll(deltaY);
    },
  );
};

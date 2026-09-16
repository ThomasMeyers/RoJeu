import Phaser from 'phaser';
import { collectTalentEffectIds, loadMetaState, saveMetaState } from '../game/metaState';
import {
  commitSudoku,
  createInitialRunState,
  getCurrentTickMs,
  queueDirection,
  stepRun,
} from '../game/runState';
import { ensureOrbSpawn } from '../game/spawnSystem';
import { TALENT_CATALOG } from '../game/talentCatalog';
import type { MetaState, RunState } from '../game/types';
import { CoffeeOrbPool, drawBoard, drawEntities, drawFog, drawSlug } from '../render/boardRenderer';
import { GRID } from '../render/layout';
import { registerGameInputs } from '../input/keyboardControls';
import { EndScreenView } from '../ui/endScreenView';
import { HudView } from '../ui/hudView';
import { StoreView } from '../ui/storeView';

const FINALE_FADE_MS = 600;

/**
 * Orchestrates one game session: owns run and meta state, drives the fixed-step
 * loop, and delegates every pixel to the render/ and ui/ modules.
 */
export class GameScene extends Phaser.Scene {
  private runState!: RunState;

  private meta!: MetaState;

  private isPaused = false;

  /** Set while fading out to the finale: gameplay inputs are ignored from then on. */
  private isLeavingForFinale = false;

  private tickAccumulatorMs = 0;

  private graphics!: Phaser.GameObjects.Graphics;

  private coffeeOrbs!: CoffeeOrbPool;

  private hud!: HudView;

  private endScreen!: EndScreenView;

  private store!: StoreView;

  constructor() {
    super('GameScene');
  }

  preload() {
    for (const talent of TALENT_CATALOG) {
      if (talent.imageAsset) {
        this.load.image(talent.imageAsset, `assets/talents/${talent.id}.png`);
      }
    }
    this.load.on('complete', () => {
      for (const talent of TALENT_CATALOG) {
        if (talent.imageAsset && this.textures.exists(talent.imageAsset)) {
          this.textures.get(talent.imageAsset).setFilter(Phaser.Textures.FilterMode.LINEAR);
        }
      }
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#14120c');
    this.isPaused = false;
    this.isLeavingForFinale = false;
    this.tickAccumulatorMs = 0;
    this.meta = loadMetaState();
    this.runState = this.createFreshRunState();

    // Creation order matters: the end-screen objects and the sudoku button carry
    // no explicit depth, so their z-order comes from the order they are added.
    this.graphics = this.add.graphics();
    this.coffeeOrbs = new CoffeeOrbPool(this);

    this.hud = new HudView(this);
    this.hud.create();

    this.endScreen = new EndScreenView(this);
    this.endScreen.create({
      onRestart: () => this.restartRun(),
      onOpenStore: () => this.store.openStore(),
      canOpenStore: () => this.runState.phase === 'ended',
      onReplayFinale: () => this.startFinale(),
    });

    this.store = new StoreView(this);
    this.store.create(this.meta, {
      onEndScreenInteractiveChange: (enabled) => this.endScreen.setButtonsInteractive(enabled),
      onEndingPurchased: () => this.startFinale(),
    });

    this.hud.createSudokuButton(() => {
      if (this.runState.phase === 'running') {
        commitSudoku(this.runState, this.time.now);
        this.redraw();
      }
    });

    registerGameInputs(this, {
      onDirection: (direction) => {
        if (!this.isLeavingForFinale) {
          queueDirection(this.runState, direction, this.time.now);
        }
      },
      onRestart: () => this.restartRun(),
      onTogglePause: () => this.togglePause(),
      onScroll: (deltaY) => {
        if (!this.store.isOpen || this.store.hasSelection) {
          return;
        }
        this.store.scrollBy(deltaY);
      },
    });

    this.redraw();
  }

  update(_time: number, deltaMs: number) {
    if (this.runState.phase === 'running' && !this.isPaused) {
      this.tickAccumulatorMs += deltaMs;

      while (
        this.tickAccumulatorMs >= getCurrentTickMs(this.runState, this.time.now) &&
        this.runState.phase === 'running'
      ) {
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

  private createFreshRunState(): RunState {
    const state = createInitialRunState(GRID, collectTalentEffectIds(this.meta), this.time.now);
    ensureOrbSpawn(state, GRID, this.time.now);
    return state;
  }

  private restartRun() {
    if (this.isLeavingForFinale) {
      return;
    }
    this.tickAccumulatorMs = 0;
    this.isPaused = false;
    this.store.close();
    this.runState = this.createFreshRunState();
    this.redraw();
  }

  /** Buying `ending_unlock`, or the end-screen replay button, fades out to the finale. */
  private startFinale() {
    if (this.isLeavingForFinale || this.runState.phase !== 'ended') {
      return;
    }
    this.isLeavingForFinale = true;
    this.store.close();
    this.endScreen.setButtonsInteractive(false);
    this.cameras.main.fadeOut(FINALE_FADE_MS);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('FinaleScene');
    });
  }

  private togglePause() {
    if (this.runState.phase !== 'running') {
      return;
    }
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.tickAccumulatorMs = 0;
    }
  }

  private redraw() {
    this.graphics.clear();
    this.coffeeOrbs.reset();

    if (this.runState.phase === 'ended') {
      this.endScreen.setVisible(true);
      this.endScreen.refresh(this.runState, this.meta);
      if (this.store.isOpen) {
        this.store.refresh();
      } else {
        this.store.setVisible(false);
        this.store.setPopupVisible(false);
      }
      this.hud.setVisible(false);
      return;
    }

    this.store.close();
    this.endScreen.setVisible(false);
    this.hud.setVisible(true);

    drawBoard(this.graphics);
    drawEntities(this.graphics, this.runState, this.time.now, this.coffeeOrbs);
    drawSlug(this.graphics, this.runState);
    drawFog(this.graphics, this.runState, this.time.now);
    this.hud.refresh(this.runState, this.meta, this.time.now);
  }
}

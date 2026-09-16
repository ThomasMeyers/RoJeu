import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canUpgradeTalent,
  clearMetaState,
  collectTalentEffectIds,
  createDefaultMetaState,
  getStoreTalentItems,
  getTalentNextCost,
  hasSavedMeta,
  isEndingUnlocked,
  isTalentUnlocked,
  loadMetaState,
  saveMetaState,
  upgradeTalentLevel,
} from './metaState';
import type { MetaState } from './types';

/** Minimal localStorage so the module under test can persist without a DOM. */
const createLocalStorageStub = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

const ROW_ONE_MAXED = {
  orb_yield: 5,
  passive_income: 5,
  vision_bonus_orb: 5,
};

const metaWith = (talentLevels: Record<string, number>, totalPoints = 0): MetaState => ({
  ...createDefaultMetaState(),
  totalPoints,
  talentLevels,
});

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: createLocalStorageStub() });
});

describe('loadMetaState', () => {
  it('falls back to a default state when storage is empty', () => {
    expect(loadMetaState()).toEqual({ totalPoints: 0, runCount: 0, talentLevels: {} });
  });

  it('falls back to a default state on malformed stored data', () => {
    window.localStorage.setItem('snake-meta', '{"totalPoints":"nope"}');
    expect(loadMetaState()).toEqual(createDefaultMetaState());
  });

  it('falls back to a default state on unparsable stored data', () => {
    window.localStorage.setItem('snake-meta', 'not json at all');
    expect(loadMetaState()).toEqual(createDefaultMetaState());
  });
});

describe('getTalentNextCost', () => {
  it('returns the cost of the upcoming level', () => {
    expect(getTalentNextCost(metaWith({}), 'orb_yield')).toBe(300);
    expect(getTalentNextCost(metaWith({ orb_yield: 1 }), 'orb_yield')).toBe(450);
  });

  it('returns null once the talent is maxed', () => {
    expect(getTalentNextCost(metaWith({ orb_yield: 5 }), 'orb_yield')).toBeNull();
  });

  it('returns null for an unknown talent id', () => {
    expect(getTalentNextCost(metaWith({}), 'ghost_talent')).toBeNull();
  });
});

describe('isTalentUnlocked', () => {
  it('always unlocks the first-row talents', () => {
    const meta = metaWith({});
    expect(isTalentUnlocked(meta, 'orb_yield')).toBe(true);
    expect(isTalentUnlocked(meta, 'passive_income')).toBe(true);
    expect(isTalentUnlocked(meta, 'vision_bonus_orb')).toBe(true);
  });

  it('keeps no_walls locked until all three first-row talents are maxed', () => {
    expect(isTalentUnlocked(metaWith({}), 'no_walls')).toBe(false);
    expect(
      isTalentUnlocked(metaWith({ orb_yield: 5, passive_income: 5, vision_bonus_orb: 4 }), 'no_walls'),
    ).toBe(false);
    expect(isTalentUnlocked(metaWith(ROW_ONE_MAXED), 'no_walls')).toBe(true);
  });

  it('keeps speed_boost_pickup locked until no_walls is owned', () => {
    expect(isTalentUnlocked(metaWith(ROW_ONE_MAXED), 'speed_boost_pickup')).toBe(false);
    expect(
      isTalentUnlocked(metaWith({ ...ROW_ONE_MAXED, no_walls: 1 }), 'speed_boost_pickup'),
    ).toBe(true);
  });
});

describe('canUpgradeTalent', () => {
  it('requires enough points', () => {
    expect(canUpgradeTalent(metaWith({}, 299), 'orb_yield')).toBe(false);
    expect(canUpgradeTalent(metaWith({}, 300), 'orb_yield')).toBe(true);
  });

  it('refuses a locked talent even with enough points', () => {
    expect(canUpgradeTalent(metaWith({}, 999_999), 'no_walls')).toBe(false);
  });

  it('refuses a maxed talent', () => {
    expect(canUpgradeTalent(metaWith({ orb_yield: 5 }, 999_999), 'orb_yield')).toBe(false);
  });
});

describe('upgradeTalentLevel', () => {
  it('spends the points and raises the level', () => {
    const meta = metaWith({}, 500);

    expect(upgradeTalentLevel(meta, 'orb_yield')).toBe(true);
    expect(meta.totalPoints).toBe(200);
    expect(meta.talentLevels.orb_yield).toBe(1);
  });

  it('persists the new state', () => {
    const meta = metaWith({}, 500);
    upgradeTalentLevel(meta, 'orb_yield');

    expect(loadMetaState()).toEqual(meta);
  });

  it('leaves the state untouched when it cannot afford the level', () => {
    const meta = metaWith({}, 100);

    expect(upgradeTalentLevel(meta, 'orb_yield')).toBe(false);
    expect(meta.totalPoints).toBe(100);
    expect(meta.talentLevels.orb_yield).toBeUndefined();
  });

  it('leaves the state untouched when the talent is locked', () => {
    const meta = metaWith({}, 999_999);

    expect(upgradeTalentLevel(meta, 'no_walls')).toBe(false);
    expect(meta.totalPoints).toBe(999_999);
  });
});

describe('collectTalentEffectIds', () => {
  it('returns one effect id per owned level', () => {
    expect(collectTalentEffectIds(metaWith({ orb_yield: 2 }))).toEqual([
      'orb_yield_lvl1',
      'orb_yield_lvl2',
    ]);
  });

  it('returns nothing for a fresh save', () => {
    expect(collectTalentEffectIds(createDefaultMetaState())).toEqual([]);
  });

  it('clamps a corrupted level above the maximum', () => {
    expect(collectTalentEffectIds(metaWith({ orb_yield: 99 }))).toHaveLength(5);
  });

  it('ignores a negative level', () => {
    expect(collectTalentEffectIds(metaWith({ orb_yield: -3 }))).toEqual([]);
  });
});

describe('getStoreTalentItems', () => {
  it('orders items by store row then order', () => {
    const items = getStoreTalentItems(metaWith({}));
    const positions = items.map((item) => `${item.storeRow}.${item.storeOrder}`);

    expect(positions).toEqual([...positions].sort());
    expect(items[0].id).toBe('orb_yield');
  });

  it('marks a talent as deeply locked when its own prerequisite is still locked', () => {
    const items = getStoreTalentItems(metaWith({}));
    const noWalls = items.find((item) => item.id === 'no_walls');
    const speedBoost = items.find((item) => item.id === 'speed_boost_pickup');

    expect(noWalls?.isDeeplyLocked).toBe(false);
    expect(speedBoost?.isDeeplyLocked).toBe(true);
  });

  it('stops being deeply locked once the prerequisite chain is reachable', () => {
    const items = getStoreTalentItems(metaWith(ROW_ONE_MAXED));
    const speedBoost = items.find((item) => item.id === 'speed_boost_pickup');

    expect(speedBoost?.isUnlocked).toBe(false);
    expect(speedBoost?.isDeeplyLocked).toBe(false);
  });

  it('clamps a corrupted level down to the talent maximum', () => {
    const items = getStoreTalentItems(metaWith({ orb_yield: 99 }));
    const orbYield = items.find((item) => item.id === 'orb_yield');

    expect(orbYield?.level).toBe(5);
    expect(orbYield?.isMaxed).toBe(true);
  });

  it('clamps a negative level up to zero', () => {
    const items = getStoreTalentItems(metaWith({ orb_yield: -3 }));

    expect(items.find((item) => item.id === 'orb_yield')?.level).toBe(0);
  });

  it('reports maxed talents with no next cost', () => {
    const items = getStoreTalentItems(metaWith({ orb_yield: 5 }, 999_999));
    const orbYield = items.find((item) => item.id === 'orb_yield');

    expect(orbYield?.isMaxed).toBe(true);
    expect(orbYield?.nextCost).toBeNull();
    expect(orbYield?.canUpgrade).toBe(false);
  });
});

describe('ending_unlock', () => {
  const EVERYTHING_ELSE_MAXED = { ...ROW_ONE_MAXED, no_walls: 1, speed_boost_pickup: 5 };

  it('stays locked until every other talent is maxed', () => {
    expect(
      isTalentUnlocked(metaWith({ ...EVERYTHING_ELSE_MAXED, speed_boost_pickup: 4 }), 'ending_unlock'),
    ).toBe(false);
    expect(isTalentUnlocked(metaWith(EVERYTHING_ELSE_MAXED), 'ending_unlock')).toBe(true);
  });

  it('reports the ending unlocked only once bought', () => {
    const meta = metaWith(EVERYTHING_ELSE_MAXED, 10_000);
    expect(isEndingUnlocked(meta)).toBe(false);

    expect(upgradeTalentLevel(meta, 'ending_unlock')).toBe(true);

    expect(meta.totalPoints).toBe(0);
    expect(isEndingUnlocked(meta)).toBe(true);
  });

  it('grants no gameplay effect', () => {
    expect(collectTalentEffectIds(metaWith({ ending_unlock: 1 }))).toEqual([]);
  });
});

describe('hasSavedMeta / clearMetaState', () => {
  it('reports no save when storage is empty', () => {
    expect(hasSavedMeta()).toBe(false);
  });

  it('reports no save when the stored data is corrupt', () => {
    window.localStorage.setItem('snake-meta', 'not json at all');
    expect(hasSavedMeta()).toBe(false);

    window.localStorage.setItem('snake-meta', '{"totalPoints":"nope"}');
    expect(hasSavedMeta()).toBe(false);
  });

  it('reports a save once a valid state has been written, even a fresh one', () => {
    saveMetaState(createDefaultMetaState());
    expect(hasSavedMeta()).toBe(true);
  });

  it('removes the save so the next load starts from scratch', () => {
    saveMetaState(metaWith({ orb_yield: 2 }, 500));

    clearMetaState();

    expect(hasSavedMeta()).toBe(false);
    expect(loadMetaState()).toEqual(createDefaultMetaState());
  });
});

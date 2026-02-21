import type { MetaState } from './types';

const STORAGE_KEY = 'snake-meta-v1';

interface TalentDefinition {
  id: string;
  maxLevel: number;
  effectIdsByLevel: string[];
}

const TALENT_DEFINITIONS: TalentDefinition[] = [
  { id: 'bave_baveuse', maxLevel: 3, effectIdsByLevel: ['bave_baveuse_lvl1', '', ''] },
  { id: 'casque', maxLevel: 3, effectIdsByLevel: ['casque_lvl1', '', ''] },
  { id: 'around_the_world', maxLevel: 1, effectIdsByLevel: ['around_the_world_lvl1'] },
  { id: 'be_like_momo', maxLevel: 3, effectIdsByLevel: ['be_like_momo_lvl1', '', ''] },
  { id: 'heures_supplementaires', maxLevel: 3, effectIdsByLevel: ['heures_supplementaires_lvl1', '', ''] },
];

export const createDefaultMetaState = (): MetaState => ({
  totalPoints: 0,
  runCount: 0,
  talentLevels: {},
});

const isMetaState = (value: unknown): value is MetaState => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<MetaState>;
  return (
    typeof candidate.totalPoints === 'number' &&
    typeof candidate.runCount === 'number' &&
    typeof candidate.talentLevels === 'object' &&
    candidate.talentLevels !== null
  );
};

export const loadMetaState = (): MetaState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultMetaState();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isMetaState(parsed)) {
      return createDefaultMetaState();
    }

    return parsed;
  } catch {
    return createDefaultMetaState();
  }
};

export const saveMetaState = (meta: MetaState): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
};

export const collectTalentEffectIds = (meta: MetaState): string[] => {
  const effectIds: string[] = [];

  TALENT_DEFINITIONS.forEach((talent) => {
    const level = Math.min(meta.talentLevels[talent.id] ?? 0, talent.maxLevel);
    for (let i = 0; i < level; i += 1) {
      const effectId = talent.effectIdsByLevel[i];
      if (effectId) {
        effectIds.push(effectId);
      }
    }
  });

  return effectIds;
};

import type { MetaState } from './types';
import { TALENT_CATALOG, type TalentCatalogEntry } from './talentCatalog';

const STORAGE_KEY = 'snake-meta-v1';

export interface TalentStoreItem {
  id: string;
  title: string;
  description: string;
  imageToken: string;
  level: number;
  maxLevel: number;
  nextCost: number | null;
  isMaxed: boolean;
  canUpgrade: boolean;
}

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

const clampTalentLevel = (meta: MetaState, talent: TalentCatalogEntry): number => {
  const rawLevel = meta.talentLevels[talent.id] ?? 0;
  return Math.max(0, Math.min(rawLevel, talent.maxLevel));
};

export const getTalentById = (talentId: string): TalentCatalogEntry | null =>
  TALENT_CATALOG.find((talent) => talent.id === talentId) ?? null;

export const getAvailableTalentCatalog = (): TalentCatalogEntry[] =>
  TALENT_CATALOG.filter((talent) => talent.isAvailable);

export const getTalentNextCost = (meta: MetaState, talentId: string): number | null => {
  const talent = getTalentById(talentId);
  if (!talent) {
    return null;
  }
  const level = clampTalentLevel(meta, talent);
  if (level >= talent.maxLevel) {
    return null;
  }
  return talent.costsByLevel[level] ?? null;
};

export const canUpgradeTalent = (meta: MetaState, talentId: string): boolean => {
  const talent = getTalentById(talentId);
  if (!talent || !talent.isAvailable) {
    return false;
  }
  const nextCost = getTalentNextCost(meta, talentId);
  if (nextCost === null) {
    return false;
  }
  return meta.totalPoints >= nextCost;
};

export const upgradeTalentLevel = (meta: MetaState, talentId: string): boolean => {
  const talent = getTalentById(talentId);
  if (!talent || !talent.isAvailable) {
    return false;
  }
  const nextCost = getTalentNextCost(meta, talentId);
  if (nextCost === null || meta.totalPoints < nextCost) {
    return false;
  }
  const currentLevel = clampTalentLevel(meta, talent);
  meta.totalPoints -= nextCost;
  meta.talentLevels[talent.id] = currentLevel + 1;
  saveMetaState(meta);
  return true;
};

export const getStoreTalentItems = (meta: MetaState): TalentStoreItem[] =>
  getAvailableTalentCatalog().map((talent) => {
    const level = clampTalentLevel(meta, talent);
    const nextCost = getTalentNextCost(meta, talent.id);
    const isMaxed = level >= talent.maxLevel;
    return {
      id: talent.id,
      title: talent.title,
      description: talent.description,
      imageToken: talent.imageToken,
      level,
      maxLevel: talent.maxLevel,
      nextCost,
      isMaxed,
      canUpgrade: !isMaxed && nextCost !== null && meta.totalPoints >= nextCost,
    };
  });

export const collectTalentEffectIds = (meta: MetaState): string[] => {
  const effectIds: string[] = [];

  TALENT_CATALOG.forEach((talent) => {
    const level = clampTalentLevel(meta, talent);
    for (let i = 0; i < level; i += 1) {
      const effectId = talent.effectIdsByLevel[i];
      if (effectId) {
        effectIds.push(effectId);
      }
    }
  });

  return effectIds;
};

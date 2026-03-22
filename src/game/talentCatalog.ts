export interface TalentUnlockRequirement {
  talentId: string;
  minLevel: number;
}

export type TalentUnlockRule =
  | { type: 'always' }
  | {
    type: 'requires_talents_all';
    requirements: TalentUnlockRequirement[];
    requirementText: string;
  };

export interface TalentCatalogEntry {
  id: string;
  title: string;
  description: string;
  imageToken: string;
  imageAsset?: string;
  maxLevel: number;
  costsByLevel: number[];
  isAvailable: boolean;
  effectIdsByLevel: string[];
  unlockRule: TalentUnlockRule;
  storeRow: number;
  storeOrder: number;
}

export const TALENT_CATALOG: TalentCatalogEntry[] = [
  {
    id: 'orb_yield',
    title: 'Bave baveuse',
    description: "Augmente les points d'orb de +10% par niveau.",
    imageToken: 'BB',
    imageAsset: 'talent_orb_yield',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: [
      'orb_yield_lvl1',
      'orb_yield_lvl2',
      'orb_yield_lvl3',
      'orb_yield_lvl4',
      'orb_yield_lvl5',
    ],
    unlockRule: { type: 'always' },
    storeRow: 1,
    storeOrder: 1,
  },
  {
    id: 'passive_income',
    title: 'Chanson francaise',
    description:
      'Tu te mets a chantonner des tubes de chanson francaise pour un maximum de deplaisir. + 1 point / s tant que tu restes en vie',
    imageToken: 'CA',
    imageAsset: 'talent_passive_income',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: [
      'passive_income_lvl1',
      'passive_income_lvl2',
      'passive_income_lvl3',
      'passive_income_lvl4',
      'passive_income_lvl5',
    ],
    unlockRule: { type: 'always' },
    storeRow: 1,
    storeOrder: 2,
  },
  {
    id: 'vision_bonus_orb',
    title: 'Filsdeputemalumiere',
    description: "Fais apparaitre des bonus qui te permettront d'y voir plus clair. Pendant un temps.",
    imageToken: 'LM',
    imageAsset: 'talent_vision_bonus_orb',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: [
      'vision_bonus_orb_lvl1',
      'vision_bonus_orb_lvl2',
      'vision_bonus_orb_lvl3',
      'vision_bonus_orb_lvl4',
      'vision_bonus_orb_lvl5',
    ],
    unlockRule: { type: 'always' },
    storeRow: 1,
    storeOrder: 3,
  },
  {
    id: 'no_walls',
    title: 'Around the world',
    description:
      'Around the world around the world. Around the world, around the world. Around the world ? Around the world !',
    imageToken: 'ATW',
    imageAsset: 'talent_no_walls',
    maxLevel: 1,
    costsByLevel: [5000],
    isAvailable: true,
    effectIdsByLevel: ['no_walls_lvl1'],
    unlockRule: {
      type: 'requires_talents_all',
      requirements: [
        { talentId: 'orb_yield', minLevel: 5 },
        { talentId: 'passive_income', minLevel: 5 },
        { talentId: 'vision_bonus_orb', minLevel: 5 },
      ],
      requirementText: 'Maxer les 3 talents de la premiere ligne.',
    },
    storeRow: 2,
    storeOrder: 1,
  },
  {
    id: 'speed_boost_pickup',
    title: 'Ptit kawa ou kwa ?',
    description:
      'Prends ta dose pour te faire aller plus vite pendant un temps donné. Mais attention au crash.',
    imageToken: 'KW',
    imageAsset: 'talent_speed_boost_pickup',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: [
      'speed_boost_pickup_lvl1',
      'speed_boost_pickup_lvl2',
      'speed_boost_pickup_lvl3',
      'speed_boost_pickup_lvl4',
      'speed_boost_pickup_lvl5',
    ],
    unlockRule: {
      type: 'requires_talents_all',
      requirements: [{ talentId: 'no_walls', minLevel: 1 }],
      requirementText: 'Débloquer le talent Around The World.',
    },
    storeRow: 3,
    storeOrder: 1,
  }
];

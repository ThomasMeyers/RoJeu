export interface TalentCatalogEntry {
  id: string;
  title: string;
  description: string;
  imageToken: string;
  maxLevel: number;
  costsByLevel: number[];
  isAvailable: boolean;
  effectIdsByLevel: string[];
}

export const TALENT_CATALOG: TalentCatalogEntry[] = [
  {
    id: 'orb_yield',
    title: 'Bave baveuse',
    description: "Augmente les points d'orb de +10% par niveau.",
    imageToken: 'BB',
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
  },
  {
    id: 'passive_income',
    title: 'Chanson francaise',
    description:
      'Tu te mets a chantonner des tubes de chanson francaise pour un maximum de deplaisir. + 1 point / s tant que tu restes en vie',
    imageToken: 'CA',
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
  },
  {
    id: 'boundary_wrap',
    title: 'Around the world',
    description: 'Un futur talent de mobilite pour contourner les limites de la map.',
    imageToken: 'AT',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: ['', '', '', '', ''],
  },
  {
    id: 'prototype_slot_a',
    title: 'Be like momo',
    description: 'Prototype reserve pour plus tard.',
    imageToken: 'BM',
    maxLevel: 5,
    costsByLevel: [250, 400, 600, 900, 1300],
    isAvailable: false,
    effectIdsByLevel: ['', '', '', '', ''],
  },
  {
    id: 'prototype_slot_b',
    title: 'Heures supplementaires',
    description: 'Prototype reserve pour plus tard.',
    imageToken: 'HS',
    maxLevel: 5,
    costsByLevel: [250, 400, 600, 900, 1300],
    isAvailable: false,
    effectIdsByLevel: ['', '', '', '', ''],
  },
];

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
    id: 'bave_baveuse',
    title: 'Bave baveuse',
    description: "Augmente les points d'orb de +10% par niveau.",
    imageToken: 'BB',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: [
      'bave_baveuse_lvl1',
      'bave_baveuse_lvl2',
      'bave_baveuse_lvl3',
      'bave_baveuse_lvl4',
      'bave_baveuse_lvl5',
    ],
  },
  {
    id: 'casque',
    title: 'Casque',
    description: "Un equipement de fortune pour mieux s'orienter dans la nuit.",
    imageToken: 'CA',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: ['', '', '', '', ''],
  },
  {
    id: 'around_the_world',
    title: 'Around the world',
    description: 'Un futur talent de mobilite pour contourner les limites de la map.',
    imageToken: 'AT',
    maxLevel: 5,
    costsByLevel: [300, 450, 700, 1000, 1400],
    isAvailable: true,
    effectIdsByLevel: ['', '', '', '', ''],
  },
  {
    id: 'be_like_momo',
    title: 'Be like momo',
    description: 'Prototype reserve pour plus tard.',
    imageToken: 'BM',
    maxLevel: 5,
    costsByLevel: [250, 400, 600, 900, 1300],
    isAvailable: false,
    effectIdsByLevel: ['', '', '', '', ''],
  },
  {
    id: 'heures_supplementaires',
    title: 'Heures supplementaires',
    description: 'Prototype reserve pour plus tard.',
    imageToken: 'HS',
    maxLevel: 5,
    costsByLevel: [250, 400, 600, 900, 1300],
    isAvailable: false,
    effectIdsByLevel: ['', '', '', '', ''],
  },
];

import type { StoryBeat } from './storySequencer';

/**
 * Title screen copy. The placeholder title is the joke, not a TODO: keep it.
 * Clicking the title cycles through `rejectedNames`.
 */
export const TITLE_SCREEN = {
  title: '*Insert Name Of The Game Here*',
  subtitle: '*Insert Catchy Subtitle Here*',
  rejectedNames: [
    'Snake mais lent',
    'Limace Simulator 2026',
    "Rogie's Creed",
    'Bave Story',
    'The Legend of Limi',
  ],
  newGameLabel: 'Lancer une nouvelle partie',
  continueLabel: 'Continuer',
  navigationHint: '↑ ↓ pour choisir  ·  Entrée pour valider',
  resetConfirmText: 'Ta progression sera effacée.\nSûr ?',
  resetConfirmYesLabel: 'Oui',
  resetConfirmNoLabel: 'Non',
};

/** Intro shown once per new game, one beat per player input. */
export const INTRO_BEATS: readonly StoryBeat[] = [
  {
    id: 'intro_best_life',
    text: 'Comme toujours, toi, Limi la limace, tu vivais ta meilleure vie.',
  },
  { id: 'intro_nothing_all_day', text: 'Rien le matin. Rien le midi. Rien le soir.' },
  { id: 'intro_nothing_at_night', text: 'Et un peu de rien la nuit, pour varier.' },
  { id: 'intro_more_fun', text: 'Comment la vie aurait-elle pu être plus fun ?' },
  {
    id: 'intro_life_tipped',
    text: "Tout ça te semblait parfait, jusqu'au jour où tout bascula.",
  },
  {
    id: 'intro_ground_shakes',
    text: 'Enfin… une nuit, plutôt. Alors que tu étais tranquille à ne rien faire, tu sentis le sol vibrer.',
    effect: 'shake',
    effectTrigger: 'vibrer',
    effectSkipQuip: "(Laisse le temps au texte de s'afficher putain)",
  },
  {
    id: 'intro_brave_the_dark',
    text: "Prenant ton courage à deux mains inexistantes, tu décidas de braver le noir et d'investiguer.",
  },
  { id: 'intro_life_goal', text: "Et c'est là que tu le vis : l'objectif de ta vie." },
  { id: 'intro_snoring_beard', text: 'Le barbu ronflant.', effect: 'punchline' },
  { id: 'intro_rogie', text: 'Le Rogie.', effect: 'punchline' },
];

/** Screen between the intro and the first run. */
export const MISSION_BRIEF = {
  text: 'Te voilà dans le noir.\nQuelque part, Rogie ronfle.\nExplore les alentours pour le retrouver !',
  controlsHint: 'Flèches ou ZQSD pour ramper',
  ctaLabel: 'On y va Zest partiiiiii !',
};

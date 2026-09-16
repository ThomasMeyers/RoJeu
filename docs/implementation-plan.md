# Plan d'implementation - Snake Surprise

## Vision
Creer un jeu web "snake detourne" autour d'une limace, fun et rapide a livrer, jouable sur ordinateur.

## Decisions de perimetre (12/09/2026)
- **Mobile abandonne**: cible unique desktop au clavier. Aucun controle tactile / swipe ne sera
  implemente (aucun n'avait ete ecrit, l'abandon est sans impact code).
- **Publication abandonnee**: pas de deploiement statique ni d'URL publique. Le partage se fait
  en donnant acces au depot prive, le destinataire clone et lance en local (`npm install`,
  `npm run dev`).
- Consequence: la "definition of done" ci-dessous a ete revue, M2 et M4 sont reduits.

## Principes de scope
- Prioriser un jeu jouable rapidement.
- Garder une execution locale simple (sans backend).
- Ajouter les bonus uniquement si le coeur de gameplay est stable.

## Architecture cible (grosse maille)
- `src/game/`: logique de grille, collisions, score, etat de partie.
- `src/scenes/`: ecran accueil, scene gameplay, ecran game over.
- `src/render/`: geometrie du plateau, palette, dessin du plateau/limace/entites.
- `src/input/`: clavier (desktop) + molette.
- `src/ui/`: HUD score, meilleur score local, boutons restart/play.

> Note: ces quatre dossiers existent depuis le decoupage du 12/09/2026. `GameScene.ts` ne fait
> plus que de l'orchestration.

## Backlog ordonne

### M0 - Setup (fait, sauf lint)
- [x] Initialiser projet TypeScript avec Vite + Phaser.
- [x] Definir scripts `dev`, `build`, `preview`.
- [ ] Ajouter config lint/format minimale.

### M1 - MVP jouable (fait)
- [x] Deplacement 4 directions sur grille.
- [x] Spawn nourriture standard.
- [x] Croissance de la limace et score.
- [x] Collision mur/corps = game over.
- [x] Restart immediat.

Critere de validation: une partie complete est jouable du debut a la fin sur desktop. **Atteint.**

### M2 - Style limace (mobile retire)
- [x] Rendu limace (palette, tete/corps, direction artistique cartoon storybook).
- [ ] Effet "trainee de bave" (fade simple performant). **Non implemente a ce jour.**
- ~~Ajout controles tactiles (swipe avec seuil anti-erreur).~~ Abandonne (mobile hors scope).
- ~~UI responsive portrait/paysage.~~ Abandonne (mobile hors scope).

Critere de validation: identite visuelle limace perceptible sur desktop.

### M3 - Bonus (largement depasse)
- [x] Palier 1: entites de collecte differenciees (orb + pickups dedies).
- [x] Palier 2: bonus temporaires (boost vitesse, boost de vision, effets timed).
- [x] Au-dela du plan initial: meta-progression persistante (talents, store, `localStorage`).
- [ ] Palier 3: variantes de mode (chrono dedie, obstacles).

### M4 - Partage (remplace "Publication")
- [x] Build production fonctionnel (`npm run build`).
- [ ] README avec instructions de lancement local verifiees.
- [ ] Donner acces au depot prive au destinataire (action manuelle GitHub).

### M5 - Dette technique et ecran de lancement
- [ ] Ecran de lancement principal (avant la pre-run).
- [x] Tests unitaires sur la logique pure (grille, collisions, bornes, effets, meta) via Vitest.
- [x] Decoupage de `src/scenes/GameScene.ts` (rendu / HUD / store / input): 1440 -> 182 lignes.

## Risques a surveiller
- Z-order implicite: les objets de l'ecran de fin et le bouton sudoku n'ont pas de `depth`
  explicite, leur empilement depend de l'ordre de creation dans `GameScene.create()`.
- Absence de tests automatises: seul `npm run build` valide aujourd'hui.
- Scope creep des bonus avant stabilisation du coeur.

## Definition of done (version revue le 12/09/2026)
- Depot clonable et lancable en local en trois commandes documentees.
- Jouable sur desktop au clavier.
- Identite visuelle limace perceptible.
- Boucle principale stable (pas de blocage sur 10 parties).

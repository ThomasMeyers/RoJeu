# Plan d'implementation - Snake Surprise

## Vision
Creer un jeu web "snake detourne" autour d'une limace, fun et rapide a livrer, jouable sur telephone et ordinateur via une URL.

## Principes de scope
- Prioriser un MVP jouable en peu de sessions.
- Garder un hebergement statique (sans backend) pour limiter la maintenance.
- Ajouter les bonus uniquement si le coeur de gameplay est stable.

## Architecture cible (grosse maille)
- `src/game/`: logique de grille, collisions, score, etat de partie.
- `src/scenes/`: ecran accueil, scene gameplay, ecran game over.
- `src/render/`: sprites simples, effet de trainee de bave, feedback visuel.
- `src/input/`: clavier (desktop) + swipe tactile (mobile).
- `src/ui/`: HUD score, meilleur score local, boutons restart/play.

## Backlog ordonne

### M0 - Setup
- Initialiser projet TypeScript avec Vite + Phaser.
- Definir scripts `dev`, `build`, `preview`.
- Ajouter config lint/format minimale.

### M1 - MVP jouable
- Deplacement 4 directions sur grille.
- Spawn nourriture standard.
- Croissance de la limace et score.
- Collision mur/corps = game over.
- Restart immediat.

Critere de validation:
- Une partie complete est jouable du debut a la fin sur desktop.

### M2 - Mobile + style limace
- Ajout controles tactiles (swipe avec seuil anti-erreur).
- Rendu limace (palette, tete/corps).
- Effet "trainee de bave" (fade simple performant).
- UI responsive (portrait et paysage).

Critere de validation:
- Partie jouable sur telephone sans clavier.

### M3 - Bonus (si temps disponible)
- Palier 1: nourritures variees (score x1/x2/x3).
- Palier 2: bonus temporaires (ralenti, boost, shield court).
- Palier 3: mode variant (chrono ou obstacles).

Critere de validation:
- Les bonus sont lisibles visuellement et n'introduisent pas de bug bloquant.

### M4 - Publication
- Build production et test local.
- Deploy statique (Cloudflare Pages par defaut).
- Verification finale mobile/desktop via URL publique.

## Choix hebergement recommande
- Defaut: Cloudflare Pages (simple, gratuit, deploy git rapide).
- Alternatives: Netlify ou Vercel.

## Risques a surveiller
- Input swipe trop sensible sur mobile.
- Chute de perf si effet de bave trop couteux.
- Scope creep des bonus avant stabilisation du MVP.

## Definition of done (version surprise)
- URL publique partageable.
- Jouable mobile + desktop.
- Identite visuelle limace perceptible (dont trainee).
- Boucle principale stable (pas de blocage sur 10 parties).

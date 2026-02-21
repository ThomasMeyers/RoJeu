# Snake Project Agent Guide

## Scope
- Travailler uniquement dans `Personal Projects/Snake/` pour ce projet.
- Ne pas melanger les conventions Apps Script avec ce jeu web.

## Priorites
1. MVP jouable rapidement (desktop + mobile).
2. Lisibilite du code et iteration rapide.
3. Bonus uniquement apres stabilisation du gameplay de base.

## Conventions techniques
- Preferer TypeScript strict.
- Garder une architecture simple: scenes de jeu, logique de grille, rendering, input.
- Eviter la sur-ingenierie: pas de backend sur le MVP.

## UX et gameplay
- Controles clavier + tactile obligatoires.
- Difficulte progressive simple (vitesse croissante).
- Feedback visuel clair sur collisions, score et bonus actifs.

## Qualite
- Ajouter des tests unitaires cibles sur la logique de grille/collision si possible.
- Verifier le comportement sur ecran mobile avant publication.

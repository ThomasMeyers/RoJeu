# Snake Project Agent Guide

## Scope
- Travailler uniquement dans `Personal Projects/Snake/` pour ce projet.
- Ne pas melanger les conventions Apps Script avec ce jeu web.
- Garder ce fichier court: regles de collaboration uniquement.

## Agent quickstart docs
- Point d'entree: `START_HERE_FOR_AGENTS.md`
- Carte technique: `docs/architecture.md`
- Playbooks d'intervention: `docs/agent-playbooks.md`
- Guide creation talents + images: `docs/talent-art-guide.md`
- Maintenance documentaire: `docs/doc-maintenance.md`
- Decisions techniques: `docs/adr/`

## Priorites
1. MVP jouable rapidement (desktop + mobile).
2. Lisibilite du code et iteration rapide.
3. Bonus uniquement apres stabilisation du gameplay de base.

## Conventions techniques
- Preferer TypeScript strict.
- Garder une architecture simple: scenes de jeu, logique de grille, rendering, input.
- Eviter la sur-ingenierie: pas de backend sur le MVP.
- Les IDs techniques (`talent.id`, `effectId`, noms de stats/keys/events) doivent etre stables, descriptifs et decouples du wording UI.
- Le texte UI peut rester humoristique et evolutif; ne pas le reutiliser comme naming technique.
- Toute migration d'ID doit etre geree dans la normalisation du save (`metaState`) et documentee dans les docs agent/architecture.

## UX et gameplay
- Controles clavier + tactile obligatoires.
- Difficulte progressive simple (vitesse croissante).
- Feedback visuel clair sur collisions, score et bonus actifs.

## Qualite
- Ajouter des tests unitaires cibles sur la logique de grille/collision si possible.
- Verifier le comportement sur ecran mobile avant publication.

## Regle de mise a jour docs
- Si un changement modifie un flux, un module cle, ou un invariant gameplay/store, mettre a jour au minimum:
  - `START_HERE_FOR_AGENTS.md`
  - `docs/architecture.md` ou `docs/agent-playbooks.md` selon le type de changement

# Snake (surprise project)

Projet perso de mini-jeu web inspiré de Snake, avec une direction visuelle "limace + trainee de bave".

## Objectif
- Livrer un MVP jouable sur mobile et ordinateur via une URL publique.
- Garder une implementation simple a maintenir (pas de backend obligatoire pour le MVP).

## Stack cible (simple et robuste)
- Frontend: TypeScript + Vite + moteur 2D leger (Phaser).
- Plateforme: web responsive (orientation portrait/paysage).
- Hebergement: statique (Cloudflare Pages, Netlify ou Vercel).

## Lancement local (a implementer)
- Installer les dependances: `npm install`
- Demarrer en dev: `npm run dev`
- Build de prod: `npm run build`
- Preview locale: `npm run preview`

## Agent Quickstart
- Point d'entree rapide: `START_HERE_FOR_CLAUDE.md`
- Architecture technique: `docs/architecture.md`
- Workflows d'intervention: `docs/agent-playbooks.md`
- Journal des decisions: `docs/adr/`
- Checklist de maintenance: `docs/doc-maintenance.md`

## Plan grosse maille

### MVP
1. Boucle de jeu (grille, mouvement, collisions, game over).
2. Limace jouable (a la place du serpent) + score.
3. Effet visuel de trainee de bave.
4. Interface simple (ecran d'accueil, score courant, restart).
5. Controles clavier + tactile (swipe) pour mobile/desktop.

### Bonus par paliers
- Palier 1: nourritures differenciees (score variable, effet visuel simple).
- Palier 2: bonus temporaires (boost vitesse, ralenti, mini invincibilite).
- Palier 3: variantes fun (obstacles, mode chrono, skins).

### Hebergement recommande
- Option par defaut: deploy statique sur Cloudflare Pages (simple, rapide, gratuit pour ce besoin).
- Alternative equivalente: Netlify ou Vercel.

## Roadmap rapide
- Etape 1: scaffolding du projet + scene de base jouable.
- Etape 2: direction artistique minimale (limace + bave).
- Etape 3: paliers de bonus selon temps disponible.
- Etape 4: polish mobile + publication.

## Backlog
- Definir puis implementer l'ecran de lancement principal (avant la pre-run).
- Definir une procedure "safe push" pour separer compte perso/pro avant publication distante.

## UX pass (clean/minimal)
- Hierarchie visuelle des phases `waiting_start`, `running`, `ended` clarifiee.
- HUD compacte avec priorite lecture: points run/total, vies, temps restant.
- Ecran de fin retravaille: titre, sous-texte contextuel, stats, CTA lisibles.

## Store v1 (talents progressifs)
- Ouverture du store depuis l'ecran de fin via `Ameliorer la limace`.
- Layout en 2 lignes: 3 talents de base en ligne 1 + 1 talent centre en ligne 2.
- Le talent `around the world` (ID `no_walls`) est visible mais verrouille tant que les 3 talents de la ligne 1 ne sont pas maxes.
- Format carte: image placeholder + titre + `(niveau/max)` + cout du prochain niveau; en etat verrouille: carte grisee + `LOCK` + prerequis.
- Popup detail unique: header (image + titre), description, croix de fermeture, footer dynamique (achat ou prerequis de debloquage).
- Achat: depense des `totalPoints` persistants en `localStorage`.
- Au niveau max: talent conserve visible avec etat `MAX` et bouton d'upgrade bloque.
- Les effets gameplay sont appliques via `effectIdsByLevel` (score passif, multiplicateurs, spawn de pickups, suppression permanente des murs avec `no_walls`).

## Backlog UI futur
- Ecran principal de lancement avant la pre-run.
- Accessibilite de base: contraste renforce, option taille de texte, mode daltonien simple.

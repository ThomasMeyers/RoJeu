# Snake (surprise project)

Projet perso de mini-jeu web inspiré de Snake, avec une direction visuelle "limace + trainee de bave".

## Objectif
- Livrer un jeu jouable sur ordinateur, partage en clonant ce depot et en le lancant en local.
- Garder une implementation simple a maintenir (pas de backend, pas de deploiement).

## Perimetre (decide le 12/09/2026)
- Cible unique: desktop au clavier. Le support mobile / tactile est abandonne.
- Pas de publication ni d'URL publique: le partage se fait en donnant acces au depot prive,
  le destinataire lance le jeu en local.

## Stack
- Frontend: TypeScript + Vite + Phaser 3.
- Execution: serveur de dev Vite en local.

## Lancement local

Prerequis: Node.js 20+ (developpe sur Node 24) et npm.

1. Cloner le depot et se placer dans le dossier du projet.
2. Installer les dependances: `npm install`
3. Demarrer le jeu: `npm run dev`, puis ouvrir l'URL affichee dans le terminal
   (par defaut `http://localhost:5173`).

Autres commandes:
- Tests unitaires: `npm test` (ou `npm run test:watch`)
- Build de production: `npm run build`
- Texte de fin (reponses de la devinette + discours): editer `finale.local.json` (non versionne,
  format dans `finale.example.json`) puis `npm run encode-finale`
- Sauvegarde de test: `npm run dev-save` copie un snippet a coller dans la console du navigateur
  (`-- ending` pour une save avec la fin deja achetee, `-- reset` pour effacer)
- Preview du build: `npm run preview`

Controles clavier:
- Direction: fleches directionnelles, ou le bloc de touches WASD
  (soit **ZQSD** sur un clavier AZERTY: le binding se fait sur la position physique
  de la touche, pas sur la lettre imprimee)
- `R`: relancer un run
- `Espace`: pause / reprise pendant un run

## Agent Quickstart
- Point d'entree rapide: `START_HERE_FOR_AGENTS.md`
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
5. Controles clavier (desktop).

### Bonus par paliers
- Palier 1: nourritures differenciees (score variable, effet visuel simple).
- Palier 2: bonus temporaires (boost vitesse, ralenti, mini invincibilite).
- Palier 3: variantes fun (obstacles, mode chrono, skins).

## Backlog
- Definir puis implementer l'ecran de lancement principal (avant la pre-run).

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
- Accessibilite de base: contraste renforce, option taille de texte, mode daltonien simple.

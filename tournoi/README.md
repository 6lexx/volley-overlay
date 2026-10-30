# Tournoi RMV Indoor — mode opératoire

Tout le tournoi vit dans ce dossier `tournoi/`. Les fichiers de ton équipe
(`display.html`, `control.html`, `config.js`, `resultats.html`) ne sont pas touchés.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Site public : matchs, poules, arbre, classement final (QR code) |
| `orga.html` | Saisie des organisateurs : équipes, rotations, scores |
| `pilotage.html` | Ton écran : choix de l'écran affiché, match filmé, points, victoire, bandeau |
| `overlay.html` | **La seule source à mettre dans Streamlabs**, par-dessus la caméra |
| `scene.html` | Scènes sur la caméra assombrie : `?vue=poules`, `arbre`, `pause`, `intermatch`, `neutre` |
| `config.js` | Réglages du tournoi et **les 18 équipes** avec leur poule de brassage |
| `shared/moteur.js` | La logique : brassage, phase 2, arbre, classement 1 à 18 |
| `shared/firebase.js` | Connexion Firebase et mode démo |
| `shared/outils.js` | Petites fonctions communes |
| `shared/style.css` | La DA du tournoi |
| `shared/ecrans.js` | Le contenu des écrans : poules, arbre, classement, pause, inter-match, plateau |
| `shared/ecrans.css` | Leur mise en page |
| `shared/qrcode.js` | Bibliothèque QR code (MIT, Kazuhiko Arase) |
| `regles-firebase-a-ajouter.json` | Le bloc à ajouter aux règles Firebase |

---

## 0. Le déroulé du tournoi

1. **Brassage** : 3 poules de 6 (A, B, C), positions AA à CF. 15 matchs par poule
   dans l'ordre de la feuille (AA-AB, AC-AD, AE-AF, AA-AC…). Rotation 1 = matchs
   1-2-3 de la poule A sur les 3 terrains, rotation 2 = poule B, rotation 3 = poule C,
   rotation 4 = matchs 4-5-6 de la A… 15 rotations de 10 minutes.
2. **Phase 2** : poule **Or** (1ers et 2es), **Argent** (3es et 4es), **Bronze**
   (5es et 6es). Les trois 1ers prennent les positions A à C (classés entre eux),
   les trois 2es D à F. Même modèle : 15 matchs, 15 rotations.
3. **Phase finale**, en points avec 2 points d'écart :
   - têtes de série 1 à 6 = classement de la poule Or, 7 et 8 = 1er et 2e Argent ;
   - quarts 1-8, 4-5, 2-7, 3-6 ; demies ; places 1-2 (finale **25 pts**), 3-4, 5-6, 7-8 ;
   - places 9-10 et 11-12 (Argent 3e-4e, 5e-6e), 13-14, 15-16, 17-18 (Bronze) ;
   - tout en **21 pts** sauf la finale ; 7 rotations selon la grille des 3 terrains.

**Égalité au coup de sifflet en poule** : on joue un dernier point. L'orga tape
le score final, ou tape l'égalité et choisit qui a gagné le dernier point.

**Classement d'une poule** : 1. victoires, 2. confrontation directe entre les
équipes à égalité, 3. différence de points, 4. points marqués.

---

## 1. Tester sans Firebase (mode démo)

Le mode démo garde tout dans ton navigateur, rien ne part sur internet.
Les onglets d'un **même navigateur** se synchronisent entre eux.

1. Ouvre ces onglets dans le même navigateur :
   - `…/tournoi/orga.html?demo=1`
   - `…/tournoi/pilotage.html?demo=1`
   - `…/tournoi/overlay.html?demo=1&apercu=1` (`apercu=1` met un faux fond de gymnase)
   - `…/tournoi/index.html?demo=1`
2. Dans **orga** : « Charger les 18 équipes ». Touche deux équipes pour les
   échanger si besoin, puis « Générer le brassage ».
3. « Lancer la rotation », puis **« Simulation : scores au hasard »** et
   « Valider la rotation ». Recommence pour aller vite.
4. À la fin du brassage : orga affiche le classement et la composition Or /
   Argent / Bronze › « Générer la phase 2 ». Idem à la fin de la phase 2 avec
   les têtes de série › « Générer la phase finale ».
5. Dans **pilotage**, change d'écran (Match, Poules, Arbre, Classement…) et
   regarde l'overlay suivre.

Pour refaire une simulation : orga › Zone sensible › **« Recommencer (garder les
équipes) »**. Pas besoin de recharger les équipes.

**Simulation en vrai Firebase** : ajoute `&t=test` à tous les liens (orga,
pilotage, overlay, site) et crée les clés `tournoi_test_orga` et
`tournoi_test_stream` dans `secrets`. Le bouton « scores au hasard » y apparaît
aussi. Le vrai tournoi (`rmv-indoor-2026`) n'est pas touché.

**Serveur local** (si tu ne veux pas pousser sur GitHub) : dans le dossier du dépôt,
`python -m http.server 8000`, puis `http://localhost:8000/tournoi/orga.html?demo=1`.

---

## 2. Mise en place dans Firebase (une seule fois)

Même projet que ton overlay : `volley-overlay-59f09`.
L'authentification anonyme est déjà activée.

### a) Ajouter les règles

1. Console Firebase › Realtime Database › **Règles**.
2. Ouvre `regles-firebase-a-ajouter.json`. Copie les blocs `"tournoiAcces"` et
   `"tournois"`, et colle-les dans tes règles **au même niveau** que `"secrets"`,
   `"controllers"` et `"matches"` (pense à la virgule après le bloc précédent).
3. Ne colle pas la ligne `_lisezmoi`. Ne supprime rien d'existant.
4. **Publier**. La console refuse les erreurs de syntaxe : si elle râle, c'est
   presque toujours une virgule.

Le résultat ressemble à ça :

```
{
  "rules": {
    ".read": false,
    ".write": false,
    "secrets": { … },
    "controllers": { … },
    "matches": { … },
    "tournoiAcces": { … },
    "tournois": { … }
  }
}
```

### b) Créer les deux clés

Console › Realtime Database › **Données**. Dans le nœud `secrets` (celui de ton
équipe, qui existe déjà), ajoute deux enfants :

| Nom | Valeur |
|---|---|
| `tournoi_rmv-indoor-2026_orga` | une clé longue, ex. `orga-7Hq2mP9x` |
| `tournoi_rmv-indoor-2026_stream` | une autre clé, ex. `live-K4wz81Ra` |

`rmv-indoor-2026` doit être identique au `id` de `tournoi/config.js`.
Pour un autre tournoi plus tard : change `id`, et crée deux nouvelles clés.

### c) Tes liens

| Lien | Pour qui |
|---|---|
| `https://6lexx.github.io/volley-overlay/tournoi/` | Tout le monde (QR code) |
| `…/tournoi/orga.html?key=CLÉ_ORGA` | Les organisateurs |
| `…/tournoi/pilotage.html?key=CLÉ_STREAM` | Toi / ton co-commentateur |
| `…/tournoi/overlay.html` | Streamlabs, scène « Match » |
| `…/tournoi/scene.html?vue=poules` | Streamlabs, scène « Poules » |
| `…/tournoi/scene.html?vue=arbre` | Streamlabs, scène « Arbre » |
| `…/tournoi/scene.html?vue=pause` | Streamlabs, scène « Pause » |
| `…/tournoi/scene.html?vue=intermatch` | Streamlabs, scène « Inter-match » |
| `…/tournoi/scene.html?vue=neutre` | Streamlabs, scène « Plateau » (pour vous filmer) |

Garde les liens avec clé hors du dépôt (notes du téléphone, message privé).

### d) Vérifier que tout marche

1. Ouvre `orga.html?key=…` : le point en haut à droite passe au **vert**.
   Si tu vois « Clé refusée », la clé du lien ne correspond pas à celle de `secrets`.
2. « Charger les 18 équipes » : elles apparaissent dans `index.html` (onglet Poules) sur ton téléphone.
3. Ouvre `pilotage.html?key=CLÉ_STREAM` : point vert aussi.
4. Ouvre `orga.html?key=CLÉ_STREAM` (la mauvaise clé) : ça doit être refusé.
5. Zone sensible › « Tout effacer » pour repartir propre.

---

## 3. Streamlabs

**Une seule scène suffit** : la caméra, et par-dessus une source navigateur
`overlay.html` en **1920 × 1080**. Tout le reste se pilote depuis la tablette,
dans `pilotage.html` :

| Bouton du pilotage | Ce qui s'affiche sur la caméra |
|---|---|
| Match | Score et chrono du match filmé, victoire 20 s à la fin |
| Inter-match | Résultats de la dernière rotation + matchs à suivre |
| Poules | Classement des poules (brassage, puis Or / Argent / Bronze) |
| Arbre | Quarts, demies, finale et places 3-4 |
| Classement | Matchs de classement et classement final de 1 à 18 |
| Pause | Pause, matchs à suivre, QR code |
| *(rien d'affiché)* | Plateau neutre : logo, heure et date, QR code, chaîne |

Toucher un écran affiché le **retire** et revient au plateau neutre.
Les bandeaux Interview / Balade s'affichent sur Match et sur le plateau.

Les écrans Inter-match, Poules, Arbre et Pause posent un **voile sombre** sur la
caméra : on voit encore le gymnase derrière les cartes. Pour régler
l'assombrissement : `overlay.html?voile=0.5` (plus clair) ou `?voile=0.8`
(plus sombre) ; 0.66 par défaut. Pour masquer la signature en bas à droite
pendant les matchs : `?tag=0`.

`scene.html?vue=poules` (ou `arbre`, `pause`, `intermatch`, `neutre`) existe
toujours si tu veux un écran fixe dans une scène Streamlabs à part.

**Après une mise à jour sur GitHub** : dans le pilotage, « Recharger l'overlay »
(deux appuis). L'overlay du stream, l'aperçu et le pilotage se rechargent avec la
dernière version, sans toucher à Streamlabs. Compte une seconde de coupure à
l'écran, et attends 1 à 2 minutes après le push que GitHub Pages ait publié.

**Aperçu** : en haut du pilotage, « Afficher » montre en petit ce que voit le
stream (avec un faux fond à la place de la caméra). Sur une tablette, il reste
collé en haut quand tu descends vers les points. « Masquer » le coupe pour
économiser batterie et data ; le choix est retenu sur l'appareil.

---

## 4. Le jour J

**Avant** : orga › « Charger les 18 équipes » › vérifier / échanger › « Générer le brassage ».
En cas de désistement : orga › Équipes › Renommer (l'équipe remplaçante garde la place).

**À chaque rotation** :
1. Orga : « Lancer la rotation » au coup de sifflet. Le chrono part partout.
2. Toi : choisis le match filmé dans pilotage et compte les points.
3. Fin du match : toi, « Terminer le match » ; les orgas tapent les autres scores,
   puis « Valider la rotation ».

**Fin du brassage** : « Générer la phase 2 ». **Fin de la phase 2** : « Générer la
phase finale ». Ensuite, gagnants et perdants avancent tout seuls dans l'arbre et
les matchs de classement.

**Phase finale en points** : pas de chrono, l'overlay affiche « 21 PTS » (ou
« 25 PTS » en finale). Dans pilotage, un message te prévient quand une équipe a
gagné. Dans orga, un score qui ne respecte pas la règle est refusé.

**Une erreur ?** orga › Corriger un résultat. Le classement et l'arbre se
recalculent. Un match de brassage ne se corrige plus une fois la phase 2 générée
(idem phase 2 → phase finale) : annule d'abord la phase suivante dans la Zone
sensible, tant qu'aucune de ses rotations n'est lancée.

**Faux départ ?** « Relancer le chrono à zéro » (deux appuis).

---

## Comment ça marche

- Tout est rangé dans Firebase sous `tournois/{id}/` : `equipes`, `rotations`,
  `matchs`, `live`. Rien ne se mélange avec `matches/` de ton équipe.
- Le classement n'est jamais enregistré : chaque écran le recalcule depuis les matchs.
- Le chrono non plus : on enregistre l'heure de lancement, chaque écran calcule
  le temps restant à partir de l'heure du serveur Firebase.
- Deux clés : les orgas ne peuvent pas toucher à l'overlay, et l'écran de
  pilotage ne peut modifier que le score proposé de son match (`saisieStream`).
- Aucun match nul : en cas d'égalité, l'orga indique qui a gagné le dernier point.
- La composition des poules de phase 2 et l'arbre sont enregistrés dans les
  matchs au moment où l'orga les génère.

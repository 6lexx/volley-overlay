# Tournoi RMV Indoor — mode opératoire

Tout le tournoi vit dans ce dossier `tournoi/`. Les fichiers de ton équipe
(`display.html`, `control.html`, `config.js`, `resultats.html`) ne sont pas touchés.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Site public : matchs, poules, arbre (QR code) |
| `orga.html` | Saisie des organisateurs : équipes, rotations, scores |
| `pilotage.html` | Ton écran : match filmé, points, victoire, bandeau |
| `overlay.html` | Source navigateur par-dessus la caméra |
| `scene.html` | Scènes plein écran : `?vue=poules`, `?vue=arbre`, `?vue=pause` |
| `config.js` | Réglages du tournoi (nom, format, durées, terrains) |
| `shared/moteur.js` | La logique : planning, classements, arbre |
| `shared/firebase.js` | Connexion Firebase et mode démo |
| `shared/outils.js` | Petites fonctions communes |
| `shared/style.css` | La DA du tournoi |
| `shared/qrcode.js` | Bibliothèque QR code (MIT, Kazuhiko Arase) |
| `regles-firebase-a-ajouter.json` | Le bloc à ajouter aux règles Firebase |

---

## 1. Tester sans Firebase (mode démo)

Le mode démo garde tout dans ton navigateur, rien ne part sur internet.
Les onglets d'un **même navigateur** se synchronisent entre eux.

1. Pousse le dossier `tournoi/` sur GitHub (ou lance un petit serveur local,
   voir plus bas : les pages ne marchent pas en double-cliquant sur le fichier).
2. Ouvre ces 4 onglets dans le même navigateur :
   - `…/tournoi/orga.html?demo=1`
   - `…/tournoi/pilotage.html?demo=1`
   - `…/tournoi/overlay.html?demo=1&apercu=1` (`apercu=1` met un fond gris)
   - `…/tournoi/index.html?demo=1`
3. Dans **orga** : « Remplir avec 16 équipes de démo », puis « Générer le planning »,
   puis « Lancer la rotation 1 ».
4. Dans **pilotage** : touche un match, ajoute des points. L'overlay et le site
   suivent. « Terminer le match » (deux appuis) : la victoire s'affiche 20 s, et le
   score apparaît dans orga avec « Rempli par le stream ».
5. Dans **orga** : tape les scores des autres matchs, « Valider la rotation »,
   lance la suivante… À la fin des poules : « Générer la phase finale ».
6. Ouvre aussi `scene.html?demo=1&vue=poules`, `&vue=arbre` et `&vue=pause`.

Pour repartir de zéro en démo : orga › Zone sensible › Tout effacer.

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

Garde les liens avec clé hors du dépôt (notes du téléphone, message privé).

### d) Vérifier que tout marche

1. Ouvre `orga.html?key=…` : le point en haut à droite passe au **vert**.
   Si tu vois « Clé refusée », la clé du lien ne correspond pas à celle de `secrets`.
2. Ajoute une équipe test : elle apparaît dans `index.html` sur ton téléphone.
3. Ouvre `pilotage.html?key=CLÉ_STREAM` : point vert aussi.
4. Ouvre `orga.html?key=CLÉ_STREAM` (la mauvaise clé) : ça doit être refusé.
5. Supprime l'équipe test.

---

## 3. Streamlabs

Pour chaque source navigateur : largeur **1920**, hauteur **1080**.

| Scène | Sources |
|---|---|
| Match | Caméra + `overlay.html` |
| Poules | `scene.html?vue=poules` |
| Arbre | `scene.html?vue=arbre` |
| Pause | `scene.html?vue=pause` |

L'overlay gère tout seul le score, la victoire et le bandeau interview/balade
(pilotés depuis `pilotage.html`). Pour masquer la signature en bas à droite :
`overlay.html?tag=0`.

Si une page ne se met pas à jour après un changement sur GitHub, ajoute `&v=2`
(ou `?v=2`) à la fin de l'URL pour éviter l'ancienne version en cache.

---

## 4. Le jour J

**Avant** : orga › ajouter les équipes et leur poule › Générer le planning.
Vérifie `terrains`, `dureeRotationMin` et `qualifiesParPoule` dans `config.js`
**avant** de générer.

**À chaque rotation** :
1. Orga : « Lancer la rotation » au coup de sifflet. Le chrono part partout.
2. Toi : choisis le match filmé dans pilotage et compte les points.
3. Fin du chrono : toi, « Terminer le match » ; les orgas tapent les autres scores,
   puis « Valider la rotation ».

**Fin des poules** : orga affiche le classement › « Générer la phase finale ».
Le gagnant de chaque match avance tout seul dans l'arbre.

**Une erreur ?** orga › Corriger un résultat. Le classement et l'arbre se
recalculent. En phase finale, on ne peut plus changer le gagnant si le match
suivant a déjà commencé.

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
- En cas d'égalité : en poule, match nul (ou point en or, réglable dans
  `config.js`) ; en phase finale, l'orga choisit le gagnant du point en or.

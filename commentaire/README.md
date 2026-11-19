# Kit de commentaire volley — mode opératoire

Tout le kit vit dans ce dossier `commentaire/`. L'outil de ton équipe (racine du dépôt)
et le tournoi (`tournoi/`) ne sont pas touchés.

## Les pages

| Page | Appareil | Rôle |
|---|---|---|
| `preparation.html?key=CLÉ` | PC ou tablette | Import des réponses du formulaire, fiches d'équipe, matchs, composition, mise en direct |
| `controle.html?key=CLÉ` | Tablette (paysage) ou téléphone | Points, Annuler, service, habillages, antisèche, effectifs, notes, chat Twitch, aperçu |
| `overlay.html` | Streamlabs | **La seule source à ajouter**, transparente, en 1920 × 1080 |
| `visuels.html?key=CLÉ&m=…` | Téléphone ou PC | Visuels Instagram du match (annonce, résultat), ouverts depuis la Préparation |
| `resultats.html` | Public (lien partagé) | Résultats et replays de tous les clubs commentés, filtrables par club |

Les fiches d'équipe (noms des joueurs, anecdotes, droit à l'image) sont dans une partie de
Firebase **lisible seulement avec la clé**. L'overlay et la page des résultats ne lisent que
ce qui passe déjà à l'écran (noms et couleurs des équipes, effectif du jour, scores).
Ne mets jamais de vraies fiches ni la clé dans ce dépôt : il est public.

---

## 1. Tester sans Firebase (mode démo)

Ouvre ces trois onglets dans le **même navigateur** :

- `…/commentaire/preparation.html?demo=1`
- `…/commentaire/controle.html?demo=1`
- `…/commentaire/overlay.html?demo=1&apercu=1` (`apercu=1` met un faux fond de gymnase)

Dans la Préparation : « Charger deux équipes d'exemple », crée un match, « Mettre en direct ».
Joue ensuite avec le contrôle et regarde l'overlay suivre.

Serveur local : dans le dossier du dépôt, `python -m http.server 8000`,
puis `http://localhost:8000/commentaire/preparation.html?demo=1`.

---

## 2. Mise en place dans Firebase (une seule fois)

Même projet que l'overlay et le tournoi : `volley-overlay-59f09`.

### a) Ajouter les règles

1. Console Firebase › Realtime Database › **Règles**.
2. Ouvre `regles-firebase-a-ajouter.json`. Copie les blocs `"commentaireAcces"` et
   `"commentaire"` (avec `prive`, `live` et `resultats`), et colle-les **au même niveau** que `"secrets"`, `"matches"`,
   `"tournoiAcces"` et `"tournois"` (virgule après le bloc précédent).
3. Ne colle pas la ligne `_lisezmoi`. Ne supprime rien d'existant. **Publier**.

### b) Créer la clé

Console › Realtime Database › **Données** › nœud `secrets` › ajoute un enfant :

| Nom | Valeur |
|---|---|
| `commentaire_regie` | une clé longue, ex. `regie-8Tq3mZ7w` |

### c) Tes liens (garde ceux avec la clé hors du dépôt)

| Lien | Pour |
|---|---|
| `https://6lexx.github.io/volley-overlay/commentaire/preparation.html?key=CLÉ` | Toi, avant le match |
| `https://6lexx.github.io/volley-overlay/commentaire/controle.html?key=CLÉ` | Ta tablette pendant le match |
| `https://6lexx.github.io/volley-overlay/commentaire/overlay.html` | Streamlabs |
| `https://6lexx.github.io/volley-overlay/commentaire/resultats.html` | Les clubs (sans clé ; `?club=Ramonville` pour arriver filtré) |

Vérification : ouvre la Préparation avec la clé, le point en haut à droite passe au **vert**.
« Clé refusée » = la clé du lien ne correspond pas à `secrets/commentaire_regie`.

---

## 3. Avant le match : les fiches

1. Dans le Google Sheet des réponses, sélectionne la **ligne d'en-tête** et les lignes à
   importer, copie, colle dans « Importer les réponses du formulaire », puis **Lire**.
   (Ou Fichier › Télécharger › CSV, puis « Choisir un fichier CSV ».)
2. **Vérifier et enregistrer** sur chaque réponse. À contrôler dans la fiche :
   - **Nom affiché** (sur l'affiche, les cartes, la victoire) et **abréviation** (3-4 lettres, sur le score) ;
   - **Couleur** : devinée d'après le mot du formulaire, à corriger avec le sélecteur ;
   - **Joueurs** : prénom / nom devinés d'après les majuscules, poste, C (capitaine), L (libéro) ;
   - **Flocages** : repris des anecdotes (« Jules n°14 N.FERRAILLE ») ; la case
     « Montrer les flocages » les affiche dans l'effectif à l'écran ;
   - **Logo** : chemin d'une image du dépôt (facultatif, sinon l'abréviation dans un rond).
   - **Club à l'honneur** : présentation, entraînements, recrutement, Instagram, site. Rempli à la
     main (le formulaire ne le demande pas) ; gardé quand tu réimportes la réponse.
3. Une réponse déjà importée est reconnue (« déjà importée ») : la réimporter remplace la fiche.
4. Adversaire sans formulaire : « + Équipe à la main » (nom, abréviation, couleur suffisent).

## 4. Le match

1. **Créer un match** : équipe A (à gauche sur le score), équipe B, club suivi, compétition
   (s'affiche sur le score), date, heure, salle, format.
2. **Composition du match** : par défaut toute l'équipe est cochée ; décoche les absents.
   « Tout le monde » remet toute l'équipe. Si le match est déjà en direct, l'overlay suit tout de suite.
3. **Mettre en direct**. Une modification de fiche après coup ? « Mettre à jour l'overlay »
   (le score ne bouge pas).

Dans Streamlabs : une source navigateur `overlay.html`, **plein écran en 1920 × 1080**, par-dessus la caméra.

## 5. Pendant le match (contrôle)

- **Gros boutons** : un appui = un point. Un deuxième appui en moins de 0,4 s est ignoré (anti double appui).
- **Annuler** : retire le dernier point (et la victoire ou le volet de fin de set s'il venait de partir).
- **Changer le service** : le ballon passe à l'autre équipe. À faire **avant le 1er point**
  selon le tirage au sort. Ensuite le service suit tout seul (l'équipe qui marque sert ;
  au set suivant, l'équipe qui n'a pas servi en premier).
- Automatique : fin de set (volet « Fin du set » 20 s), tie-break, rappel « Changement de côté »
  à 8 points au tie-break, fin du match (bandeau Victoire, reste jusqu'à ce que tu le retires),
  résultat enregistré dans le match.
- **Habillages** : Affiche (échauffement, caméra assombrie), Effectif (toute l'équipe d'un coup,
  triée par poste, caméra assombrie), Club à l'honneur (club suivi, en bas à gauche), Récap des
  sets (reste affiché), Victoire, Tout retirer. Affiche, effectif, club à l'honneur et récap se
  retirent tout seuls au point suivant.
- **Temps mort** (un bouton par équipe) : bandeau sous le score avec un compte à rebours de 30 s,
  retiré au point suivant. 2 par équipe et par set ; appuyer sur le temps mort en cours l'annule.
  L'antisèche rappelle que c'est le bon moment pour le club à l'honneur.
- **Bandeau série** : s'affiche tout seul sous le score à partir de 5 points d'affilée, 8 s après
  chaque point. Le bouton le coupe ou le remet.
- **Overlay visible / MASQUÉ** : coupe tout l'overlay d'un coup.
- **Antisèche** : balle de set / de match, série en cours, plus gros écart, rappel du tie-break.
- Panneau de droite : **Effectifs** (touche un joueur pour l'ajouter ou le retirer de la compo :
  l'effectif à l'écran suit tout de suite ; flocages), **Notes** (coach, anecdotes,
  droit à l'image), **Chat** Twitch, **Aperçu** de l'overlay et « Recharger l'overlay ».
- La page garde l'écran de la tablette allumé.

## 6. Après le match

- Le résultat part tout seul sur la page publique `resultats.html` (scores, sets, date, salle).
  Annuler le dernier point l'en retire. Supprimer le match dans la Préparation aussi.
- **Lien du replay** : dans la Préparation, sous le match, colle le lien YouTube, puis **OK**.
  Il apparaît sur la page des résultats. Si une équipe a refusé le replay dans le formulaire,
  le champ est remplacé par un rappel. Si elle a choisi « non répertorié », mets la vidéo en
  « non répertoriée » sur YouTube (la page des résultats n'est pas référencée).
- **Visuels Instagram** (bouton sous le match) : Annonce (avant le match) et Résultat (débloqué à
  la fin), en Story 9:16 ou Post 4:5. **Partager** ouvre le partage du téléphone, **Enregistrer
  l'image** la télécharge. Un texte de publication est proposé, avec les comptes Instagram des clubs.

## 7. Réglages (`config.js`)

`formats` (3 sets gagnants, 2 sets, set unique en 21 ou 25), durées d'affichage
(`recapSetSec`, `coteSec`, `tempsMortSec`, `serieMin`, `serieSec`) et la chaîne Twitch.

Les polices (Barlow, licence OFL) sont dans `assets/fonts/` : rien à charger depuis Google en 4G.

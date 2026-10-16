# Overlay score volley — Ramonville Volley (RMV)

Overlay de score pour les streams Twitch des matchs de RMV, piloté depuis un téléphone au bord du terrain.
Hébergé sur GitHub Pages, synchronisé en direct par Firebase.

- **L'overlay** (`display.html`) s'ajoute dans Streamlabs. Il affiche le score et les animations, en lecture seule.
- **L'appli de contrôle** (`control.html`) s'ouvre sur le téléphone de la personne qui tient le score.

---

## Les liens

| Page | Lien |
|---|---|
| Overlay (Streamlabs) | https://6lexx.github.io/volley-overlay/display.html?m=volley-silex |
| Appli de contrôle | `https://6lexx.github.io/volley-overlay/control.html?m=volley-silex&k=CLÉ` |
| Démo (sans Firebase) | https://6lexx.github.io/volley-overlay/display.html?demo=1 |
| Démo de l'échauffement | https://6lexx.github.io/volley-overlay/display.html?demo=1&scene=warmup |

> ⚠️ **Ne jamais écrire la clé de contrôle (`k=…`) dans ce dépôt.** Il est public : n'importe qui pourrait piloter le score.
> Garde le lien complet de l'appli dans tes notes privées et envoie-le directement à la personne qui tient le score.

---

## Mise en place dans Streamlabs

1. Ajoute un calque de type **URL / source navigateur** avec le lien de l'overlay.
2. Mets-le **en plein écran, en 1920×1080**. L'overlay est transparent : seuls le score et les animations s'affichent.
3. Si une modification ne s'affiche pas, ajoute `&v=8` à la fin de l'URL, puis `&v=9` la fois suivante, etc. GitHub garde l'ancienne version en cache environ 10 minutes.

---

## Déroulé d'un match

### Avant le match
1. **Nouveau match** : saisis le **nom complet** de l'adversaire, son abréviation et sa couleur. Le nom complet s'affiche dans l'échauffement et à la fin des sets.
2. **Joueurs présents** : coche les joueurs du jour. La liste est gardée d'un match à l'autre.
3. **Événements à l'écran → Échauffement → Afficher** : le bloc d'affiche et les cartes joueurs apparaissent et défilent en fondu.
   Le bouton devient **Retirer**. L'échauffement se retire aussi tout seul au **premier point**.

### Pendant le match
- **+1** sous l'équipe qui marque.
- **Ace** (dans Événements) : choisis l'équipe. L'ace est compté dans le match et lance une animation :
  - pour RMV, au hasard, le **chant** (« ACE ! ACE ! clap clap » ×3) ou la **frappe** ;
  - pour l'adversaire, une **pastille** sobre.
- **Annuler** corrige la dernière action (point, ace, set) et coupe l'animation en cours.
- **Overlay visible / masqué** cache tout l'overlay. Ça sert aussi à couper une animation.

### Fin de set
- Dès que le set est gagné (25 points, 15 au tie-break, 2 points d'écart), **le volet se lance tout seul**. Il montre le score du set, les noms complets et les losanges de sets, et le losange du set gagné se remplit.
- Appuie ensuite sur **Valider le set** pour passer au set suivant.
- **Victoire du set** (dans Événements) rejoue le volet du dernier set.

### Fin du match
- Au dernier set gagné, **les bandeaux de victoire** partent tout seuls à la place du volet et restent 2 min 30. Le score revient ensuite avec le résultat final en sets.
- **Victoire du match** (dans Événements) les relance.

---

## Paramètres d'URL de l'overlay

À ajouter à la fin du lien de l'overlay, chacun précédé de `&`. Exemple : `display.html?m=volley-silex&pos=bl&scale=1.2`

| Paramètre | Valeurs | Effet |
|---|---|---|
| `m` | `volley-silex` | Identifiant du match. **Obligatoire**, sauf en démo. |
| `pos` | `br` (défaut), `bl`, `tr`, `tl` | Coin du score : bas droite, bas gauche, haut droite, haut gauche. L'horloge se met dans le coin bas opposé. |
| `scale` | `1` (défaut), `1.2`… | Taille de tout l'overlay. Monte à `1.2` si c'est trop petit sur téléphone. |
| `clock` | `0` | Masque l'horloge. |
| `victoire` | `150` (défaut) | Durée des bandeaux de victoire, en secondes. |
| `tempo` | `400` (défaut) | Durée d'un temps du chant de l'ace, en millisecondes. Plus petit = plus rapide. |
| `rotation` | `7` (défaut) | Échauffement : secondes avant de passer aux joueurs suivants. |
| `demo` | `1` | Faux match animé, sans Firebase, pour tester le rendu. |
| `scene` | `warmup` | Avec `demo=1` : affiche l'échauffement. |
| `debug` | `1` | Affiche l'état de la connexion. Jamais en live. |
| `v` | `8`, `9`… | Force le rechargement après une mise à jour (cache). |

## Paramètres d'URL de l'appli de contrôle

| Paramètre | Effet |
|---|---|
| `m` | Identifiant du match, le même que l'overlay : `volley-silex`. |
| `k` | Clé de contrôle secrète. **Ne jamais la publier.** |

---

## Modifier les réglages : `config.js`

Tout se règle dans `config.js`, sans toucher au reste du code.

- **`rules`** : format du match (3 sets gagnants, 25 points, tie-break en 15, 2 points d'écart). Un changement compte à partir du prochain « Nouveau match ».
- **`home`** : RMV (nom, abréviation, couleur, logo `assets/ramonville.png`).
- **`awayDefault`** : adversaire proposé par défaut. On le change à chaque match dans l'appli.
- **`roster`** : les 11 joueurs de l'échauffement.
  - `number` : numéro de maillot, **unique** (il sert à cocher les présents).
  - `name` : prénom et nom, ou surnom.
  - `position` : Passeur, Pointu, Réceptionneur-attaquant, Central ou Libéro.
  - `punchline` : une phrase courte, 50 caractères maximum conseillé.
  - `photo` : `null` affiche la silhouette grise. Pour une photo, mets un PNG **détouré** (fond transparent), par exemple `"assets/joueurs/7.png"`.

Après une modification de `config.js`, recharge l'overlay et l'appli (avec `&v=…` si besoin).

---

## En cas de problème

| Symptôme | À vérifier |
|---|---|
| Rien ne s'affiche sur le stream | Le lien contient bien `m=volley-silex` ? L'overlay n'est pas masqué dans l'appli ? |
| Une modification n'apparaît pas | Ajoute ou change `&v=…` dans l'URL (cache GitHub). |
| L'appli affiche « Clé invalide » | Le paramètre `k` du lien est faux ou incomplet. |
| Le logo ne s'affiche pas | Le chemin `logo` de `config.js` doit correspondre exactement au fichier, majuscules comprises. |
| Une animation reste bloquée | « Overlay masqué » puis « visible » la coupe. |

## Fichiers du dépôt

| Fichier | Rôle |
|---|---|
| `display.html` | L'overlay du stream |
| `control.html` | L'appli de contrôle |
| `config.js` | Les réglages (règles, équipes, joueurs) |
| `assets/ramonville.png` | Le logo du club |

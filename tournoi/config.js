// =============================================================
//  tournoi/config.js — Réglages du tournoi
//  Indépendant du config.js de ton équipe (à la racine du dépôt).
//  ⚠ Ne JAMAIS mettre les clés (orga / stream) ici : le dépôt est public.
// =============================================================
window.TOURNOI_CONFIG = {

  // Identifiant du tournoi dans Firebase : lettres, chiffres et tirets.
  // Change-le pour un nouveau tournoi, l'ancien reste archivé.
  id: "rmv-indoor-2026",

  nom:   "Tournoi RMV Indoor",
  sousTitre: "4×4",
  date:  "11/11/2026",
  lieu:  "Gymnase de Ramonville",
  twitch: "twitch.tv/silex62",
  logo:  "../assets/ramonville.png",   // logo du club, déjà dans le dépôt

  // Adresse du site public (sert au QR code de la scène pause)
  siteUrl: "https://6lexx.github.io/volley-overlay/tournoi/",

  // Même projet Firebase que l'overlay de ton équipe
  firebase: {
    apiKey:      "AIzaSyDIcfrcXxCxHwl9GA0v6jr7avvJTEn5gqM",
    authDomain:  "volley-overlay-59f09.firebaseapp.com",
    databaseURL: "https://volley-overlay-59f09-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:   "volley-overlay-59f09",
    appId:       "1:490432783373:web:a358da2d36195d42846144"
  },

  format: {
    terrains:          3,    // matchs joués en même temps (sert au planning, jamais affiché)
    dureeRotationMin: 20,    // durée d'un match de poule, en minutes
    qualifiesParPoule: 3,    // 2 poules × 3 qualifiés = demies + finale

    // Phase finale : les derniers tours se jouent en points, pas au temps.
    // 2 = demies + finale ; 1 = finale seule ; 0 = tout au temps
    toursEnPoints: 2,
    pointsCible:  25,        // premier à 25…
    ecartMin:      2,        // …avec 2 points d'écart (mettre 1 pour un 25 sec)
    dureeFinaleMin: 20,      // durée des tours de phase finale qui restent au temps (ex. quarts)

    points: { victoire: 3, nul: 1, defaite: 0 },
    // "nul"         : une égalité en poule reste un match nul
    // "point-en-or" : en cas d'égalité, l'orga choisit le gagnant du point en or
    // (en phase finale, il faut toujours un gagnant)
    egalitePoules: "nul"
  },

  affichage: {
    maxNom:       15,   // caractères avant "..." sur l'overlay
    victoireSec:  20    // durée du bandeau victoire
  }
};

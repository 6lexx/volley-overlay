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
  date:  "[DATE]",
  lieu:  "Gymnase de Ramonville",
  twitch: "twitch.tv/silex62",

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
    terrains:          2,    // matchs joués en même temps (sert au planning, jamais affiché)
    dureeRotationMin: 12,    // durée d'un match de poule, en minutes
    dureeFinaleMin:   12,    // durée d'un match de phase finale
    qualifiesParPoule: 2,
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

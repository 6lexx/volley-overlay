// =============================================================
//  commentaire/config.js — Réglages du kit de commentaire
//  Indépendant de l'outil RMV (racine) et du tournoi (tournoi/).
//  ⚠ Ne JAMAIS mettre la clé de régie ici : le dépôt est public.
//  ⚠ Ne JAMAIS mettre de vraies fiches d'équipe ici : elles vivent
//    dans Firebase, dans une partie lisible seulement avec la clé.
// =============================================================
window.COMMENTAIRE_CONFIG = {

  twitch: "silex62",

  // Même projet Firebase que l'overlay RMV et le tournoi
  firebase: {
    apiKey:      "AIzaSyDIcfrcXxCxHwl9GA0v6jr7avvJTEn5gqM",
    authDomain:  "volley-overlay-59f09.firebaseapp.com",
    databaseURL: "https://volley-overlay-59f09-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:   "volley-overlay-59f09",
    appId:       "1:490432783373:web:a358da2d36195d42846144"
  },

  // Formats proposés à la création d'un match
  formats: {
    "3sets":  { nom: "3 sets gagnants · 25 pts · tie-break en 15", setsGagnants: 3, points: 25, tieBreak: 15, ecart: 2 },
    "2sets":  { nom: "2 sets gagnants · 25 pts · tie-break en 15", setsGagnants: 2, points: 25, tieBreak: 15, ecart: 2 },
    "unique25": { nom: "Set unique en 25",                         setsGagnants: 1, points: 25, tieBreak: 25, ecart: 2 },
    "unique21": { nom: "Set unique en 21",                         setsGagnants: 1, points: 21, tieBreak: 21, ecart: 2 }
  },

  // Bandeau commentateur (bouton « Commentateur » du contrôle, entre les sets)
  commentateur: {
    titre:     "Au micro",
    prenom:    "Matthys",
    instagram: "@matthys62245",
    reseaux: [                         // défilent à droite du prénom
      { type: "twitch",  texte: "silex62", legende: "En direct sur Twitch" },
      { type: "youtube", texte: "@6silex", legende: "Replays sur YouTube" }
    ],
    rotationSec: 8
  },

  affichage: {
    recapSetSec:     20,   // volet de fin de set, lancé tout seul
    coteSec:         12,   // rappel « changement de côté » au tie-break
    tempsMortSec:    30,   // durée d'un temps mort
    serieMin:         5,   // bandeau « série » à partir de N points d'affilée
    serieSec:         8    // durée du bandeau série après chaque point
  }
};

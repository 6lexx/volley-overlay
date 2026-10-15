// =============================================================
//  config.js — Overlay score volley
//  Fichier modifiable SANS toucher au code des pages.
//  Chargé par control.html ET display.html.
//  ⚠ Ne JAMAIS mettre la clé de contrôle (le secret) ici :
//    le dépôt GitHub Pages est public.
// =============================================================
window.SCORE_CONFIG = {

  // --- Firebase (Paramètres du projet > Vos applications > Config SDK)
  // Ces valeurs ne sont pas secrètes : la sécurité est assurée par les règles.
  firebase: {
    apiKey:      "AIzaSyDIcfrcXxCxHwl9GA0v6jr7avvJTEn5gqM",
    authDomain:  "volley-overlay-59f09.firebaseapp.com",
    databaseURL: "https://volley-overlay-59f09-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:   "volley-overlay-59f09",
    appId:       "1:490432783373:web:a358da2d36195d42846144"
  },,

  // --- Règles du match (copiées dans l'état au moment du "Nouveau match" :
  //     modifier ce fichier en cours de match ne casse pas le match en cours)
  rules: {
    setsToWin:        3,   // 3 = match en 5 sets
    pointsPerSet:     25,
    pointsTieBreak:   15,  // 5e set
    minLead:          2,   // écart minimum pour gagner un set
    timeoutsPerSet:   2,   // par équipe et par set
    tieBreakSwitchAt: 8    // rappel de changement de côté au tie-break (0 = désactivé)
  },

  // --- Mon équipe (fixe)
  home: {
    name:      "Mon Club",
    short:     "MCL",        // 3-4 lettres : c'est ce qui s'affiche en 720p
    color:     "#E8A33D",
    textColor: "#111111",
    logo:      null          // ex. "assets/logo.png" (chemin relatif au dépôt)
  },

  // --- Adversaire par défaut (modifiable avant chaque match depuis control.html)
  awayDefault: {
    name:      "Adversaire",
    short:     "ADV",
    color:     "#3D7BE8",
    textColor: "#FFFFFF",
    logo:      null
  },

  // --- Contrôle
  control: {
    undoDepth: 30            // nombre d'actions annulables
  }
};

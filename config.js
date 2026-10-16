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
  },

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
    name:      "Ramonville",
    short:     "RMV",
    color:     "#D3121F",
    textColor: "#FFFFFF",
    logo: "assets/ramonville.png"
  },
  
  // --- Adversaire par défaut (modifiable avant chaque match depuis control.html)
  awayDefault: {
    name:      "Adversaire",
    short:     "ADV",
    color:     "#3D7BE8",
    textColor: "#FFFFFF",
    logo:      null
  },

  // --- Effectif RMV (échauffement) — les présents se cochent dans l'appli
  //  number    : numéro de maillot (unique : il sert à retrouver le joueur)
  //  name      : prénom et nom, ou surnom
  //  position  : poste (Passeur, Pointu, Réceptionneur-attaquant, Central, Libéro)
  //  punchline : une phrase courte, 50 caractères max conseillé
  //  photo     : null = silhouette grise ; plus tard un PNG détouré, par ex. "assets/joueurs/7.png"
  roster: [
    { number: 1,  name: "Margot", position: "Passeur",                     punchline: "Je passe, tu frappes, et on rentre à la maison", photo: assets/IMG_4498.png },
    { number: 88,  name: "Aurore", position: "Passeur",              punchline: "J'suis nulle mais toujours meilleure que toi", photo: null },
    { number: 12,  name: "Maëva", position: "Pointu",                       punchline: "RODRIGUEEEEZZZ", photo: null },
    { number: 0,  name: "Nicolas", position: "Réceptionneur-attaquant",      punchline: "Tu joue Top ou ADC ?", photo: null },
    { number: 5,  name: "Samia", position: "Réceptionneur-attaquant",      punchline: "Admire ma trotinette", photo: null },
    { number: 8,  name: "Baptiste", position: "Réceptionneur-attaquant", punchline: "Je suis super photogénique", photo: null },
    { number: 3,  name: "Cyril", position: "Réceptionneur-attaquant",     punchline: "Veni, vidi, vici", photo: assets/IMG_4497.png },
    { number: 2,  name: "Matthys", position: "Central",                  punchline: "Je met mes balles où je veux, et c'est souvent dans la gueule", photo: null },
    { number: 75,  name: "Romain", position: "Central",                      punchline: "Capitaine du navire", photo: null },
    { number: 10, name: "Quentin", position: "Central",                   punchline: "Je fais aussi du basket", photo: null },
    { number: 17,  name: "Louanne", position: "Réceptionneur-attaquant",      punchline: "Les voy a destrozar.", photo: null },
    { number: 100,  name: "Sovann", position: "Entraîneur",                   punchline: "J'entraîne tout ces fous", photo: null },
  ],

  // --- Contrôle
  control: {
    undoDepth: 30            // nombre d'actions annulables
  }
};

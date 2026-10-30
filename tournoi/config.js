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

  // Adresse du site public (sert au QR code)
  siteUrl: "https://6lexx.github.io/volley-overlay/tournoi/",

  // Même projet Firebase que l'overlay de ton équipe
  firebase: {
    apiKey:      "AIzaSyDIcfrcXxCxHwl9GA0v6jr7avvJTEn5gqM",
    authDomain:  "volley-overlay-59f09.firebaseapp.com",
    databaseURL: "https://volley-overlay-59f09-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:   "volley-overlay-59f09",
    appId:       "1:490432783373:web:a358da2d36195d42846144"
  },

  // Déroulé : brassage (poules A, B, C) → phase 2 (Or, Argent, Bronze) → phase finale
  format: {
    dureeMatchPouleMin: 10,  // brassage et phase 2 : 10 minutes, un dernier point en cas d'égalité
    pointsTour:   21,        // quarts, demies et matchs de classement
    pointsFinale: 25,        // finale (places 1-2)
    ecartMin:      2         // 2 points d'écart en phase finale
  },

  // Les 18 équipes, réparties pour le brassage (positions A à F de chaque poule).
  // Chargées en un clic dans l'écran orga ; échangeables avant de lancer.
  equipes: [
    { nom: "Rougail Saucisse",                          niveau: "Nationale",    poule: "A" },
    { nom: "FAUTPASK’SADORT",                           niveau: "Nationale",    poule: "A" },
    { nom: "En volley vous",                            niveau: "Prénationale", poule: "A" },
    { nom: "Même nous même nous",                       niveau: "Régionale",    poule: "A" },
    { nom: "Les chipies",                               niveau: "Régionale",    poule: "A" },
    { nom: "bébés gras",                                niveau: "Loisir",       poule: "A" },

    { nom: "Habibi",                                    niveau: "Nationale",    poule: "B" },
    { nom: "Petit bebew",                               niveau: "Prénationale", poule: "B" },
    { nom: "Les immigrés",                              niveau: "Prénationale", poule: "B" },
    { nom: "Plot Plot Plot",                            niveau: "Prénationale", poule: "B" },
    { nom: "Gay forevee",                               niveau: "Régionale",    poule: "B" },
    { nom: "Belougras",                                 niveau: "Loisir",       poule: "B" },

    { nom: "Les volley roux lent",                      niveau: "Nationale",    poule: "C" },
    { nom: "Les baby",                                  niveau: "Prénationale", poule: "C" },
    { nom: "Guérin",                                    niveau: "Prénationale", poule: "C" },
    { nom: "Tié un cho",                                niveau: "Prénationale", poule: "C" },
    { nom: "BTP",                                       niveau: "Régionale",    poule: "C" },
    { nom: "Tape dans les 3 mètres j’suis pas ta mère", niveau: "Régionale",    poule: "C" }
  ],

  affichage: {
    maxNom:       15,   // caractères avant "..." sur l'overlay
    victoireSec:  20    // durée du bandeau victoire
  }
};

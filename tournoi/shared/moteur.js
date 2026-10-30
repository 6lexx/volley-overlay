// =============================================================
//  moteur.js — toute la logique du tournoi (aucun affichage ici)
//
//  Déroulé :
//   1. Brassage   : 3 poules de 6 (A, B, C), 15 matchs chacune, au temps
//   2. Phase 2    : poules Or (1ers-2es), Argent (3es-4es), Bronze (5es-6es)
//   3. Phase finale, en points :
//        quarts 1-8 / 2-7 / 3-6 / 4-5 (seeds 1-6 = poule Or, 7-8 = 1er et 2e Argent)
//        demies, matchs pour les places 1 à 8,
//        matchs de classement 9-10 … 17-18 (Argent 3e à 6e, Bronze)
//   Classement final de la 1re à la 18e place.
// =============================================================

export const STATUT = { AVENIR: "a_venir", ENCOURS: "en_cours", TERMINE: "termine" };

export const PHASES = ["brassage", "phase2", "finale"];
export const NOMS_PHASES = { brassage: "Brassage", phase2: "Phase 2", finale: "Phase finale" };
export const POULES = { brassage: ["A", "B", "C"], phase2: ["OR", "ARGENT", "BRONZE"] };
export const NOMS_POULES = { A: "Poule A", B: "Poule B", C: "Poule C", OR: "Poule Or", ARGENT: "Poule Argent", BRONZE: "Poule Bronze" };
export const COURTS_POULES = { A: "A", B: "B", C: "C", OR: "Or", ARGENT: "Argent", BRONZE: "Bronze" };
export const LETTRES_POS = ["A", "B", "C", "D", "E", "F"];

// Ordre des 15 matchs d'une poule de 6, par position (0 = A … 5 = F).
// Chaque groupe de 3 matchs fait jouer les 6 équipes : c'est une rotation.
export const MODELE_POULE = [
  [0, 1], [2, 3], [4, 5],
  [0, 2], [1, 5], [3, 4],
  [0, 3], [1, 4], [2, 5],
  [0, 5], [1, 3], [2, 4],
  [0, 4], [1, 2], [3, 5]
];

export function cleRotation(n) { return "r" + String(n).padStart(2, "0"); }

const vals = (o) => Object.entries(o || {}).map(([id, v]) => ({ id, ...v }));

// ---------- Lecture des données ----------

export function listeEquipes(data) {
  return vals(data?.equipes).sort((a, b) => (a.poule || "").localeCompare(b.poule || "") || (a.pos ?? 99) - (b.pos ?? 99));
}
export function listeMatchs(data) { return vals(data?.matchs); }
export function listeRotations(data) { return vals(data?.rotations).sort((a, b) => a.num - b.num); }

const nomDe = (eqs, id) => eqs.find((e) => e.id === id)?.nom || "";

// Équipes d'une poule, dans l'ordre des positions (A … F)
export function membresPoule(ms, phase, poule, eqs) {
  const pos = [];
  ms.filter((m) => m.phase === phase && m.poule === poule).forEach((m) => {
    if (m.A) pos[m.posA] = m.A;
    if (m.B) pos[m.posB] = m.B;
  });
  if (!pos.length && phase === "brassage" && eqs) {
    eqs.filter((e) => e.poule === poule).sort((a, b) => a.pos - b.pos).forEach((e) => (pos[e.pos] = e.id));
  }
  return pos.filter(Boolean);
}

// Phase la plus avancée qui a des matchs
export function phaseCourante(ms) {
  for (const p of [...PHASES].reverse()) if (ms.some((m) => m.phase === p)) return p;
  return null;
}
export function phaseTerminee(ms, phase) {
  const l = ms.filter((m) => m.phase === phase);
  return l.length > 0 && l.every((m) => m.statut === STATUT.TERMINE);
}
export function phaseSuivante(phase) { return PHASES[PHASES.indexOf(phase) + 1] || null; }

// ---------- Génération d'une phase de poules ----------

// groupes = { A: [id0 … id5], B: […], C: […] } dans l'ordre des positions
export function genererPoules(phase, groupes, rotationsExistantes, cfg) {
  const poules = POULES[phase];
  const duree = Math.round((cfg.format.dureeMatchPouleMin || 10) * 60);
  let n = Math.max(0, ...rotationsExistantes.map((r) => r.num)) + 1;
  const prefixe = phase === "brassage" ? "B" : "P2";
  const matchs = {}, rotations = {};
  for (let k = 0; k < MODELE_POULE.length; k += 3) {          // 5 tours de 3 matchs
    for (const p of poules) {                                  // A, B, C (ou Or, Argent, Bronze)
      const ids = groupes[p];
      for (let t = 0; t < 3; t++) {
        const [a, b] = MODELE_POULE[k + t];
        const num = k + t + 1;
        matchs[`${prefixe}-${p}-${String(num).padStart(2, "0")}`] = {
          phase, poule: p, num, rotation: n, terrain: t + 1,
          A: ids[a], B: ids[b], posA: a, posB: b, statut: STATUT.AVENIR, mode: "temps"
        };
      }
      rotations[cleRotation(n)] = { num: n, phase, poule: p, statut: STATUT.AVENIR, duree, mode: "temps" };
      n++;
    }
  }
  return { matchs, rotations };
}

// ---------- Résultat et classement ----------

// "A", "B" ou null (pas encore joué)
export function resultat(m) {
  if (m.statut !== STATUT.TERMINE) return null;
  if (m.gagnant === "A" || m.gagnant === "B") return m.gagnant;
  if (m.scoreA > m.scoreB) return "A";
  if (m.scoreB > m.scoreA) return "B";
  return null;
}
export function gagnantDe(m) { const r = resultat(m); return r ? m[r] : null; }
export function perdantDe(m) { const r = resultat(m); return r ? m[r === "A" ? "B" : "A"] : null; }

// Égalité interdite partout : en poule, on joue un dernier point
export function egaliteInterdite() { return true; }

// Classement d'une poule :
//  1. victoires  2. confrontation directe entre les équipes à égalité
//  3. différence de points  4. points marqués
export function classement(ms, phase, poule, eqs) {
  const ids = membresPoule(ms, phase, poule, eqs);
  const L = Object.fromEntries(ids.map((id, pos) => [id, { id, pos, nom: nomDe(eqs, id), J: 0, V: 0, D: 0, pour: 0, contre: 0 }]));
  const joues = ms.filter((m) => m.phase === phase && m.poule === poule && m.statut === STATUT.TERMINE);
  joues.forEach((m) => {
    const a = L[m.A], b = L[m.B], r = resultat(m);
    if (!a || !b) return;
    a.J++; b.J++;
    a.pour += m.scoreA || 0; a.contre += m.scoreB || 0;
    b.pour += m.scoreB || 0; b.contre += m.scoreA || 0;
    if (r === "A") { a.V++; b.D++; } else if (r === "B") { b.V++; a.D++; }
  });
  const lignes = Object.values(L).map((l) => ({ ...l, diff: l.pour - l.contre }));

  // Victoires dans les matchs entre les équipes d'un même groupe d'égalité
  const vEntre = (id, groupe) => joues.filter((m) => groupe.has(m.A) && groupe.has(m.B) && gagnantDe(m) === id).length;
  const parV = {};
  lignes.forEach((l) => (parV[l.V] ||= []).push(l));
  lignes.forEach((l) => {
    const g = new Set(parV[l.V].map((x) => x.id));
    l.h2h = g.size > 1 ? vEntre(l.id, g) : 0;
  });
  return lignes
    .sort((x, y) => y.V - x.V || y.h2h - x.h2h || y.diff - x.diff || y.pour - x.pour || x.pos - y.pos)
    .map((l, i) => ({ ...l, rang: i + 1 }));
}

const comparerEntrePoules = (x, y) => y.V - x.V || y.diff - x.diff || y.pour - x.pour || x.nom.localeCompare(y.nom);

// Composition de la phase 2 à partir du classement du brassage.
// Or : les 3 premiers (classés entre eux) puis les 3 deuxièmes ; idem pour Argent et Bronze.
export function composerPhase2(ms, eqs) {
  const cls = POULES.brassage.map((p) => classement(ms, "brassage", p, eqs));
  const rang = (r) => cls.map((c) => c[r - 1]).filter(Boolean).sort(comparerEntrePoules).map((l) => l.id);
  return { OR: [...rang(1), ...rang(2)], ARGENT: [...rang(3), ...rang(4)], BRONZE: [...rang(5), ...rang(6)] };
}

// Têtes de série de l'arbre : 1-6 = classement de la poule Or, 7-8 = 1er et 2e de la poule Argent
export function seeds(ms, eqs) {
  const or = classement(ms, "phase2", "OR", eqs).map((l) => l.id);
  const ar = classement(ms, "phase2", "ARGENT", eqs).map((l) => l.id);
  return [...or.slice(0, 6), ar[0], ar[1]];
}

// ---------- Phase finale ----------

// Codes, noms et liens de l'arbre. G = gagnant, P = perdant.
export const ARBRE = {
  Q1: { nom: "Quart 1", G: ["D1", "A"], P: ["D3", "A"] },
  Q2: { nom: "Quart 2", G: ["D1", "B"], P: ["D3", "B"] },
  Q3: { nom: "Quart 3", G: ["D2", "A"], P: ["D4", "A"] },
  Q4: { nom: "Quart 4", G: ["D2", "B"], P: ["D4", "B"] },
  D1: { nom: "Demie 1", G: ["F12", "A"], P: ["F34", "A"] },
  D2: { nom: "Demie 2", G: ["F12", "B"], P: ["F34", "B"] },
  D3: { nom: "Demie 5-8 n°1", G: ["F56", "A"], P: ["F78", "A"] },
  D4: { nom: "Demie 5-8 n°2", G: ["F56", "B"], P: ["F78", "B"] },
  F12: { nom: "Finale", places: [1, 2] },
  F34: { nom: "Places 3-4", places: [3, 4] },
  F56: { nom: "Places 5-6", places: [5, 6] },
  F78: { nom: "Places 7-8", places: [7, 8] },
  P910: { nom: "Places 9-10", places: [9, 10] },
  P1112: { nom: "Places 11-12", places: [11, 12] },
  P1314: { nom: "Places 13-14", places: [13, 14] },
  P1516: { nom: "Places 15-16", places: [15, 16] },
  P1718: { nom: "Places 17-18", places: [17, 18] }
};

// Grille des 3 terrains (ta feuille « Phases Finales »)
export const GRILLE_FINALE = [
  ["P1718", "P1516", "P1314"],
  ["Q1", "P1112", "Q2"],
  ["Q3", "P910", "Q4"],
  ["D3", null, "D4"],
  ["D1", "F78", "D2"],
  ["F56", null, "F34"],
  [null, "F12", null]
];

export function genererFinale(ms, rots, eqs, cfg) {
  const s = seeds(ms, eqs);
  const ar = classement(ms, "phase2", "ARGENT", eqs).map((l) => l.id);
  const br = classement(ms, "phase2", "BRONZE", eqs).map((l) => l.id);
  const depart = {
    Q1: [s[0], s[7]], Q2: [s[3], s[4]], Q3: [s[1], s[6]], Q4: [s[2], s[5]],
    P910: [ar[2], ar[3]], P1112: [ar[4], ar[5]],
    P1314: [br[0], br[1]], P1516: [br[2], br[3]], P1718: [br[4], br[5]]
  };
  const seedDe = Object.fromEntries(s.map((id, i) => [id, i + 1]));
  const ptsTour = cfg.format.pointsTour || 21, ptsFinale = cfg.format.pointsFinale || 25;
  let n = Math.max(0, ...rots.map((r) => r.num)) + 1;
  const matchs = {}, rotations = {};
  GRILLE_FINALE.forEach((ligne) => {
    const cible = ligne.includes("F12") ? ptsFinale : ptsTour;
    ligne.forEach((code, t) => {
      if (!code) return;
      const def = ARBRE[code];
      const [A, B] = depart[code] || [null, null];
      const m = { phase: "finale", code, nom: def.nom, rotation: n, terrain: t + 1, A, B, statut: STATUT.AVENIR, mode: "points", cible };
      if (def.G) { m.gagnantVers = { id: "F-" + def.G[0], slot: def.G[1] }; m.perdantVers = { id: "F-" + def.P[0], slot: def.P[1] }; }
      if (def.places) m.places = def.places;
      if (A && seedDe[A]) m.seedA = seedDe[A];
      if (B && seedDe[B]) m.seedB = seedDe[B];
      matchs["F-" + code] = m;
    });
    rotations[cleRotation(n)] = { num: n, phase: "finale", statut: STATUT.AVENIR, mode: "points", cible };
    n++;
  });
  return { matchs, rotations };
}

// Nom d'un match : "Poule B", "Quart 2", "Finale", "Places 9-10"…
export function nomPhase(m) {
  if (!m) return "";
  return m.nom || NOMS_POULES[m.poule] || "";
}

// Étiquette d'une place pas encore connue dans l'arbre
export function etiquetteAttente(m, slot, ms) {
  const g = ms.find((x) => x.gagnantVers && x.gagnantVers.id === m.id && x.gagnantVers.slot === slot);
  if (g) return `Vainqueur ${g.nom.toLowerCase()}`;
  const p = ms.find((x) => x.perdantVers && x.perdantVers.id === m.id && x.perdantVers.slot === slot);
  if (p) return `Perdant ${p.nom.toLowerCase()}`;
  return "À déterminer";
}

// ---------- Validation d'un match ----------

// Renvoie les mises à jour (chemins relatifs au tournoi) ou lance une erreur
export function majValidation(m, scoreA, scoreB, gagnantForce, ms, cfg) {
  const a = Number(scoreA), b = Number(scoreB);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) throw new Error("Score invalide");
  if (m.mode === "points") {
    const ecart = cfg.format.ecartMin ?? 2;
    if (Math.max(a, b) < m.cible || Math.abs(a - b) < ecart) {
      throw new Error(`${nomPhase(m)} en ${m.cible} points : le gagnant doit atteindre ${m.cible}${ecart > 1 ? ` avec ${ecart} points d'écart` : ""}`);
    }
  }
  let gagnant = a > b ? "A" : b > a ? "B" : null;
  if (!gagnant) {
    if (gagnantForce !== "A" && gagnantForce !== "B") throw new Error(`${nomPhase(m)} : égalité, choisis qui a gagné le dernier point`);
    gagnant = gagnantForce;
  }
  const u = {};
  const p = `matchs/${m.id}`;
  u[`${p}/scoreA`] = a;
  u[`${p}/scoreB`] = b;
  u[`${p}/gagnant`] = gagnant;
  u[`${p}/statut`] = STATUT.TERMINE;

  // Phase finale : le gagnant et le perdant partent dans leurs matchs suivants
  const envoyer = (lien, equipe) => {
    if (!lien) return;
    const suiv = ms.find((x) => x.id === lien.id);
    if (!suiv || suiv[lien.slot] === equipe) return;
    if (suiv.statut !== STATUT.AVENIR) throw new Error(`Impossible : ${nomPhase(suiv)} a déjà commencé`);
    u[`matchs/${suiv.id}/${lien.slot}`] = equipe;
  };
  envoyer(m.gagnantVers, gagnant === "A" ? m.A : m.B);
  envoyer(m.perdantVers, gagnant === "A" ? m.B : m.A);
  return u;
}

// ---------- Classement final ----------

// [{ place, id }] de 1 à 18 ; id = null tant que le match n'est pas joué
export function classementFinal(ms) {
  const out = [];
  Object.entries(ARBRE).filter(([, d]) => d.places).forEach(([code, d]) => {
    const m = ms.find((x) => x.id === "F-" + code);
    out.push({ place: d.places[0], id: m ? gagnantDe(m) : null, code });
    out.push({ place: d.places[1], id: m ? perdantDe(m) : null, code });
  });
  return out.sort((a, b) => a.place - b.place);
}

export function vainqueurTournoi(ms) {
  const f = ms.find((m) => m.id === "F-F12");
  return f ? gagnantDe(f) : null;
}

// ---------- Rotations et chrono ----------

export function rotationEnCours(rotations) { return rotations.find((r) => r.statut === STATUT.ENCOURS) || null; }
export function prochaineRotation(rotations) { return rotations.find((r) => r.statut === STATUT.AVENIR) || null; }
export function matchsDeRotation(ms, num) {
  return ms.filter((m) => m.rotation === num).sort((a, b) => (a.terrain || 0) - (b.terrain || 0));
}

// Millisecondes restantes (négatif = temps écoulé)
export function tempsRestant(rot, maintenant) {
  if (!rot || !rot.debut || !rot.duree) return null;
  return rot.debut + rot.duree * 1000 - maintenant;
}

// Texte à la place du chrono : "08:42", ou "21 PTS" pour un match en points
export function texteChrono(rot, maintenant, fmt) {
  if (rot && rot.mode === "points") return `${rot.cible} PTS`;
  return fmt(tempsRestant(rot, maintenant));
}

// Le match en points est-il gagné ? Renvoie "A", "B" ou null
export function gagnantAuxPoints(m, a, b, cfg) {
  if (!m || m.mode !== "points") return null;
  const ecart = cfg.format.ecartMin ?? 2;
  if (a >= m.cible && a - b >= ecart) return "A";
  if (b >= m.cible && b - a >= ecart) return "B";
  return null;
}

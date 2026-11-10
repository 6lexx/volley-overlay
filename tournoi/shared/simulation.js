// =============================================================
// simulation.js — avance un faux tournoi jusqu'à une étape donnée
// Pour tester tout le site avant le jour J (démo ou tournoi de test).
// Les scores sont tirés au hasard, mais les équipes de meilleur niveau
// gagnent plus souvent : le classement final ressemble à un vrai.
// =============================================================
import * as T from "./moteur.js";

export const ETAPES = [
  { id: "rotation", nom: "Rotation suivante", aide: "Termine la rotation en cours et lance la suivante" },
  { id: "mi-brassage", nom: "Milieu du brassage", aide: "Rotation 8/15 du brassage en cours" },
  { id: "fin-brassage", nom: "Fin du brassage", aide: "Brassage fini, phase 2 pas encore générée" },
  { id: "mi-phase2", nom: "Milieu de la phase 2", aide: "Rotation 8/15 des poules de niveau en cours" },
  { id: "quarts", nom: "Quarts en cours", aide: "Phase finale générée, les quarts se jouent" },
  { id: "demies", nom: "Demies en cours", aide: "Les vraies demies se jouent" },
  { id: "finale", nom: "Finale en cours", aide: "La finale et la petite finale se jouent" },
  { id: "fin", nom: "Tournoi terminé", aide: "Tous les matchs joués, classement final complet" },
];

// Niveau (« Nationale », « PN »…) → force
function force(niveau) {
  const n = String(niveau || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (n === "pn" || n.startsWith("pre")) return 3;
  if (n === "n" || n.startsWith("nat")) return 4;
  if (n === "r" || n.startsWith("reg")) return 2;
  if (n === "l" || n.startsWith("loi")) return 1;
  return 2.5;
}
const alea = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function scoresPlausibles(m, eqs, cfg) {
  const f = (id) => force(eqs.find((e) => e.id === id)?.niveau);
  const fa = f(m.A), fb = f(m.B);
  if (m.mode === "points") {
    const pA = 1 / (1 + Math.exp(-(fa - fb) * 0.9));
    const ecart = cfg.format?.ecartMin ?? 2;
    let perdant = alea(Math.max(0, m.cible - 12), m.cible - ecart);
    let gagnant = m.cible;
    if (Math.random() < 0.15) { gagnant = m.cible + alea(1, 3); perdant = gagnant - ecart; }   // un match aux prolongations de temps en temps
    return Math.random() < pA ? { A: gagnant, B: perdant, g: null } : { A: perdant, B: gagnant, g: null };
  }
  const A = Math.max(2, Math.round(7 + fa * 1.6 + Math.random() * 7 - Math.random() * 3));
  const B = Math.max(2, Math.round(7 + fb * 1.6 + Math.random() * 7 - Math.random() * 3));
  return { A, B, g: A === B ? (Math.random() < 0.5 ? "A" : "B") : null };
}

// Applique des mises à jour "matchs/ID/champ" ou "rotations/ID/champ" sur l'objet d
function appliquer(d, majs) {
  for (const [chemin, v] of Object.entries(majs)) {
    const parts = chemin.split("/");
    let o = d;
    parts.slice(0, -1).forEach((k) => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; });
    const fin = parts[parts.length - 1];
    if (v === null || v === undefined) delete o[fin]; else o[fin] = v;
  }
}

function etat(d) {
  const eqs = T.listeEquipes(d), ms = T.listeMatchs(d), rots = T.listeRotations(d);
  return { eqs, ms, rots, cur: T.rotationEnCours(rots), suiv: T.prochaineRotation(rots) };
}

// Une action, comme le ferait l'organisateur. Renvoie false s'il n'y a plus rien à faire.
function pas(d, cfg, horloge) {
  const { eqs, ms, rots, cur, suiv } = etat(d);
  if (!eqs.length) {
    d.equipes = {};
    const compteur = {};
    cfg.equipes.forEach((e, i) => {
      compteur[e.poule] = compteur[e.poule] || 0;
      d.equipes[`eq${String(i + 1).padStart(2, "0")}`] = { nom: e.nom, niveau: e.niveau || "", poule: e.poule, pos: compteur[e.poule]++ };
    });
    return true;
  }
  const ajouterPhase = ({ matchs, rotations }) => {
    d.matchs = { ...(d.matchs || {}), ...matchs };
    d.rotations = { ...(d.rotations || {}), ...rotations };
  };
  if (!ms.length) {
    const groupes = {};
    T.POULES.brassage.forEach((p) => (groupes[p] = eqs.filter((e) => e.poule === p).sort((a, b) => a.pos - b.pos).map((e) => e.id)));
    ajouterPhase(T.genererPoules("brassage", groupes, rots, cfg));
    return true;
  }
  if (cur) {
    let copie = ms.map((m) => ({ ...m }));
    const u = {};
    for (const m of T.matchsDeRotation(ms, cur.num)) {
      const s = scoresPlausibles(m, eqs, cfg);
      const part = T.majValidation(copie.find((x) => x.id === m.id), s.A, s.B, s.g, copie, cfg);
      Object.assign(u, part);
      copie = copie.map((x) => {
        const c = { ...x };
        for (const [k, val] of Object.entries(part)) { const [, id, f] = k.split("/"); if (id === x.id) c[f] = val; }
        return c;
      });
    }
    u[`rotations/${cur.id}/statut`] = T.STATUT.TERMINE;
    u[`rotations/${cur.id}/fin`] = horloge.t += (cur.duree ? cur.duree * 1000 : 15 * 60000);
    appliquer(d, u);
    return true;
  }
  if (suiv) {
    const liste = T.matchsDeRotation(ms, suiv.num);
    if (liste.some((m) => !m.A || !m.B)) return false;
    const u = { [`rotations/${suiv.id}/statut`]: T.STATUT.ENCOURS, [`rotations/${suiv.id}/debut`]: horloge.t += 2 * 60000 };
    liste.forEach((m) => (u[`matchs/${m.id}/statut`] = T.STATUT.ENCOURS));
    appliquer(d, u);
    return true;
  }
  const phase = T.phaseCourante(ms);
  if (phase === "brassage" && T.phaseTerminee(ms, "brassage")) { ajouterPhase(T.genererPoules("phase2", T.composerPhase2(ms, eqs), rots, cfg)); return true; }
  if (phase === "phase2" && T.phaseTerminee(ms, "phase2")) { ajouterPhase(T.genererFinale(ms, rots, eqs, cfg)); return true; }
  return false;
}

function atteint(cible, d) {
  const { ms, rots, cur } = etat(d);
  const idx = (r) => rots.filter((x) => x.phase === r.phase).findIndex((x) => x.id === r.id) + 1;
  const codes = cur ? T.matchsDeRotation(ms, cur.num).map((m) => m.code) : [];
  switch (cible) {
    case "mi-brassage": return cur?.phase === "brassage" && idx(cur) >= 8;
    case "fin-brassage": return T.phaseTerminee(ms, "brassage") && !ms.some((m) => m.phase === "phase2");
    case "mi-phase2": return cur?.phase === "phase2" && idx(cur) >= 8;
    case "quarts": return codes.includes("Q1") || codes.includes("Q3");
    case "demies": return codes.includes("D1");
    case "finale": return codes.includes("F12");
    case "fin": return !!T.vainqueurTournoi(ms);
    default: return false;
  }
}

// Renvoie { equipes, matchs, rotations } à l'étape demandée.
// "rotation" : continue à partir des données actuelles.
// Les autres étapes : repart de zéro (équipes gardées) et rejoue tout jusqu'à l'étape.
export function simuler(donnees, cible, cfg, maintenant = Date.now()) {
  const d = JSON.parse(JSON.stringify({ equipes: donnees?.equipes || {}, matchs: donnees?.matchs || {}, rotations: donnees?.rotations || {} }));
  const horloge = { t: maintenant - 5 * 60000 };

  if (cible === "rotation") {
    const avant = etat(d).cur;
    for (let i = 0; i < 6; i++) {
      if (!pas(d, cfg, horloge)) break;
      const { cur } = etat(d);
      if (cur && cur.id !== avant?.id) break;
    }
  } else {
    d.matchs = {}; d.rotations = {};
    for (let i = 0; i < 400 && !atteint(cible, d); i++) if (!pas(d, cfg, horloge)) break;
    // Recale les horaires pour que le dernier événement tombe maintenant
    const decal = maintenant - horloge.t;
    Object.values(d.rotations).forEach((r) => { if (r.debut) r.debut += decal; if (r.fin) r.fin += decal; });
  }

  // La rotation en cours démarre maintenant : le chrono tourne pour de vrai
  const { cur } = etat(d);
  if (cur) d.rotations[cur.id].debut = maintenant;
  const vide = (o) => (o && Object.keys(o).length ? o : null);
  return { equipes: d.equipes, matchs: vide(d.matchs), rotations: vide(d.rotations) };
}

// =============================================================
//  moteur.js — toute la logique du tournoi (aucun affichage ici)
//  Planning des poules, classements, arbre final, avancement des
//  gagnants. Utilisé par toutes les pages du dossier tournoi/.
// =============================================================

export const STATUT = { AVENIR: "a_venir", ENCOURS: "en_cours", TERMINE: "termine" };

const vals = (o) => (o ? Object.values(o).filter(Boolean) : []);

export function cleRotation(n) { return "r" + String(n).padStart(2, "0"); }

export function nouvelId(prefixe = "e") {
  return prefixe + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------- Lecture des données ----------

export function listeEquipes(data) {
  return Object.entries(data?.equipes || {})
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => (a.poule || "").localeCompare(b.poule || "") || (a.ordre || 0) - (b.ordre || 0));
}

export function listeMatchs(data) {
  return Object.entries(data?.matchs || {}).map(([id, m]) => ({ id, ...m }));
}

export function listeRotations(data) {
  return Object.entries(data?.rotations || {})
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => a.num - b.num);
}

export function poulesDe(equipes) {
  return [...new Set(equipes.map((e) => e.poule).filter(Boolean))].sort();
}

// ---------- Planning des poules ----------

// Toutes les rencontres d'une poule, groupées par journée (méthode du cercle)
function journees(ids) {
  const t = [...ids];
  if (t.length < 2) return [];
  if (t.length % 2) t.push(null);           // nombre impair : une équipe au repos
  const n = t.length, res = [];
  for (let j = 0; j < n - 1; j++) {
    const jour = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      if (a && b) jour.push(j % 2 ? [b, a] : [a, b]);
    }
    res.push(jour);
    t.splice(1, 0, t.pop());                  // rotation, la première reste fixe
  }
  return res;
}

// Range des matchs dans des rotations : au plus `terrains` matchs,
// et une équipe ne joue qu'une fois par rotation.
function ranger(liste, terrains, depart) {
  const restant = [...liste], rotations = [];
  while (restant.length) {
    const prises = new Set(), cette = [];
    for (let i = 0; i < restant.length && cette.length < terrains; ) {
      const m = restant[i];
      const eqs = [m.A, m.B].filter(Boolean);
      if (eqs.some((e) => prises.has(e))) { i++; continue; }
      eqs.forEach((e) => prises.add(e));
      cette.push(m);
      restant.splice(i, 1);
    }
    if (!cette.length) cette.push(restant.shift()); // sécurité
    rotations.push(cette);
  }
  rotations.forEach((ms, k) => ms.forEach((m) => (m.rotation = depart + k)));
  return rotations.length;
}

export function planifierPoules(equipes, cfg) {
  const terrains = Math.max(1, cfg.format.terrains || 1);
  const duree = Math.round((cfg.format.dureeRotationMin || 10) * 60);
  const parPoule = {};
  equipes.forEach((e) => (parPoule[e.poule] ||= []).push(e.id));
  const poules = Object.keys(parPoule).sort();

  // On alterne les poules journée par journée pour équilibrer les terrains
  const parJour = poules.map((p) => journees(parPoule[p]).map((j) => j.map(([A, B]) => ({ A, B, poule: p }))));
  const maxJ = Math.max(0, ...parJour.map((x) => x.length));
  const liste = [];
  for (let j = 0; j < maxJ; j++) poules.forEach((_, k) => (parJour[k][j] || []).forEach((m) => liste.push(m)));

  const nb = ranger(liste, terrains, 1);
  const compteur = {};
  const matchs = {};
  liste.forEach((m) => {
    compteur[m.poule] = (compteur[m.poule] || 0) + 1;
    const id = `P-${m.poule}-${String(compteur[m.poule]).padStart(2, "0")}`;
    matchs[id] = { phase: "poule", poule: m.poule, num: compteur[m.poule], rotation: m.rotation, A: m.A, B: m.B, statut: STATUT.AVENIR };
  });
  const rotations = {};
  for (let n = 1; n <= nb; n++) rotations[cleRotation(n)] = { num: n, phase: "poules", statut: STATUT.AVENIR, duree };
  return { matchs, rotations };
}

// ---------- Résultat d'un match ----------

// "A", "B", "nul" ou null (pas encore joué)
export function resultat(m) {
  if (m.statut !== STATUT.TERMINE) return null;
  if (m.gagnant) return m.gagnant;
  if (m.scoreA > m.scoreB) return "A";
  if (m.scoreB > m.scoreA) return "B";
  return "nul";
}

// Faut-il désigner un gagnant quand les scores sont égaux ?
export function egaliteInterdite(m, cfg) {
  return m.phase === "finale" || cfg.format.egalitePoules === "point-en-or";
}

// ---------- Classement ----------

export function classement(equipes, matchs, poule, cfg) {
  const pts = cfg.format.points || { victoire: 3, nul: 1, defaite: 0 };
  const lignes = {};
  equipes.filter((e) => e.poule === poule).forEach((e) => {
    lignes[e.id] = { id: e.id, nom: e.nom, J: 0, V: 0, N: 0, D: 0, pour: 0, contre: 0, points: 0 };
  });
  matchs.filter((m) => m.phase === "poule" && m.poule === poule && m.statut === STATUT.TERMINE).forEach((m) => {
    const r = resultat(m), a = lignes[m.A], b = lignes[m.B];
    if (!a || !b) return;
    a.J++; b.J++;
    a.pour += m.scoreA || 0; a.contre += m.scoreB || 0;
    b.pour += m.scoreB || 0; b.contre += m.scoreA || 0;
    if (r === "A") { a.V++; b.D++; a.points += pts.victoire; b.points += pts.defaite; }
    else if (r === "B") { b.V++; a.D++; b.points += pts.victoire; a.points += pts.defaite; }
    else { a.N++; b.N++; a.points += pts.nul; b.points += pts.nul; }
  });
  return Object.values(lignes)
    .map((l) => ({ ...l, diff: l.pour - l.contre }))
    .sort((x, y) => y.points - x.points || y.diff - x.diff || y.pour - x.pour || x.nom.localeCompare(y.nom))
    .map((l, i) => ({ ...l, rang: i + 1 }));
}

export function poulesTerminees(matchs) {
  const p = matchs.filter((m) => m.phase === "poule");
  return p.length > 0 && p.every((m) => m.statut === STATUT.TERMINE);
}

// ---------- Phase finale ----------

const pow2 = (n) => { let s = 1; while (s < n) s *= 2; return s; };

// Ordre classique des têtes de série : 1,8,4,5,2,7,3,6 pour 8
function ordreTetes(S) {
  let o = [1];
  while (o.length < S) {
    const L = o.length * 2;
    o = o.flatMap((s) => [s, L + 1 - s]);
  }
  return o;
}

export function nomTour(tour, nbTours) {
  const reste = nbTours - tour;
  return { 1: "Finale", 2: "Demie", 3: "Quart", 4: "Huitième" }[reste] || `Tour ${tour + 1}`;
}

export function nomTourPluriel(tour, nbTours) {
  const reste = nbTours - tour;
  return { 1: "Finale", 2: "Demies", 3: "Quarts", 4: "Huitièmes" }[reste] || `Tour ${tour + 1}`;
}

// Nom d'une phase de match, ex. "Poule B", "Quart 2", "Finale"
export function nomPhase(m, matchs) {
  if (!m) return "";
  if (m.phase === "poule") return `Poule ${m.poule}`;
  const nb = m.nbTours || 1;
  const t = nomTour(m.tour, nb);
  const memeTour = matchs ? matchs.filter((x) => x.phase === "finale" && x.tour === m.tour).length : 2;
  return t === "Finale" || memeTour < 2 ? t : `${t} ${m.index + 1}`;
}

// Liste ordonnée des qualifiés, puis tableau de positions (null = exempt)
function positionsFinale(equipes, matchs, cfg) {
  const q = Math.max(1, cfg.format.qualifiesParPoule || 2);
  const poules = poulesDe(equipes);
  const cl = Object.fromEntries(poules.map((p) => [p, classement(equipes, matchs, p, cfg)]));
  const n = poules.length;

  // Cas courant : 2 qualifiés par poule, nombre de poules puissance de 2.
  // On croise les poules : 1er A – 2e B, 1er B – 2e C… sans revanche de poule avant la finale.
  if (q === 2 && n >= 2 && pow2(n) === n) {
    const paires = poules.map((p, i) => [cl[p][0]?.id || null, cl[poules[(i + 1) % n]][1]?.id || null]);
    const ordre = [...paires.filter((_, i) => i % 2 === 0), ...paires.filter((_, i) => i % 2 === 1)];
    return ordre.flat();
  }

  // Sinon : têtes de série par rang, puis meilleures stats
  const tetes = [];
  for (let r = 0; r < q; r++) {
    const deCeRang = poules.map((p) => cl[p][r]).filter(Boolean)
      .sort((x, y) => y.points - x.points || y.diff - x.diff || y.pour - x.pour);
    deCeRang.forEach((l) => tetes.push(l.id));
  }
  const S = pow2(Math.max(2, tetes.length));
  const pos = ordreTetes(S).map((s) => tetes[s - 1] || null);
  eviterRevanches(pos, equipes);
  return pos;
}

// Échange les seconds de deux matchs du 1er tour quand deux équipes
// de la même poule se retrouveraient face à face.
function eviterRevanches(pos, equipes) {
  const poule = Object.fromEntries(equipes.map((e) => [e.id, e.poule]));
  const meme = (i) => pos[2 * i] && pos[2 * i + 1] && poule[pos[2 * i]] === poule[pos[2 * i + 1]];
  const n = pos.length / 2;
  for (let i = 0; i < n; i++) {
    if (!meme(i)) continue;
    for (let j = 0; j < n; j++) {
      if (j === i || !pos[2 * j + 1]) continue;
      [pos[2 * i + 1], pos[2 * j + 1]] = [pos[2 * j + 1], pos[2 * i + 1]];
      if (!meme(i) && !meme(j)) break;
      [pos[2 * i + 1], pos[2 * j + 1]] = [pos[2 * j + 1], pos[2 * i + 1]];
    }
  }
}

export function genererFinale(equipes, matchs, rotationsExistantes, cfg) {
  const positions = positionsFinale(equipes, matchs, cfg);
  const S = positions.length;
  const nbTours = Math.round(Math.log2(S));
  const terrains = Math.max(1, cfg.format.terrains || 1);
  const duree = Math.round((cfg.format.dureeFinaleMin || cfg.format.dureeRotationMin || 10) * 60);
  const out = {};

  // Squelette de l'arbre
  for (let t = 0; t < nbTours; t++) {
    const nbM = S / 2 ** (t + 1);
    for (let i = 0; i < nbM; i++) {
      const id = `F-${t}-${String(i).padStart(2, "0")}`;
      const suivant = t < nbTours - 1 ? { id: `F-${t + 1}-${String(Math.floor(i / 2)).padStart(2, "0")}`, slot: i % 2 ? "B" : "A" } : null;
      out[id] = { phase: "finale", tour: t, index: i, nbTours, A: null, B: null, statut: STATUT.AVENIR, suivant };
    }
  }
  // Premier tour, et exempts envoyés directement au tour suivant
  for (let i = 0; i < S / 2; i++) {
    const m = out[`F-0-${String(i).padStart(2, "0")}`];
    m.A = positions[2 * i]; m.B = positions[2 * i + 1];
    if ((m.A && !m.B) || (!m.A && m.B)) {
      m.exempt = true; m.statut = STATUT.TERMINE; m.gagnant = m.A ? "A" : "B";
      if (m.suivant) out[m.suivant.id][m.suivant.slot] = m.A || m.B;
    }
  }
  // Rotations : chaque tour démarre après le précédent
  let n = Math.max(0, ...rotationsExistantes.map((r) => r.num)) + 1;
  const rotations = {};
  for (let t = 0; t < nbTours; t++) {
    const aJouer = Object.values(out).filter((m) => m.tour === t && !m.exempt).sort((a, b) => a.index - b.index);
    for (let k = 0; k < aJouer.length; k += terrains) {
      aJouer.slice(k, k + terrains).forEach((m) => (m.rotation = n));
      rotations[cleRotation(n)] = { num: n, phase: "finale", tour: t, statut: STATUT.AVENIR, duree };
      n++;
    }
  }
  return { matchs: out, rotations };
}

// Étiquette d'une place pas encore connue dans l'arbre
export function etiquetteAttente(m, slot, matchs) {
  const src = matchs.find((x) => x.suivant && x.suivant.id === m.id && x.suivant.slot === slot);
  return src ? `Vainqueur ${nomPhase(src, matchs).toLowerCase()}` : "À déterminer";
}

// ---------- Validation d'un match ----------

// Renvoie les mises à jour (chemins relatifs au tournoi) ou lance une erreur
export function majValidation(m, scoreA, scoreB, gagnantForce, matchs, cfg) {
  const a = Number(scoreA), b = Number(scoreB);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) throw new Error("Score invalide");
  let gagnant = a > b ? "A" : b > a ? "B" : null;
  if (gagnant === null) {
    if (egaliteInterdite(m, cfg)) {
      if (gagnantForce !== "A" && gagnantForce !== "B") throw new Error("Égalité : choisis le gagnant du point en or");
      gagnant = gagnantForce;
    } else gagnant = "nul";
  }
  const u = {};
  const p = `matchs/${m.id}`;
  u[`${p}/scoreA`] = a;
  u[`${p}/scoreB`] = b;
  u[`${p}/gagnant`] = gagnant;
  u[`${p}/statut`] = STATUT.TERMINE;

  // Phase finale : le gagnant passe au match suivant
  if (m.phase === "finale" && m.suivant) {
    const suiv = matchs.find((x) => x.id === m.suivant.id);
    const equipeG = gagnant === "A" ? m.A : m.B;
    if (suiv && suiv[m.suivant.slot] !== equipeG) {
      if (suiv.statut !== STATUT.AVENIR) throw new Error(`Impossible : le match suivant (${nomPhase(suiv, matchs)}) a déjà commencé`);
      u[`matchs/${suiv.id}/${m.suivant.slot}`] = equipeG;
    }
  }
  return u;
}

// ---------- État général ----------

export function rotationEnCours(rotations) {
  return rotations.find((r) => r.statut === STATUT.ENCOURS) || null;
}

export function prochaineRotation(rotations) {
  return rotations.find((r) => r.statut === STATUT.AVENIR) || null;
}

export function matchsDeRotation(matchs, num) {
  return matchs.filter((m) => m.rotation === num).sort((a, b) => (a.poule || "").localeCompare(b.poule || "") || (a.index || 0) - (b.index || 0));
}

// Millisecondes restantes (négatif = temps écoulé)
export function tempsRestant(rot, maintenant) {
  if (!rot || !rot.debut) return null;
  return rot.debut + rot.duree * 1000 - maintenant;
}

export function vainqueurTournoi(matchs) {
  const f = matchs.find((m) => m.phase === "finale" && !m.suivant);
  if (!f || f.statut !== STATUT.TERMINE) return null;
  const r = resultat(f);
  return r === "A" ? f.A : r === "B" ? f.B : null;
}

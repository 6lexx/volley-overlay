// =============================================================
//  moteur.js — règles du volley, calculées depuis l'historique
//  des points. Rien n'est stocké en double : sets, service,
//  fin de match et stats se déduisent de la chaîne des points.
//
//  points      : "ABBA…" (une lettre par point marqué)
//  format      : { setsGagnants, points, tieBreak, ecart }
//  corrections : { "<nb de points joués>": "A" | "B" } — qui sert
//                à ce moment-là (choix du service, correction)
// =============================================================

export const autre = (e) => (e === "A" ? "B" : "A");

// Nombre de points à atteindre pour le set n (1, 2, …)
export function cibleSet(format, n) {
  const g = format.setsGagnants;
  const decisif = g > 1 && n === 2 * g - 1;
  return decisif ? format.tieBreak : format.points;
}
export const estTieBreak = (format, n) => format.setsGagnants > 1 && n === 2 * format.setsGagnants - 1;

export function calculer(format, points = "", corrections = {}) {
  const f = format;
  const sets = [];                    // sets terminés : { A, B, gagnant, debut, fin }
  let cur = { A: 0, B: 0, debut: 0 };
  const gagnes = { A: 0, B: 0 };
  let fini = false, gagnant = null;
  let service = corrections["0"] || "A";
  let premierServeur = service;       // premier serveur du set en cours
  let serie = { eq: null, n: 0 };
  let ecartMax = { eq: null, n: 0, set: 1 };
  let finSetAuPoint = -1;             // index (1-based) du point qui a fini le dernier set
  let coteAuPoint = -1;               // index du point qui déclenche le changement de côté
  let ignores = 0;

  const corr = (i) => corrections[String(i)];

  for (let i = 0; i < points.length; i++) {
    const e = points[i];
    if (fini || (e !== "A" && e !== "B")) { ignores++; continue; }
    cur[e]++;
    serie = serie.eq === e ? { eq: e, n: serie.n + 1 } : { eq: e, n: 1 };
    const ec = Math.abs(cur.A - cur.B);
    if (ec > ecartMax.n) ecartMax = { eq: cur.A > cur.B ? "A" : "B", n: ec, set: sets.length + 1 };
    service = e;

    const num = sets.length + 1;
    const cible = cibleSet(f, num);
    const moitie = Math.ceil(cible / 2);
    if (estTieBreak(f, num) && cur[e] === moitie && cur[autre(e)] < moitie) coteAuPoint = i + 1;
    if (cur[e] >= cible && cur[e] - cur[autre(e)] >= f.ecart) {
      sets.push({ A: cur.A, B: cur.B, gagnant: e, debut: cur.debut, fin: i + 1 });
      gagnes[e]++;
      finSetAuPoint = i + 1;
      if (gagnes[e] === f.setsGagnants) { fini = true; gagnant = e; }
      else {
        // Nouveau set : l'équipe qui n'a pas servi en premier au set précédent
        premierServeur = autre(premierServeur);
        service = premierServeur;
        cur = { A: 0, B: 0, debut: i + 1 };
        serie = { eq: null, n: 0 };
      }
    }
    const c = corr(i + 1);
    if (c && !fini) {
      service = c;
      if (cur.A === 0 && cur.B === 0) premierServeur = c;
    }
  }
  // Correction au tout début du match
  if (points.length === 0 && corr(0)) { service = corr(0); premierServeur = service; }

  const num = fini ? sets.length : sets.length + 1;
  return {
    sets,
    courant: fini ? null : { A: cur.A, B: cur.B, num, cible: cibleSet(f, num), tieBreak: estTieBreak(f, num) },
    gagnes,
    fini,
    gagnant,
    service: fini ? null : service,
    serie,
    ecartMax,
    finSetAuPoint,
    coteAuPoint,
    nbPoints: points.length - ignores,
    // Le dernier point vient-il de finir un set ? de lancer le changement de côté ?
    dernierFinitSet: finSetAuPoint === points.length && points.length > 0,
    dernierChangeCote: coteAuPoint === points.length && points.length > 0
  };
}

// Points de set / de match pour l'antisèche
export function enjeu(format, etat) {
  if (etat.fini || !etat.courant) return null;
  const c = etat.courant;
  for (const e of ["A", "B"]) {
    if (c[e] + 1 >= c.cible && c[e] + 1 - c[autre(e)] >= format.ecart) {
      return { eq: e, type: etat.gagnes[e] + 1 === format.setsGagnants ? "match" : "set" };
    }
  }
  return null;
}

// Couleur de texte lisible (blanc ou noir) sur une couleur de fond
export function texteSur(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return "#FFFFFF";
  const n = parseInt(m[1], 16);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  // contraste avec le blanc vs avec le noir
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#FFFFFF" : "#16130F";
}

// =============================================================
// recap.js — le récap de fin de tournoi d'une équipe, en story
// 1. statsEquipe() calcule les chiffres à partir des matchs
// 2. dessiner() fabrique les images 1080 × 1920 (canvas)
// Trois styles : "affiche" (1 image), "carte" (1 image), "wrapped" (3 images)
// =============================================================
import * as T from "./moteur.js";

export const W = 1080, H = 1920;
export const STYLES = {
  affiche: { nom: "L'affiche", images: 1 },
  carte: { nom: "La carte", images: 1 },
  wrapped: { nom: "Wrapped · 3", images: 3 },
};

const C = {
  rouge: "#D3121F", rougeFonce: "#C10F1B", rose: "#FFE3E7", roseVif: "#FF8A99",
  encre: "#15151A", brume: "#F4F2EF", gris: "#5C5A57", grisClair: "#8A8781", ligne: "#F1EFEC",
  or: "#D9A520", argent: "#A9ADB2", bronze: "#B5763A", blanc: "#FFFFFF",
};
const METAL = { OR: C.or, ARGENT: C.argent, BRONZE: C.bronze };
const NOM_METAL = { OR: "Or", ARGENT: "Argent", BRONZE: "Bronze" };

// ---------------------------------------------------------------
// 1. Les chiffres
// ---------------------------------------------------------------
export const ordinal = (n, fem) => n + (n === 1 ? (fem ? "re" : "er") : "e");

export function statsEquipe(ms, eqs, id, cfg) {
  const equipe = eqs.find((e) => e.id === id);
  if (!equipe) return null;
  const nomDe = (x) => eqs.find((e) => e.id === x)?.nom || "?";

  const lignes = ms
    .filter((m) => m.statut === T.STATUT.TERMINE && (m.A === id || m.B === id))
    .sort((a, b) => (a.rotation || 0) - (b.rotation || 0))
    .map((m) => {
      const cote = m.A === id ? "A" : "B", autre = cote === "A" ? "B" : "A";
      const pour = Number(m["score" + cote]) || 0, contre = Number(m["score" + autre]) || 0;
      return { m, pour, contre, ecart: pour - contre, gagne: T.resultat(m) === cote, adv: nomDe(m[autre]), tour: T.nomPhase(m) };
    });

  const J = lignes.length, V = lignes.filter((l) => l.gagne).length, D = J - V;
  const pour = lignes.reduce((s, l) => s + l.pour, 0), contre = lignes.reduce((s, l) => s + l.contre, 0);

  // Plus belle victoire : le plus gros écart (à égalité, la plus tardive)
  const victoires = lignes.filter((l) => l.gagne);
  const belle = victoires.reduce((b, l) => (!b || l.ecart >= b.ecart ? l : b), null);
  // Le plus serré : le plus petit écart (à égalité, le plus de points), hors plus belle victoire
  const serre = lignes.filter((l) => l !== belle)
    .reduce((b, l) => (!b || Math.abs(l.ecart) < Math.abs(b.ecart) || (Math.abs(l.ecart) === Math.abs(b.ecart) && l.pour + l.contre > b.pour + b.contre) ? l : b), null);

  let serie = 0, cours = 0;
  lignes.forEach((l) => { cours = l.gagne ? cours + 1 : 0; serie = Math.max(serie, cours); });

  // Un point toutes les X secondes, sur les matchs au temps (on connaît leur durée)
  const auTemps = lignes.filter((l) => l.m.mode !== "points");
  const ptsTemps = auTemps.reduce((s, l) => s + l.pour, 0);
  const minutes = cfg?.format?.dureeMatchPouleMin || 10;
  const secParPoint = ptsTemps ? Math.round((auTemps.length * minutes * 60) / ptsTemps) : null;

  // Parcours
  const pouleDe = (phase) => ms.find((m) => m.phase === phase && (m.A === id || m.B === id))?.poule || null;
  const pB = pouleDe("brassage"), p2 = pouleDe("phase2");
  const rangB = pB ? T.classement(ms, "brassage", pB, eqs).find((l) => l.id === id)?.rang : null;
  const rang2 = p2 ? T.classement(ms, "phase2", p2, eqs).find((l) => l.id === id)?.rang : null;
  const destB = rangB ? (rangB <= 2 ? "OR" : rangB <= 4 ? "ARGENT" : "BRONZE") : null;
  const fin = lignes.filter((l) => l.m.phase === "finale");
  const quart = ms.find((m) => m.phase === "finale" && /^Q\d$/.test(m.code || "") && (m.A === id || m.B === id));
  const seed = quart ? (quart.A === id ? quart.seedA : quart.seedB) : null;

  const place = T.classementFinal(ms).find((x) => x.id === id)?.place || null;
  const total = eqs.length || 18;

  let titre;
  if (place === 1) titre = "CHAMPIONS !";
  else if (place === 2) titre = "FINALISTES";
  else if (place && place <= 4) titre = "SUR LE PODIUM";
  else if (place && place <= 8) titre = "QUART-FINALISTES";
  else if (p2) titre = "POULE " + NOM_METAL[p2].toUpperCase();
  else titre = "MERCI D'AVOIR JOUÉ";
  if (place === 4) titre = "DEMI-FINALISTES";

  // Carré mis en avant : la médaille pour le podium, sinon la poule de niveau
  const metal = place === 1 ? "OR" : place === 2 ? "ARGENT" : place === 3 ? "BRONZE" : p2 || "OR";

  return {
    id, nom: equipe.nom, J, V, D, pour, contre, diff: pour - contre,
    pct: J ? Math.round((V / J) * 100) : 0,
    belle, serre, serie, secParPoint, lignes,
    brassage: pB ? { poule: pB, rang: rangB, dest: destB } : null,
    phase2: p2 ? { poule: p2, rang: rang2, seed } : null,
    finale: fin, place, total, titre, metal,
  };
}

// Prêt quand la place finale de l'équipe est connue
export function recapPret(ms, id) {
  return !!T.classementFinal(ms).find((x) => x.id === id);
}

// ---------------------------------------------------------------
// 2. Le dessin
// ---------------------------------------------------------------
const FAM = { cond: '"Barlow Condensed", "Arial Narrow", sans-serif', corps: '"Barlow", system-ui, sans-serif' };

export async function chargerPolices() {
  const l = ["700 40px", "800 40px"].map((p) => `${p} "Barlow Condensed"`).concat(["500 40px", "600 40px", "700 40px"].map((p) => `${p} "Barlow"`));
  try { await Promise.all(l.map((f) => document.fonts.load(f))); } catch {}
}

export function chargerImage(src) {
  return new Promise((ok) => {
    if (!src) return ok(null);
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}

function police(ctx, taille, poids = 800, fam = "cond", espace = 0) {
  ctx.font = `${poids} ${taille}px ${FAM[fam]}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = espace + "px";
}
const largeur = (ctx, s) => ctx.measureText(s).width;

// Texte placé par le HAUT des majuscules (comme une maquette), renvoie la largeur
function texte(ctx, s, x, haut, o = {}) {
  const taille = o.taille || 40;
  police(ctx, taille, o.poids ?? 800, o.fam || "cond", o.espace || 0);
  let t = String(s);
  if (o.max && largeur(ctx, t) > o.max) {
    while (t.length > 1 && largeur(ctx, t + "…") > o.max) t = t.slice(0, -1);
    t = t.trimEnd() + "…";
  }
  ctx.fillStyle = o.couleur || C.blanc;
  ctx.textAlign = o.align || "left";
  ctx.textBaseline = "alphabetic";
  const cap = (o.fam || "cond") === "cond" ? 0.7 : 0.72;
  ctx.fillText(t, x, haut + taille * cap);
  return largeur(ctx, t);
}

// Coupe un nom en lignes : la plus grande taille qui tient en maxLignes
function couper(ctx, s, tailleMax, tailleMin, larg, maxLignes, poids = 800) {
  const mots = String(s).split(/\s+/).filter(Boolean);
  for (let t = tailleMax; t >= tailleMin; t -= 4) {
    police(ctx, t, poids);
    const lignes = [];
    let cur = "";
    for (const m of mots) {
      const essai = cur ? cur + " " + m : m;
      if (largeur(ctx, essai) <= larg) cur = essai;
      else { if (cur) lignes.push(cur); cur = m; }
    }
    if (cur) lignes.push(cur);
    if (lignes.length <= maxLignes && lignes.every((l) => largeur(ctx, l) <= larg)) return { taille: t, lignes };
  }
  // Dernier recours : taille mini, dernière ligne tronquée
  police(ctx, tailleMin, poids);
  const lignes = [];
  let cur = "";
  for (const m of mots) {
    const essai = cur ? cur + " " + m : m;
    if (largeur(ctx, essai) <= larg || !cur) cur = essai; else { lignes.push(cur); cur = m; }
  }
  if (cur) lignes.push(cur);
  const garde = lignes.slice(0, maxLignes);
  if (lignes.length > maxLignes) garde[maxLignes - 1] += "…";
  return { taille: tailleMin, lignes: garde };
}

function rect(ctx, x, y, w, h, couleur) { ctx.fillStyle = couleur; ctx.fillRect(x, y, w, h); }

// Le double trait signature : épais clair + fin sombre à 46 %
function traits(ctx, x, y, w, clair, sombre, e1 = 12, e2 = 6) {
  rect(ctx, x, y, w, e1, clair);
  rect(ctx, x, y + e1 + 8, Math.round(w * 0.46), e2, sombre);
}

function logoRond(ctx, img, x, y, d) {
  ctx.fillStyle = C.blanc;
  ctx.beginPath(); ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2); ctx.fill();
  if (!img) return;
  const p = d * 0.08, z = d - 2 * p, r = Math.min(z / img.width, z / img.height);
  const w = img.width * r, h = img.height * r;
  ctx.drawImage(img, x + (d - w) / 2, y + (d - h) / 2, w, h);
}

function nouvelleToile(fond) {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  rect(ctx, 0, 0, W, H, fond);
  return { c, ctx };
}

const score = (l) => `${l.pour} – ${l.contre}`;
const suffixe = (n) => (n === 1 ? "ER" : "E");

function piedDePage(ctx, gauche, droite, cg, cd, y = H - 152) {
  texte(ctx, gauche, 96, y, { taille: 32, poids: 800, espace: 2, couleur: cg });
  texte(ctx, droite, W - 96, y, { taille: 32, poids: 700, espace: 1, couleur: cd, align: "right" });
}

// Grand chiffre de place + suffixe, renvoie la largeur totale
function grandePlace(ctx, place, x, haut, taille, couleur, align = "left") {
  const n = String(place ?? "–");
  police(ctx, taille, 800);
  const wN = largeur(ctx, n);
  police(ctx, taille * 0.29, 800);
  const wS = largeur(ctx, suffixe(place));
  const total = wN + 14 + wS;
  const x0 = align === "center" ? x - total / 2 : x;
  texte(ctx, n, x0, haut, { taille, couleur });
  texte(ctx, suffixe(place), x0 + wN + 14, haut, { taille: taille * 0.29, couleur });
  return { x0, wN, total };
}

// ---------- Style A : l'affiche ----------
function affiche(s, A) {
  const { c, ctx } = nouvelleToile(C.rouge);
  const X = 96, L = W - 2 * X;

  // Chiffre géant en filigrane
  police(ctx, 1100, 800);
  ctx.fillStyle = C.rougeFonce; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
  ctx.fillText(String(s.place ?? ""), W + 40, 560 + 1100 * 0.7);

  logoRond(ctx, A.logo, X, 120, 104);
  texte(ctx, A.nomTournoi.toUpperCase(), X + 132, 138, { taille: 44, espace: 2, max: L - 132 });
  texte(ctx, A.dateLongue.toUpperCase(), X + 132, 194, { taille: 32, poids: 700, espace: 3, couleur: C.rose, max: L - 132 });

  texte(ctx, "MON TOURNOI", X, 300, { taille: 36, poids: 700, espace: 6, couleur: C.rose });
  const n = couper(ctx, s.nom.toUpperCase(), 128, 72, L, 3);
  let y = 362;
  n.lignes.forEach((l) => { texte(ctx, l, X, y, { taille: n.taille }); y += n.taille * 0.9; });
  y += 34 - n.taille * 0.2;
  traits(ctx, X, y, 360, C.blanc, C.encre);
  y += 26;

  // La place : le chiffre rétrécit si le nom prend 3 lignes, pour que tout tienne
  const haut = Math.max(640, y + 60);
  const tp = Math.min(520, (1150 - 70 - haut) / 0.7), k = tp / 520;
  const P = grandePlace(ctx, s.place, X, haut, tp, C.blanc);
  const xs = X + P.wN + 22;
  texte(ctx, "PLACE", xs, haut + 210 * k, { taille: 52, espace: 2 });
  texte(ctx, `sur ${s.total} équipes`, xs, haut + 210 * k + 68, { taille: 40, poids: 700, couleur: C.rose });
  y = haut + tp * 0.7 + 70;

  // Bandeau noir
  rect(ctx, 0, y, W, 116, C.encre);
  texte(ctx, s.titre, X, y + 36, { taille: 64, espace: 3, max: L - 160 });
  ["OR", "ARGENT", "BRONZE"].forEach((k, i) => {
    const x = W - X - 34 - (2 - i) * 44, yy = y + 41;
    if (k === s.metal) rect(ctx, x - 6, yy - 6, 46, 46, C.blanc);
    rect(ctx, x, yy, 34, 34, METAL[k]);
  });
  y += 116 + 44;

  // 3 tuiles
  const tuiles = [[s.J, "MATCHS JOUÉS", C.encre], [s.V, "VICTOIRES", C.rouge], [s.pour, "POINTS MARQUÉS", C.encre]];
  const tw = (L - 36) / 3;
  tuiles.forEach(([v, l, coul], i) => {
    const x = X + i * (tw + 18);
    rect(ctx, x, y, tw, 214, C.blanc);
    texte(ctx, v, x + 28, y + 34, { taille: 132, couleur: coul, max: tw - 40 });
    texte(ctx, l, x + 28, y + 158, { taille: 34, espace: 1, couleur: C.encre, max: tw - 40 });
  });
  y += 214 + 60;

  // Parcours en 3 étapes
  const etapes = parcoursCourt(s);
  const ew = L / etapes.length;
  etapes.forEach((e, i) => {
    const x = X + i * ew;
    rect(ctx, x - 4, y + 2, 30, 30, C.blanc);
    rect(ctx, x, y + 6, 22, 22, e.couleur);
    texte(ctx, e.etape, x + 40, y, { taille: 26, poids: 700, espace: 2, couleur: C.rose, max: ew - 50 });
    texte(ctx, e.res, x + 40, y + 38, { taille: 40, max: ew - 50 });
  });

  piedDePage(ctx, A.club.toUpperCase(), A.twitch, C.rose, C.blanc);
  return [c];
}

function parcoursCourt(s) {
  const out = [];
  if (s.brassage) out.push({ etape: "BRASSAGE", res: `${ordinal(s.brassage.rang)} poule ${s.brassage.poule}`, couleur: C.encre });
  if (s.phase2) out.push({ etape: "NIVEAUX", res: `${ordinal(s.phase2.rang)} poule ${NOM_METAL[s.phase2.poule]}`, couleur: METAL[s.phase2.poule] });
  out.push({ etape: "FINAL", res: s.place ? `${ordinal(s.place, true)} place` : "—", couleur: s.place <= 3 ? METAL[s.metal] : C.encre });
  return out;
}

// ---------- Style B : la carte ----------
function carte(s, A) {
  const { c, ctx } = nouvelleToile(C.encre);
  const X = 120, L = W - 2 * X, P = 56, I = L - 2 * P;


  // Hauteur de la carte calculée après coup : on dessine dans une toile à part
  const y0 = 270;
  const parts = [];
  let y = y0 + 28 + 48;

  // Pastille + nom à gauche, place à droite
  const chip = s.phase2 ? `POULE ${NOM_METAL[s.phase2.poule].toUpperCase()}` : s.brassage ? `POULE ${s.brassage.poule}` : "TOURNOI";
  const chipCoul = s.phase2 ? METAL[s.phase2.poule] : C.rouge;
  police(ctx, 30, 800, "cond", 2);
  const cw = largeur(ctx, chip) + 30 + 36, yChip = y;
  parts.push(() => {
    rect(ctx, X + P, yChip, cw, 50, C.encre);
    rect(ctx, X + P + 18, yChip + 16, 18, 18, chipCoul);
    texte(ctx, chip, X + P + 48, yChip + 14, { taille: 30, espace: 2 });
  });
  const yNom = y + 50 + 22;
  const wPlace = 250;
  const n = couper(ctx, s.nom.toUpperCase(), 100, 60, I - wPlace - 20, 3);
  const yPlace = y;
  parts.push(() => {
    let yy = yNom;
    n.lignes.forEach((l) => { texte(ctx, l, X + P, yy, { taille: n.taille, couleur: C.encre }); yy += n.taille * 0.9; });
    const g = grandePlace(ctx, s.place, X + L - P - wPlace / 2, yPlace + 10, 210, C.rouge, "center");
    texte(ctx, `SUR ${s.total}`, X + L - P - wPlace / 2, yPlace + 10 + 210 * 0.7 + 30, { taille: 30, poids: 700, espace: 2, couleur: C.gris, align: "center" });
    void g;
  });
  y = Math.max(yNom + n.lignes.length * n.taille * 0.9 - n.taille * 0.2, yPlace + 10 + 147 + 30 + 21) + 40;

  const yTraits = y;
  parts.push(() => traits(ctx, X + P, yTraits, I, C.rouge, C.encre, 10, 5));
  y += 10 + 8 + 5 + 24;

  // 4 lignes de stats
  const stats = [
    ["Matchs joués", s.J, "", C.encre],
    ["Victoires", s.V, s.J ? `${s.pct} %` : "", C.rouge],
    ["Points marqués", s.pour, s.J ? `${Math.round(s.pour / s.J)} / match` : "", C.encre],
    ["Différence", (s.diff > 0 ? "+" : s.diff < 0 ? "−" : "") + Math.abs(s.diff), "", C.encre],
  ];
  stats.forEach(([l, v, extra, coul]) => {
    const yy = y;
    parts.push(() => {
      texte(ctx, l, X + P, yy + 34, { taille: 44, poids: 700, couleur: C.gris });
      const wv = texte(ctx, v, X + L - P, yy + 18, { taille: 84, couleur: coul, align: "right" });
      if (extra) texte(ctx, extra, X + L - P - wv - 16, yy + 46, { taille: 30, poids: 700, couleur: C.grisClair, align: "right" });
      rect(ctx, X + P, yy + 116, I, 3, C.ligne);
    });
    y += 119;
  });
  y += 36;

  // 2 tuiles
  const tuiles = [];
  if (s.belle) tuiles.push(["PLUS BELLE VICTOIRE", s.belle, C.rouge]);
  if (s.serre) tuiles.push(["LE PLUS SERRÉ", s.serre, C.encre]);
  if (tuiles.length) {
    const tw = (I - 16) / 2, yy = y;
    parts.push(() => tuiles.forEach(([t, l, coul], i) => {
      const x = X + P + i * (tw + 16);
      rect(ctx, x, yy, tw, 170, C.brume);
      rect(ctx, x, yy, 8, 170, coul);
      texte(ctx, t, x + 30, yy + 24, { taille: 26, poids: 700, espace: 2, couleur: coul === C.rouge ? C.rouge : C.gris, max: tw - 44 });
      texte(ctx, score(l), x + 30, yy + 62, { taille: 64, couleur: C.encre });
      texte(ctx, `${court(l.tour)} · vs ${l.adv}`, x + 30, yy + 132, { taille: 26, poids: 600, fam: "corps", couleur: C.gris, max: tw - 44 });
    }));
    y += 170 + 44;
  }

  // Pied de carte noir
  const yPied = y;
  parts.push(() => {
    rect(ctx, X, yPied, L, 128, C.encre);
    logoRond(ctx, A.logo, X + P, yPied + 26, 76);
    texte(ctx, A.club.toUpperCase(), X + P + 96, yPied + 52, { taille: 34, espace: 2, max: L - 2 * P - 96 - 200 });
    texte(ctx, A.hashtag, X + L - P, yPied + 54, { taille: 30, poids: 700, couleur: C.roseVif, align: "right" });
  });
  y += 128;

  // La carte blanche, puis son contenu par-dessus, centrée dans la hauteur
  const dy = Math.max(0, Math.round((H - (y - y0)) / 2 - 30 - y0));
  texte(ctx, `${A.nomTournoi} · ${A.date}`.toUpperCase(), X, 200 + dy, { taille: 36, poids: 700, espace: 6, couleur: C.roseVif, max: L });
  ctx.save();
  ctx.translate(0, dy);
  rect(ctx, X, y0, L, y - y0, C.blanc);
  rect(ctx, X, y0, L, 28, METAL[s.metal]);
  parts.forEach((f) => f());
  ctx.restore();

  texte(ctx, `REVIVRE LE TOURNOI · ${A.twitch.toUpperCase()}`, W / 2, Math.max(y + dy + 60, H - 182), { taille: 32, poids: 700, espace: 2, couleur: C.grisClair, align: "center", max: L });
  return [c];
}

const court = (t) => String(t).replace(/^Poule /, "Poule ").replace(/^Quart \d$/, "Quart").replace(/^Demie \d$/, "Demie");

// ---------- Style C : wrapped en 3 images ----------
function barres(ctx, n, clair, sombre) {
  const bw = (W - 192 - 24) / 3;
  for (let i = 0; i < 3; i++) rect(ctx, 96 + i * (bw + 12), 150, bw, 10, i < n ? clair : sombre);
}

function enTeteWrapped(ctx, s, n, couleurSur, titre, couleurTitre) {
  texte(ctx, `${s.nom.toUpperCase()} · ${n}/3`, 96, 230, { taille: 40, poids: 700, espace: 6, couleur: couleurSur, max: W - 192 });
  let y = 300;
  titre.forEach((l) => { texte(ctx, l, 96, y, { taille: 116, couleur: couleurTitre }); y += 104; });
  return y;
}

function wrapped1(s, A) {
  const { c, ctx } = nouvelleToile(C.encre);
  barres(ctx, 1, C.blanc, "#3A3A42");
  enTeteWrapped(ctx, s, 1, C.roseVif, ["TA JOURNÉE", "EN CHIFFRES"], C.blanc);

  const pl = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;
  const lignes = [
    [s.J, s.J > 1 ? "matchs joués" : "match joué", "Du brassage à ton dernier match", C.blanc],
    [s.V, s.V > 1 ? "victoires" : "victoire", s.D ? `${pl(s.D, "match")} perdu${s.D > 1 ? "s" : ""}, pas un de plus` : "Aucune défaite. Rien à dire.", C.rouge],
    [s.pour, "points marqués", `Pour ${s.contre} encaissés : ${s.diff >= 0 ? "+" : "−"}${Math.abs(s.diff)}`, C.blanc],
  ];
  let y = 600;
  lignes.forEach(([n, l, sous, coul]) => {
    const wn = texte(ctx, n, 96, y + 26, { taille: 250, couleur: coul });
    const x = 96 + Math.max(330, wn + 32);
    texte(ctx, l, x, y + 110, { taille: 60, max: W - 96 - x });
    texte(ctx, sous, x, y + 186, { taille: 32, poids: 600, fam: "corps", couleur: "#B9B6B1", max: W - 96 - x });
    rect(ctx, 96, y + 252, W - 192, 4, "#2A2A31");
    y += 256;
  });

  // Encadré rouge
  const phrase = s.secParPoint
    ? ["Un point toutes les", `${s.secParPoint} secondes de jeu.`]
    : s.serie > 1 ? ["Meilleure série :", `${s.serie} victoires d'affilée.`] : ["Merci pour", "cette journée !"];
  y = Math.max(y + 60, 1390);
  rect(ctx, 96, y, W - 192, 180, C.rouge);
  // Icône chrono
  ctx.strokeStyle = C.blanc; ctx.lineWidth = 5; ctx.lineCap = "square";
  ctx.beginPath(); ctx.arc(96 + 36 + 32, y + 98, 26, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(96 + 68, y + 98); ctx.lineTo(96 + 68, y + 80); ctx.moveTo(96 + 58, y + 58); ctx.lineTo(96 + 78, y + 58); ctx.stroke();
  texte(ctx, phrase[0], 96 + 128, y + 36, { taille: 52, max: W - 192 - 160 });
  texte(ctx, phrase[1], 96 + 128, y + 96, { taille: 52, max: W - 192 - 160 });

  piedDePage(ctx, A.nomTournoi.toUpperCase(), A.date, C.blanc, "#8A8A92", H - 152);
  return c;
}

function wrapped2(s, A) {
  const { c, ctx } = nouvelleToile(C.brume);
  barres(ctx, 2, C.encre, "#DAD6D0");
  enTeteWrapped(ctx, s, 2, C.rouge, ["TON", "PARCOURS"], C.encre);

  const etapes = [];
  if (s.brassage) etapes.push({ etape: `BRASSAGE · POULE ${s.brassage.poule}`, res: ordinal(s.brassage.rang), badge: `→ ${NOM_METAL[s.brassage.dest].toUpperCase()}`, couleur: METAL[s.brassage.dest] });
  if (s.phase2) etapes.push({
    etape: `POULE ${NOM_METAL[s.phase2.poule].toUpperCase()}`, res: ordinal(s.phase2.rang),
    badge: s.phase2.seed ? `TÊTE DE SÉRIE ${s.phase2.seed}` : "MATCH DE CLASSEMENT", couleur: s.phase2.seed ? C.encre : METAL[s.phase2.poule],
  });
  etapes.push({
    etape: "PHASE FINALE", res: s.place ? `${ordinal(s.place, true)}` : "—",
    badge: s.place && s.place <= 3 ? "PODIUM" : s.place && s.place <= 8 ? "TOP 8" : `SUR ${s.total}`,
    couleur: s.place && s.place <= 3 ? METAL[s.metal] : C.rouge, matchs: s.finale.slice(-3),
  });

  let y = 580;
  const yDebut = y + 47;
  const blocs = [];
  etapes.forEach((e, i) => {
    const yy = y;
    blocs.push(() => {
      rect(ctx, 96, yy, 94, 94, C.encre);
      texte(ctx, String(i + 1), 96 + 47, yy + 28, { taille: 56, couleur: C.blanc, align: "center" });
      const x = 96 + 94 + 36;
      texte(ctx, e.etape, x, yy + 4, { taille: 34, poids: 700, espace: 4, couleur: C.gris, max: W - 96 - x });
      const wr = texte(ctx, e.res, x, yy + 56, { taille: 88, couleur: C.encre });
      police(ctx, 34, 800);
      const bw = largeur(ctx, e.badge) + 18 + 22 + 36;
      const bx = x + wr + 24;
      rect(ctx, bx, yy + 60, bw, 60, C.blanc);
      rect(ctx, bx + 18, yy + 79, 22, 22, e.couleur);
      texte(ctx, e.badge, bx + 52, yy + 78, { taille: 34, couleur: C.encre });
    });
    y += 56 + 88 * 0.7 + 50;
    if (e.matchs?.length) {
      const x = 96 + 94 + 36, w = W - 96 - x, y1 = y;
      blocs.push(() => {
        rect(ctx, x, y1, w, e.matchs.length * 84, C.blanc);
        e.matchs.forEach((l, k) => {
          const ly = y1 + k * 84;
          rect(ctx, x, ly, 10, 84, l.gagne ? C.rouge : C.blanc);
          texte(ctx, court(l.tour).toUpperCase(), x + 32, ly + 30, { taille: 30, couleur: C.rouge, max: 170 });
          texte(ctx, `vs ${l.adv}`, x + 210, ly + 28, { taille: 30, poids: 600, fam: "corps", couleur: C.encre, max: w - 210 - 170 });
          texte(ctx, score(l), x + w - 24, ly + 22, { taille: 46, couleur: l.gagne ? C.encre : C.grisClair, align: "right" });
          if (k < e.matchs.length - 1) rect(ctx, x, ly + 82, w, 3, C.brume);
        });
      });
      y += e.matchs.length * 84;
    }
    y += 50;
  });
  // Fil rouge qui relie les étapes (dessous)
  rect(ctx, 96 + 43, yDebut, 8, Math.max(0, y - 50 - 120 - yDebut), C.rouge);
  blocs.forEach((f) => f());

  piedDePage(ctx, A.nomTournoi.toUpperCase(), A.date, C.encre, C.gris);
  return c;
}

function wrapped3(s, A) {
  const { c, ctx } = nouvelleToile(C.rouge);
  barres(ctx, 3, C.blanc, C.blanc);
  enTeteWrapped(ctx, s, 3, C.rose, ["ET À LA FIN…"], C.blanc);

  grandePlace(ctx, s.place, W / 2, 500, 640, C.blanc, "center");
  texte(ctx, `SUR ${s.total} ÉQUIPES`, W / 2, 500 + 640 * 0.7 + 50, { taille: 64, espace: 6, align: "center" });
  rect(ctx, W / 2 - 180, 500 + 448 + 140, 360, 12, C.blanc);
  rect(ctx, W / 2 - 180, 500 + 448 + 160, 166, 6, C.encre);

  const y = 1230, tw = (W - 192 - 18) / 2;
  const t1 = s.belle ? ["PLUS BELLE VICTOIRE", score(s.belle), court(s.belle.tour)] : s.serre ? ["LE PLUS SERRÉ", score(s.serre), court(s.serre.tour)] : ["MATCHS JOUÉS", String(s.J), ""];
  rect(ctx, 96, y, tw, 260, C.encre);
  texte(ctx, t1[0], 96 + 32, y + 30, { taille: 30, poids: 700, espace: 3, couleur: C.roseVif, max: tw - 60 });
  texte(ctx, t1[1], 96 + 32, y + 84, { taille: 96, couleur: C.blanc, max: tw - 60 });
  texte(ctx, t1[2], 96 + 32, y + 198, { taille: 30, poids: 600, fam: "corps", couleur: "#DAD7D2", max: tw - 60 });
  const x2 = 96 + tw + 18;
  rect(ctx, x2, y, tw, 260, C.blanc);
  texte(ctx, "RATIO DE VICTOIRES", x2 + 32, y + 30, { taille: 30, poids: 700, espace: 3, couleur: C.rouge, max: tw - 60 });
  texte(ctx, `${s.pct} %`, x2 + 32, y + 84, { taille: 96, couleur: C.encre });
  texte(ctx, `${s.V} sur ${s.J} match${s.J > 1 ? "s" : ""}`, x2 + 32, y + 198, { taille: 30, poids: 600, fam: "corps", couleur: C.gris, max: tw - 60 });

  logoRond(ctx, A.logo, 96, 1560, 96);
  texte(ctx, "Merci d'avoir joué !", 96 + 122, 1574, { taille: 48 });
  texte(ctx, `${A.nomTournoi} · ${A.date}`.toUpperCase(), 96 + 122, 1630, { taille: 32, poids: 700, espace: 2, couleur: C.rose, max: W - 96 - 218 });
  return c;
}

// ---------------------------------------------------------------
// Point d'entrée : renvoie une liste de <canvas>
// A = { logo (Image), nomTournoi, date, dateLongue, club, twitch, hashtag }
// ---------------------------------------------------------------
export function dessiner(style, s, A) {
  if (style === "carte") return carte(s, A);
  if (style === "wrapped") return [wrapped1(s, A), wrapped2(s, A), wrapped3(s, A)];
  return affiche(s, A);
}

export function enFichier(canvas, nom) {
  return new Promise((ok) => canvas.toBlob((b) => ok(new File([b], nom, { type: "image/png" })), "image/png"));
}

// "11/11/2026" → "11 novembre 2026"
export function dateLongue(d) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d || "");
  if (!m) return d || "";
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${Number(m[1])} ${mois[Number(m[2]) - 1]} ${m[3]}`;
}

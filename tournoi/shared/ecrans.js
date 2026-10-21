// =============================================================
//  ecrans.js — le contenu des écrans plein cadre du tournoi
//  poules, arbre, pause, intermatch, neutre
//  Utilisé par overlay.html (tout-en-un) et scene.html
// =============================================================
import { CFG, esc, fmtChrono, qrSvg, nomEquipe } from "./outils.js";
import * as T from "./moteur.js";

export const ECRANS = ["match", "intermatch", "poules", "arbre", "pause"];
export const NOMS_ECRANS = { match: "Match", intermatch: "Inter-match", poules: "Poules", arbre: "Arbre", pause: "Pause", neutre: "Plateau" };

let eqs = [], ms = [], rots = [], maintenant = () => Date.now();

// Renvoie le HTML d'un écran. ctx = { eqs, ms, rots, maintenant }
export function htmlEcran(vue, ctx) {
  ({ eqs, ms, rots } = ctx);
  maintenant = ctx.maintenant;
  if (vue === "arbre") return arbre();
  if (vue === "pause") return pause();
  if (vue === "intermatch") return interMatch();
  if (vue === "neutre") return neutre();
  return poules();
}

const nom = (id) => nomEquipe(eqs, id);
const nomOuAttente = (m, s) => nom(m[s]) || T.etiquetteAttente(m, s, ms);
const entete = (titre, droite) => `<div class="entete-scene">
  <div><div class="sur">${esc(CFG.nom)} · ${esc(CFG.sousTitre || "")}</div><h1>${titre}</h1></div>
  <div class="droite"><div class="traits"></div><div>${droite}</div></div></div>`;
let qrCache = "";
const qr = () => {
  if (!qrCache) qrCache = qrSvg(CFG.siteUrl);
  const url = CFG.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `<div class="qr"><div class="code">${qrCache}</div><div><b>Suis l'arbre en direct</b><span>${esc(url)}</span></div></div>`;
};


// ---------------- Classement des poules ----------------
function poules() {
  const ps = T.poulesDe(eqs);
  if (!ps.length) return entete("PHASE DE POULES", "") + `<div class="message">Les poules arrivent bientôt.</div>`;
  const q = CFG.format.qualifiesParPoule;
  const pm = ms.filter((m) => m.phase === "poule");
  const joues = pm.filter((m) => m.statut === T.STATUT.TERMINE).length;
  const cols = Math.min(ps.length, 4), lignesGrille = Math.ceil(ps.length / 4);
  const maxEq = Math.max(...ps.map((p) => eqs.filter((e) => e.poule === p).length));
  const hDispo = (670 - 32 * (lignesGrille - 1)) / lignesGrille - 70;
  const h = Math.max(40, Math.min(100, Math.floor(hDispo / maxEq)));
  const fs = Math.round(Math.min(cols <= 2 ? 40 : 34, h * (cols <= 2 ? 0.5 : 0.42)));
  const avecNuls = pm.some((m) => m.statut === T.STATUT.TERMINE && T.resultat(m) === "nul");
  const cartes = ps.map((p) => {
    const cl = T.classement(eqs, ms, p, CFG);
    return `<div class="poule"><div class="tete"><b>POULE ${p}</b><span>${avecNuls ? "V · N · D · ±" : "V · D · ±"}</span></div>` +
      cl.map((l) => `<div class="rg ${l.rang <= q ? "q" : ""}" style="height:${h}px">
        <div class="b"></div><div class="r" style="font-size:${fs + 2}px">${l.rang}</div>
        <div class="n" style="font-size:${fs}px">${esc(l.nom)}</div>
        <div class="s" style="font-size:${fs - 2}px">${l.V} · ${avecNuls ? l.N + " · " : ""}${l.D} · ${l.diff > 0 ? "+" : l.diff < 0 ? "−" : ""}${Math.abs(l.diff)}</div></div>`).join("") + `</div>`;
  }).join("");
  const egal = CFG.format.egalitePoules === "point-en-or" ? "Égalité : point en or" : `Victoire ${CFG.format.points.victoire} pts · nul ${CFG.format.points.nul} pt`;
  return entete("PHASE DE POULES", `Après ${joues} match${joues > 1 ? "s" : ""} sur ${pm.length} · en direct`) +
    `<div id="grille" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${cartes}</div>
     <div class="legende"><div><i></i>Qualifiés pour la phase finale</div><div>${esc(egal)}</div></div>`;
}

// ---------------- Arbre final ----------------
function arbre() {
  const fin = ms.filter((m) => m.phase === "finale");
  if (!fin.length) return entete("PHASE FINALE", "") + `<div class="message">L'arbre s'affiche à la fin des poules.</div>`;
  const N = fin[0].nbTours, c0 = fin.filter((m) => m.tour === 0).length;
  const X0 = 96, Y0 = 300, H = 740, GAP = 90, WCH = 258;
  const W = Math.floor((1728 - WCH - GAP * N) / N);
  const rowH = Math.max(34, Math.min(64, Math.floor((H / c0 - 20) / 2)));
  const fs = Math.round(rowH * 0.5);
  const colX = (t) => X0 + t * (W + GAP);
  const centre = (t, i) => Y0 + (H / (c0 / 2 ** t)) * (i + 0.5);
  let out = entete("PHASE FINALE", "Le gagnant avance tout seul");

  for (let t = 0; t < N; t++) {
    const m0 = fin.find((m) => m.tour === t);
    const pts = m0?.mode === "points" ? `<small>en ${m0.cible} pts</small>` : "";
    out += `<div class="col-titre" style="left:${colX(t)}px;width:${W}px">${esc(T.nomTourPluriel(t, N))}${pts}</div>`;
  }
  const trait = (x, y, w, h) => `<div class="trait" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`;
  for (let t = 0; t < N - 1; t++) {
    const nb = c0 / 2 ** (t + 1);
    for (let i = 0; i < nb; i++) {
      const a = Math.round(centre(t, 2 * i)), b = Math.round(centre(t, 2 * i + 1)), c = Math.round(centre(t + 1, i));
      const xr = colX(t) + W, xm = xr + GAP / 2;
      out += trait(xr, a - 1, GAP / 2, 3) + trait(xr, b - 1, GAP / 2, 3) + trait(xm - 1, a, 3, b - a + 2) + trait(xm, c - 1, GAP / 2, 3);
    }
  }
  const cF = Math.round(centre(N - 1, 0));
  out += trait(colX(N - 1) + W, cF - 1, GAP, 3);

  const maintenant = maintenant();
  for (const m of fin) {
    const top = Math.round(centre(m.tour, m.index) - rowH);
    const r = T.resultat(m);
    const ligne = (s) => {
      const id = m[s];
      if (m.exempt && !id) return `<div class="rg att" style="height:${rowH}px"><div class="b"></div><div class="n" style="font-size:${fs}px">Exempt</div></div>`;
      const cls = !id ? "att" : r === s ? "g" : r && r !== s ? "p" : "";
      const sc = m.statut === T.STATUT.TERMINE && !m.exempt ? m["score" + s] : "";
      return `<div class="rg ${cls}" style="height:${rowH}px"><div class="b"></div>
        <div class="n" style="font-size:${fs}px">${esc(nomOuAttente(m, s))}</div>
        <div class="s" style="font-size:${fs + 2}px">${sc}</div></div>`;
    };
    let chip = "";
    if (m.statut === T.STATUT.ENCOURS) {
      const rot = rots.find((x) => x.num === m.rotation);
      chip = `<div class="live">EN COURS · ${T.texteChrono(rot, maintenant, fmtChrono)}</div>`;
    }
    out += `<div class="m" style="left:${colX(m.tour)}px;top:${top}px;width:${W}px">${ligne("A")}${ligne("B")}${chip}</div>`;
  }
  const champ = T.vainqueurTournoi(ms);
  out += `<div class="champion" style="left:${colX(N - 1) + W + GAP}px;top:${cF - 110}px;width:${WCH}px;height:220px">
    <span>VAINQUEUR</span><b>${esc(champ ? nom(champ) : "À venir")}</b></div>`;
  return out;
}

// ---------------- Listes de matchs ----------------
function lignesAVenir(liste) {
  return liste.map((m) => `<div class="ligne-m">
      <div class="ph">${esc(T.nomPhase(m, ms))}</div>
      <div class="eqs"><div><span class="nm">${esc(nomOuAttente(m, "A"))}</span></div><div><span class="nm"><span class="vs">vs </span>${esc(nomOuAttente(m, "B"))}</span></div></div>
    </div>`).join("");
}

function lignesResultats(liste) {
  return liste.map((m) => {
    const r = T.resultat(m);
    const cote = (s) => `<div class="${r === s ? "g" : r && r !== "nul" ? "p" : ""}"><span class="nm">${esc(nom(m[s]))}</span><span class="sc">${m["score" + s]}</span></div>`;
    return `<div class="ligne-m"><div class="ph">${esc(T.nomPhase(m, ms))}</div><div class="eqs">${cote("A")}${cote("B")}</div></div>`;
  }).join("");
}

function carteAVenir() {
  const cur = T.rotationEnCours(rots), suiv = T.prochaineRotation(rots);
  const rot = suiv || cur;
  const liste = rot ? T.matchsDeRotation(ms, rot.num) : [];
  const info = rot ? (rot.mode === "points" ? `ROTATION ${rot.num} · ${rot.cible} PTS` : `ROTATION ${rot.num}`) : "";
  return `<div class="liste"><div class="tete">À SUIVRE${info ? `<small>${info}</small>` : ""}</div>
    ${liste.length ? lignesAVenir(liste) : `<div class="vide-p">${T.vainqueurTournoi(ms) ? "Le tournoi est terminé." : "Programme à venir."}</div>`}</div>`;
}

// ---------------- Pause ----------------
function pause() {
  return `<div id="pause">
    <div class="gauche">
      <div>
        <div class="sur">${esc(CFG.nom)}</div>
        <h1>PAUSE</h1>
        <div class="traits"></div>
        <div class="phrase">On revient dans quelques minutes.</div>
      </div>
      ${qr()}
    </div>
    <div class="droite">${carteAVenir()}</div>
  </div>`;
}

// ---------------- Inter-match ----------------
function interMatch() {
  const finies = rots.filter((r) => r.statut === T.STATUT.TERMINE);
  const der = finies[finies.length - 1];
  const res = der ? T.matchsDeRotation(ms, der.num).filter((m) => m.statut === T.STATUT.TERMINE && !m.exempt) : [];
  const carteRes = `<div class="liste"><div class="tete encre">RÉSULTATS${der ? `<small>ROTATION ${der.num}</small>` : ""}</div>
    ${res.length ? lignesResultats(res) : `<div class="vide-p">Premiers résultats après la rotation 1.</div>`}</div>`;
  const champ = T.vainqueurTournoi(ms);
  const droite = champ ? `Vainqueur : ${esc(nom(champ))}` : T.poulesTerminees(ms) || ms.some((m) => m.phase === "finale") ? "Phase finale" : "Phase de poules";
  const suiv = T.prochaineRotation(rots) || T.rotationEnCours(rots);
  const n = Math.max(res.length, suiv ? T.matchsDeRotation(ms, suiv.num).length : 0, 1);
  const hl = Math.max(84, Math.min(128, Math.floor(460 / n)));
  return entete("ENTRE DEUX MATCHS", droite) +
    `<div id="inter" style="--hl:${hl}px">${carteRes}${carteAVenir()}</div>
     <div id="inter-bas">${qr()}</div>`;
}

// ---------------- Neutre : pour se filmer ----------------
function neutre() {
  if (!qrCache) qrCache = qrSvg(CFG.siteUrl);
  const url = CFG.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const now = new Date(maintenant());
  const heure = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return `<div class="puce hg">
      ${CFG.logo ? `<div class="logo"><img src="${esc(CFG.logo)}" alt="Ramonville Volley"></div>` : ""}
      <div class="nom">${esc(CFG.nom)}<small>${esc(CFG.lieu || "")}</small></div>
    </div>
    <div class="puce hd"><div class="heure">${heure}</div><div class="date">${esc(date)}</div></div>
    <div class="puce bg"><div class="qrmini">${qrCache}</div><div class="txt"><b>Suis l'arbre en direct</b><span>${esc(url)}</span></div></div>
    <div class="puce bd"><div class="nom" style="font-size:26px">En direct</div><div class="barre"></div><div class="tw">${esc(CFG.twitch)}</div></div>`;
}

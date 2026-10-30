// =============================================================
//  ecrans.js — le contenu des écrans plein cadre du tournoi
//  poules, arbre, classement, pause, intermatch, neutre
//  Utilisé par overlay.html (tout-en-un) et scene.html
// =============================================================
import { CFG, esc, fmtChrono, qrSvg, nomEquipe } from "./outils.js";
import * as T from "./moteur.js";

export const ECRANS = ["match", "intermatch", "poules", "arbre", "classement", "pause"];
export const NOMS_ECRANS = { match: "Match", intermatch: "Inter-match", poules: "Poules", arbre: "Arbre", classement: "Classement", pause: "Pause", neutre: "Plateau" };

let eqs = [], ms = [], rots = [], horloge = () => Date.now();

// Renvoie le HTML d'un écran. ctx = { eqs, ms, rots, maintenant }
export function htmlEcran(vue, ctx) {
  ({ eqs, ms, rots } = ctx);
  horloge = ctx.maintenant;
  if (vue === "arbre") return arbre();
  if (vue === "classement") return classementFinal();
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
const signe = (d) => (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d);

// « ROTATION 5/15 » ou « ROTATION 2/7 · 21 PTS »
function infoRot(r) {
  if (!r) return "";
  const l = rots.filter((x) => x.phase === r.phase);
  const i = l.findIndex((x) => x.id === r.id) + 1;
  return `ROTATION ${i}/${l.length}${r.mode === "points" ? ` · ${r.cible} PTS` : ""}`;
}

// ---------------- Classement des poules ----------------
const BARRE_BRASSAGE = (rang) => (rang <= 2 ? "or" : rang <= 4 ? "argent" : "bronze");

function poules() {
  const courante = T.phaseCourante(ms);
  const phase = courante === "finale" ? "phase2" : courante || "brassage";
  const listePoules = T.POULES[phase];
  const deLaPhase = ms.filter((m) => m.phase === phase);
  const joues = deLaPhase.filter((m) => m.statut === T.STATUT.TERMINE).length;
  if (!T.membresPoule(ms, phase, listePoules[0], eqs).length) {
    return entete("BRASSAGE", "") + `<div class="message">Les poules arrivent bientôt.</div>`;
  }
  const h = 96, fs = 34;
  const cartes = listePoules.map((p) => {
    const cl = T.classement(ms, phase, p, eqs);
    return `<div class="poule"><div class="tete t-${p.toLowerCase()}"><b>${esc(T.NOMS_POULES[p].toUpperCase())}</b><span>V · D · ±</span></div>` +
      cl.map((l) => {
        const barre = phase === "brassage" ? BARRE_BRASSAGE(l.rang)
          : p === "OR" || (p === "ARGENT" && l.rang <= 2) ? "q" : "";
        return `<div class="rg ${barre}" style="height:${h}px">
          <div class="b"></div><div class="r" style="font-size:${fs + 2}px">${l.rang}</div>
          <div class="n" style="font-size:${fs}px">${esc(l.nom)}</div>
          <div class="s" style="font-size:${fs - 2}px">${l.V} · ${l.D} · ${signe(l.diff)}</div></div>`;
      }).join("") + `</div>`;
  }).join("");
  const legende = phase === "brassage"
    ? `<div><i class="or"></i>1er-2e → Poule Or</div><div><i class="argent"></i>3e-4e → Poule Argent</div><div><i class="bronze"></i>5e-6e → Poule Bronze</div>`
    : `<div><i></i>Quarts de finale : les 6 de la poule Or + les 2 premiers de la poule Argent</div>`;
  return entete(phase === "brassage" ? "BRASSAGE" : "PHASE 2", `Après ${joues} match${joues > 1 ? "s" : ""} sur ${deLaPhase.length} · en direct`) +
    `<div id="grille" style="grid-template-columns:repeat(3,minmax(0,1fr))">${cartes}</div>
     <div class="legende">${legende}</div>`;
}

// ---------------- Arbre final ----------------
function boiteMatch(m, x, y, w, rowH, avecSeed) {
  if (!m) return "";
  const fs = Math.round(rowH * 0.5);
  const r = T.resultat(m);
  const ligne = (s) => {
    const id = m[s];
    const cls = !id ? "att" : r === s ? "g" : r ? "p" : "";
    const sc = m.statut === T.STATUT.TERMINE ? m["score" + s] : "";
    const seed = avecSeed && m["seed" + s] ? `<span class="seed">${m["seed" + s]}</span>` : "";
    return `<div class="rg ${cls}" style="height:${rowH}px"><div class="b"></div>${seed}
      <div class="n" style="font-size:${fs}px">${esc(nomOuAttente(m, s))}</div>
      <div class="s" style="font-size:${fs + 2}px">${sc}</div></div>`;
  };
  const chip = m.statut === T.STATUT.ENCOURS ? `<div class="live">EN COURS · ${m.cible} PTS</div>` : "";
  return `<div class="m" style="left:${x}px;top:${y}px;width:${w}px">${ligne("A")}${ligne("B")}${chip}</div>`;
}

function arbre() {
  const fin = ms.filter((m) => m.phase === "finale");
  if (!fin.length) return entete("PHASE FINALE", "") + `<div class="message">L'arbre s'affiche à la fin de la phase 2.</div>`;
  const get = (c) => fin.find((m) => m.code === c);
  const X = [96, 586, 1076], W = 400, GAP = 90, rowH = 64;
  const cQ = [387, 562, 737, 912], cD = [475, 825], cF = 650;
  const trait = (x, y, w, h) => `<div class="trait" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`;
  const pts = (c) => `<small>${get(c)?.cible || ""} pts</small>`;
  let out = entete("PHASE FINALE", "Le gagnant avance tout seul");
  out += `<div class="col-titre" style="left:${X[0]}px;width:${W}px">Quarts${pts("Q1")}</div>`;
  out += `<div class="col-titre" style="left:${X[1]}px;width:${W}px">Demies${pts("D1")}</div>`;
  out += `<div class="col-titre" style="left:${X[2]}px;width:${W}px">Finale${pts("F12")}</div>`;
  // Traits quarts → demies → finale → vainqueur
  [[0, 1, 0], [2, 3, 1]].forEach(([a, b, d]) => {
    const xr = X[0] + W, xm = xr + GAP / 2;
    out += trait(xr, cQ[a] - 1, GAP / 2, 3) + trait(xr, cQ[b] - 1, GAP / 2, 3) + trait(xm - 1, cQ[a], 3, cQ[b] - cQ[a] + 2) + trait(xm, cD[d] - 1, GAP / 2, 3);
  });
  {
    const xr = X[1] + W, xm = xr + GAP / 2;
    out += trait(xr, cD[0] - 1, GAP / 2, 3) + trait(xr, cD[1] - 1, GAP / 2, 3) + trait(xm - 1, cD[0], 3, cD[1] - cD[0] + 2) + trait(xm, cF - 1, GAP / 2, 3);
  }
  out += trait(X[2] + W, cF - 1, GAP, 3);
  ["Q1", "Q2", "Q3", "Q4"].forEach((c, i) => (out += boiteMatch(get(c), X[0], cQ[i] - rowH, W, rowH, true)));
  ["D1", "D2"].forEach((c, i) => (out += boiteMatch(get(c), X[1], cD[i] - rowH, W, rowH)));
  out += boiteMatch(get("F12"), X[2], cF - rowH, W, rowH);
  out += `<div class="col-titre" style="left:${X[2]}px;top:806px;width:${W}px">Places 3-4${pts("F34")}</div>`;
  out += boiteMatch(get("F34"), X[2], 852, W, 56);
  const champ = T.vainqueurTournoi(ms);
  out += `<div class="champion" style="left:${X[2] + W + GAP}px;top:${cF - 110}px;width:258px;height:220px">
    <span>VAINQUEUR</span><b>${esc(champ ? nom(champ) : "À venir")}</b></div>`;
  return out;
}

// ---------------- Classement final et matchs de classement ----------------
const CODES_CLASSEMENT = ["D3", "D4", "F34", "F56", "F78", "P910", "P1112", "P1314", "P1516", "P1718"];

function classementFinal() {
  const fin = ms.filter((m) => m.phase === "finale");
  if (!fin.length) return entete("CLASSEMENT", "") + `<div class="message">Le classement final s'affiche pendant la phase finale.</div>`;
  const lignes = CODES_CLASSEMENT.map((c) => fin.find((m) => m.code === c)).filter(Boolean).map((m) => {
    const r = T.resultat(m);
    const cote = (s) => `<span class="nm ${r === s ? "g" : r ? "p" : ""}">${esc(nomOuAttente(m, s))}</span>`;
    const milieu = m.statut === T.STATUT.TERMINE ? `<span class="sc">${m.scoreA} – ${m.scoreB}</span>`
      : m.statut === T.STATUT.ENCOURS ? `<span class="sc live-t">EN COURS</span>` : `<span class="sc vs">vs</span>`;
    return `<div class="cl-m"><span class="ph">${esc(m.nom)}</span>${cote("A")}${milieu}${cote("B")}</div>`;
  }).join("");
  const places = T.classementFinal(ms);
  const colonne = (de, a) => places.filter((x) => x.place >= de && x.place <= a).map((x) =>
    `<div class="cl-p ${x.place <= 3 ? "podium" : ""}"><span class="pl">${x.place}</span><span class="nm ${x.id ? "" : "vide"}">${esc(x.id ? nom(x.id) : "—")}</span></div>`).join("");
  const champ = T.vainqueurTournoi(ms);
  return entete("CLASSEMENT", champ ? `Vainqueur : ${esc(nom(champ))}` : "Mis à jour en direct") +
    `<div id="classement">
      <div class="liste"><div class="tete encre">MATCHS DE CLASSEMENT</div>${lignes}</div>
      <div class="liste"><div class="tete">CLASSEMENT FINAL</div><div class="cl-cols"><div>${colonne(1, 9)}</div><div>${colonne(10, 18)}</div></div></div>
    </div>`;
}

// ---------------- Listes de matchs ----------------
function lignesAVenir(liste) {
  return liste.map((m) => `<div class="ligne-m">
      <div class="ph">${esc(T.nomPhase(m))}</div>
      <div class="eqs"><div><span class="nm">${esc(nomOuAttente(m, "A"))}</span></div><div><span class="nm"><span class="vs">vs </span>${esc(nomOuAttente(m, "B"))}</span></div></div>
    </div>`).join("");
}

function lignesResultats(liste) {
  return liste.map((m) => {
    const r = T.resultat(m);
    const cote = (s) => `<div class="${r === s ? "g" : r ? "p" : ""}"><span class="nm">${esc(nom(m[s]))}</span><span class="sc">${m["score" + s]}</span></div>`;
    return `<div class="ligne-m"><div class="ph">${esc(T.nomPhase(m))}</div><div class="eqs">${cote("A")}${cote("B")}</div></div>`;
  }).join("");
}

function carteAVenir() {
  const cur = T.rotationEnCours(rots), suiv = T.prochaineRotation(rots);
  const rot = suiv || cur;
  const liste = rot ? T.matchsDeRotation(ms, rot.num) : [];
  return `<div class="liste"><div class="tete">À SUIVRE${rot ? `<small>${infoRot(rot)}</small>` : ""}</div>
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
  const res = der ? T.matchsDeRotation(ms, der.num).filter((m) => m.statut === T.STATUT.TERMINE) : [];
  const carteRes = `<div class="liste"><div class="tete encre">RÉSULTATS${der ? `<small>${infoRot(der)}</small>` : ""}</div>
    ${res.length ? lignesResultats(res) : `<div class="vide-p">Premiers résultats après la rotation 1.</div>`}</div>`;
  const champ = T.vainqueurTournoi(ms);
  const phase = T.phaseCourante(ms);
  const droite = champ ? `Vainqueur : ${esc(nom(champ))}` : phase ? T.NOMS_PHASES[phase] : "";
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
  const now = new Date(horloge());
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

// =============================================================
//  import.js — lecture des réponses du Google Form
//  Accepte un export CSV ou des lignes copiées depuis le
//  Google Sheet (séparées par des tabulations). Chaque ligne
//  devient une fiche d'équipe à vérifier avant d'enregistrer.
// =============================================================

const sansAccents = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const norm = (s) => sansAccents(s).toLowerCase().replace(/[’'`]/g, " ").replace(/\s+/g, " ").trim();

// ---------- Texte délimité (CSV ou TSV, guillemets et retours à la ligne gérés) ----------
export function lireTableau(texte) {
  const t = String(texte ?? "").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const premiere = t.split("\n")[0] || "";
  const sep = premiere.includes("\t") ? "\t" : (premiere.split(";").length > premiere.split(",").length ? ";" : ",");
  const lignes = [];
  let ligne = [], champ = "", guill = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (guill) {
      if (c === '"') { if (t[i + 1] === '"') { champ += '"'; i++; } else guill = false; }
      else champ += c;
    } else if (c === '"' && champ === "") guill = true;
    else if (c === sep) { ligne.push(champ); champ = ""; }
    else if (c === "\n") { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ""; }
    else champ += c;
  }
  if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes.filter((l) => l.some((x) => String(x).trim() !== ""));
}

// ---------- Colonnes du formulaire ----------
const COLONNES = [
  ["horodateur", (h) => h.startsWith("horodateur") || h.startsWith("timestamp")],
  ["club",       (h) => h.startsWith("nom du club")],
  ["equipe",     (h) => h.startsWith("nom de l equipe")],
  ["categorie",  (h) => h.startsWith("categorie")],
  ["genre",      (h) => h === "equipe" || h.startsWith("genre")],
  ["niveau",     (h) => h === "niveau"],
  ["championnat",(h) => h.includes("championnat") || h.includes("poule")],
  ["couleur",    (h) => h.startsWith("couleur")],
  ["coach",      (h) => h.includes("coach") || h.includes("entraineur")],
  ["joueurs",    (h) => h.startsWith("liste des joueurs")],
  ["capitaine",  (h) => h.includes("capitaine")],
  ["liberos",    (h) => h.includes("libero")],
  ["anecdotes",  (h) => h.includes("anecdote") || h.startsWith("infos")],
  ["direct",     (h) => h.includes("diffusion") || h.includes("en direct")],
  ["replay",     (h) => h.includes("replay")]
];

export function lireReponses(texte) {
  const lignes = lireTableau(texte);
  if (!lignes.length) return { fiches: [], erreur: "Rien à importer." };
  const entetes = lignes[0].map(norm);
  const idx = {};
  for (const [cle, test] of COLONNES) {
    const i = entetes.findIndex((h, j) => test(h) && !Object.values(idx).includes(j));
    if (i >= 0) idx[cle] = i;
  }
  if (idx.joueurs == null || (idx.club == null && idx.equipe == null)) {
    return { fiches: [], erreur: "Je ne reconnais pas les colonnes : copie aussi la ligne d'en-tête du tableau (Horodateur, Nom du club…)." };
  }
  const fiches = lignes.slice(1).map((l) => {
    const v = (k) => (idx[k] == null ? "" : String(l[idx[k]] ?? "").trim());
    return ficheDepuisReponse({
      horodateur: v("horodateur"), club: v("club"), equipe: v("equipe"), categorie: v("categorie"),
      genre: v("genre"), niveau: v("niveau"), championnat: v("championnat"), couleur: v("couleur"),
      coach: v("coach"), joueurs: v("joueurs"), capitaine: v("capitaine"), liberos: v("liberos"),
      anecdotes: v("anecdotes"), direct: v("direct"), replay: v("replay")
    });
  }).filter((f) => f.club || f.equipe || f.joueurs.length);
  return { fiches, erreur: fiches.length ? null : "Aucune réponse sous la ligne d'en-tête." };
}

export function ficheDepuisReponse(r) {
  const joueurs = lireJoueurs(r.joueurs);
  const { flocages, reste } = lireFlocages(r.anecdotes);
  const cap = (String(r.capitaine).match(/\d+/) || [])[0];
  const libs = (String(r.liberos).match(/\d+/g) || []);
  for (const j of joueurs) {
    if (flocages[j.num]) j.flocage = flocages[j.num];
    if (cap && j.num === cap) j.capitaine = true;
    if (libs.includes(j.num) || j.poste === "Libéro") { j.libero = true; if (!j.poste) j.poste = "Libéro"; }
  }
  const couleur = devinerCouleur(r.couleur);
  const nomAffiche = nomCourtClub(r.club || r.equipe);
  return {
    source: r.horodateur || "",
    club: r.club || "",
    nomAffiche,
    equipe: r.equipe || "",
    court: abreviation(r.club || r.equipe),
    categorie: r.categorie || "",
    genre: r.genre || "",
    niveau: r.niveau || "",
    championnat: r.championnat || "",
    couleurTexte: r.couleur || "",
    couleur: couleur || "#6B6258",
    couleurDevinee: !!couleur,
    logo: "",
    coach: r.coach || "",
    joueurs,
    anecdotes: reste,
    montrerFlocage: Object.keys(flocages).length > 0,
    direct: /^oui/i.test(r.direct) ? "oui" : (/^non/i.test(r.direct) ? "non" : ""),
    replay: /non r[ée]pertori/i.test(r.replay) ? "non-repertorie" : (/pas de replay/i.test(r.replay) ? "aucun" : (/public/i.test(r.replay) ? "public" : ""))
  };
}

// ---------- Joueurs ----------
const POSTES = [
  [/^(passeu(r|se)|passe|pass)$/, "Passeur"],
  [/^(pointu|pointue|opposite|oppose|opposee?)$/, "Pointu"],
  [/^(central|centrale|centre|contreur)$/, "Central"],
  [/^(r4|ra|recep|receptionneu(r|se)( attaquant(e)?)?|receptionneur-attaquant|ailier|aile|attaquant|attaquante|recep attaque)$/, "Réceptionneur-attaquant"],
  [/^(libero|lib)$/, "Libéro"],
  [/^(polyvalent|polyvalente|hybride|joker)$/, "Polyvalent"]
];
export function posteNormal(txt) {
  const n = norm(txt).replace(/[.\s]+$/, "");
  for (const [re, nom] of POSTES) if (re.test(n)) return nom;
  return null;
}
const estMaj = (mot) => /\p{L}/u.test(mot) && mot === mot.toLocaleUpperCase("fr") && mot.replace(/[^\p{L}]/gu, "").length > 1;
const capitaliser = (s) => s.toLocaleLowerCase("fr").replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase("fr"));

export function lireJoueurs(texte) {
  const out = [];
  for (const brut of String(texte ?? "").split(/\n/)) {
    const l = brut.trim();
    if (!l) continue;
    const m = /^(?:n[°o]\s*)?(\d{1,3})\s*[-–.:)/]?\s*(.*)$/i.exec(l);
    if (!m) continue;
    const num = String(Number(m[1]));
    let parts = m[2].split(/\t|\s+[-–|]\s*|\s*[-–|]\s+|\s*[;,]\s*|\s*\/\s*/).map((x) => x.trim()).filter(Boolean);
    let poste = null;
    parts = parts.filter((p) => { const q = posteNormal(p); if (q && !poste) { poste = q; return false; } return true; });
    let mots = parts.join(" ").split(/\s+/).filter(Boolean);
    if (!poste && mots.length > 1) {
      const q = posteNormal(mots[mots.length - 1]);
      if (q) { poste = q; mots = mots.slice(0, -1); }
    }
    const majs = mots.filter(estMaj), autres = mots.filter((w) => !estMaj(w));
    let prenom, nom;
    if (majs.length && autres.length) { nom = majs.join(" "); prenom = autres.join(" "); }
    else if (mots.length > 1) { prenom = mots[0]; nom = mots.slice(1).join(" "); }
    else { prenom = mots[0] || ""; nom = ""; }
    out.push({ num, prenom: prenom ? capitaliser(prenom) : "", nom: (nom || "").toLocaleUpperCase("fr"), poste: poste || "", flocage: "", capitaine: false, libero: false });
  }
  return out.sort((a, b) => Number(a.num) - Number(b.num));
}

// « Jules n°14 N.FERRAILLE » → { 14: "N.FERRAILLE" } ; les autres lignes restent des anecdotes
export function lireFlocages(texte) {
  const flocages = {}, reste = [];
  for (const brut of String(texte ?? "").split(/\n/)) {
    const l = brut.trim();
    if (!l) continue;
    const m = /^(.*?)\s*n[°o]\s*(\d{1,3})\s*[:\-–]?\s*(.+)$/i.exec(l);
    if (m && m[3].trim().length <= 30) flocages[String(Number(m[2]))] = m[3].trim();
    else reste.push(l);
  }
  return { flocages, reste: reste.join("\n") };
}

// ---------- Couleurs ----------
const COULEURS = [
  [/bleu (marine|nuit|fonce)|marine/, "#1E2A5A"],
  [/bleu (ciel|clair)|ciel|azur/, "#38BDF8"],
  [/bordeaux|grenat/, "#7F1D1D"],
  [/turquoise/, "#0D9488"],
  [/vert (fonce|sapin)/, "#14532D"],
  [/rouge/, "#D3121F"],
  [/bleu/, "#1D4ED8"],
  [/vert/, "#15803D"],
  [/jaune/, "#FACC15"],
  [/orange/, "#F97316"],
  [/violet|mauve/, "#7C3AED"],
  [/rose|fuchsia/, "#EC4899"],
  [/\bor\b|dore/, "#C99A1B"],
  [/gris|argent/, "#6B7280"],
  [/noir/, "#1A1A1A"],
  [/blanc/, "#F2F2F2"]
];
export function devinerCouleur(txt) {
  const hex = /#?([0-9a-f]{6})\b/i.exec(String(txt ?? ""));
  if (hex) return "#" + hex[1].toUpperCase();
  const n = norm(txt);
  if (!n) return null;
  // On garde la première couleur citée (« Rouge et Blanc » → rouge)
  let best = null, pos = Infinity;
  for (const [re, h] of COULEURS) { const m = re.exec(n); if (m && m.index < pos) { pos = m.index; best = h; } }
  return best;
}

// ---------- Noms ----------
const MOTS_VIDES = new Set(["union", "sportive", "sportif", "us", "as", "asc", "ac", "club", "volley", "volleyball", "volley-ball", "vb", "v", "b", "de", "du", "des", "la", "le", "les", "l", "d", "et", "ball", "association", "olympique", "stade", "sc", "fc", "cs", "es", "st", "amicale", "entente", "ent"]);
function motsUtiles(nom) {
  return String(nom ?? "").replace(/[’']/g, " ").split(/[\s]+/).filter((w) => w && !MOTS_VIDES.has(norm(w)));
}
// « Union Sportive Ramonville VB » → « Ramonville »
export function nomCourtClub(nom) {
  const m = motsUtiles(nom);
  return m.length ? capitaliser(m.join(" ")) : String(nom ?? "").trim();
}
// « Union Sportive Ramonville VB » → « RAM »
export function abreviation(nom) {
  const m = motsUtiles(nom).map((w) => sansAccents(w).replace(/[^A-Za-z0-9]/g, "")).filter(Boolean);
  if (!m.length) return "";
  if (m.length === 1) return m[0].slice(0, 3).toUpperCase();
  return m.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

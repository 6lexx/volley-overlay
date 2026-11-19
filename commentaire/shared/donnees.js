// =============================================================
//  donnees.js — passage des fiches (privées) à ce que lit l'overlay
// =============================================================
import { CFG } from "./outils.js";
import { texteSur } from "./moteur.js";

export const NOMS_REPLAY = { "public": "Replay public", "non-repertorie": "Replay non répertorié", "aucun": "Pas de replay" };

export function formatDe(match) {
  return match?.formatPerso || CFG.formats[match?.format] || CFG.formats["3sets"];
}

export const triNum = (a, b) => Number(a.num) - Number(b.num);

// Joueurs du jour : ceux cochés, sinon toute la liste
export function joueursDuJour(eq, presents) {
  const tous = (eq?.joueurs || []).filter(Boolean).slice().sort(triNum);
  const p = Array.isArray(presents) ? presents.map(String) : null;
  return p && p.length ? tous.filter((j) => p.includes(String(j.num))) : tous;
}

// Ce que l'overlay a besoin de connaître d'une équipe (rien de privé)
export function vueEquipe(eq, presents) {
  const couleur = eq?.couleur || "#6B6258";
  return {
    nom: eq?.nomAffiche || eq?.club || "Équipe",
    court: (eq?.court || "").toUpperCase().slice(0, 4) || "EQ",
    sousTitre: eq?.equipe || "",
    couleur,
    texte: texteSur(couleur),
    logo: eq?.logo || "",
    joueurs: joueursDuJour(eq, presents).map((j) => ({
      num: String(j.num), prenom: j.prenom || "", nom: j.nom || "", poste: j.poste || "",
      flocage: eq?.montrerFlocage ? (j.flocage || "") : "",
      capitaine: !!j.capitaine, libero: !!j.libero
    }))
  };
}

export function vueMatch(match, eqA, eqB) {
  return {
    competition: match.competition || "",
    date: match.date || "", heure: match.heure || "", salle: match.salle || "",
    format: formatDe(match),
    suivi: match.suivi || "A",
    A: vueEquipe(eqA, match.presents?.A),
    B: vueEquipe(eqB, match.presents?.B)
  };
}

// « 2026-11-23 » → « Dimanche 23 novembre »
export function dateLongue(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso;
  const s = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export const heureCourte = (h) => (h ? h.replace(":", "h") : "");

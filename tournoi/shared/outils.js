// =============================================================
//  outils.js — petites fonctions communes aux pages du tournoi
// =============================================================

export const CFG = window.TOURNOI_CONFIG;

export const $ = (sel, el = document) => el.querySelector(sel);

export function param(nom) {
  return new URLSearchParams(location.search).get(nom);
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "Les Smasheurs du Dimanche" -> "Les Smasheurs d..."
export function court(nom, max = CFG?.affichage?.maxNom || 15) {
  const n = String(nom ?? "");
  return n.length > max ? n.slice(0, max).trimEnd() + "..." : n;
}

// 522000 -> "08:42" ; négatif -> "00:00"
export function fmtChrono(ms) {
  if (ms == null) return "--:--";
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

// Scène fixe 1920×1080 mise à l'échelle de la fenêtre (Streamlabs Desktop ou Mobile)
export function monterScene(el) {
  const ajuster = () => {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    el.style.transform = `scale(${k})`;
    el.style.left = (innerWidth - 1920 * k) / 2 + "px";
    el.style.top = (innerHeight - 1080 * k) / 2 + "px";
  };
  addEventListener("resize", ajuster);
  ajuster();
}

// QR code en SVG (bibliothèque qrcode.js chargée en script classique)
export function qrSvg(texte) {
  if (!window.qrcode) return "";
  const qr = window.qrcode(0, "M");
  qr.addData(texte);
  qr.make();
  return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

let toastTimer;
export function toast(msg, erreur = false) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = "toast show" + (erreur ? " erreur" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 3200);
}

// Bouton à double appui pour les actions risquées
export function doubleAppui(bouton, texteConfirm, action) {
  let arme = null;
  const texte = bouton.textContent;
  bouton.addEventListener("click", () => {
    if (arme) { clearTimeout(arme); arme = null; bouton.textContent = texte; bouton.classList.remove("arme"); action(); return; }
    bouton.textContent = texteConfirm;
    bouton.classList.add("arme");
    arme = setTimeout(() => { arme = null; bouton.textContent = texte; bouton.classList.remove("arme"); }, 3500);
  });
}

export function nomEquipe(equipes, id) {
  return equipes.find((e) => e.id === id)?.nom || null;
}

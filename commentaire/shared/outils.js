// =============================================================
//  outils.js — petites fonctions communes aux pages du kit
// =============================================================
export const CFG = window.COMMENTAIRE_CONFIG;

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

export function param(nom) {
  return new URLSearchParams(location.search).get(nom);
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Liens entre pages : on garde ?key, ?demo
export function lien(page, extra = {}) {
  const u = new URLSearchParams();
  for (const k of ["key", "demo"]) { const v = param(k); if (v !== null) u.set(k, v); }
  for (const [k, v] of Object.entries(extra)) u.set(k, v);
  const s = u.toString();
  return page + (s ? "?" + s : "");
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

let toastTimer;
export function toast(msg, erreur = false) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
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

// Fichiers rafraîchis avant de recharger (bouton « Recharger l'overlay »)
const FICHIERS = ["config.js", "shared/outils.js", "shared/firebase.js", "shared/moteur.js", "shared/donnees.js", "shared/chat.js", "shared/style.css", "shared/fonts.css", "assets/ballon.png"];
export async function rechargerFrais() {
  await Promise.allSettled([location.href, ...FICHIERS].map((f) => fetch(f, { cache: "reload" })));
  location.reload();
}
let signalVu;
export function surSignalRecharge(valeur) {
  const v = valeur ?? null;
  if (signalVu === undefined) { signalVu = v; return; }
  if (v === signalVu) return;
  signalVu = v;
  rechargerFrais();
}

// Garde l'écran de la tablette allumé
export async function garderEcranAllume() {
  try {
    let verrou = await navigator.wakeLock?.request("screen");
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible") { try { verrou = await navigator.wakeLock?.request("screen"); } catch {} }
    });
  } catch {}
}

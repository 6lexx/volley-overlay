// =============================================================
//  firebase.js — connexion, lecture en direct et écriture
//  Toutes les données du tournoi sont sous  tournois/{id}/
//  Mode démo (?demo=1) : tout reste dans le navigateur
//  (localStorage), synchronisé entre les onglets ouverts.
// =============================================================
import { CFG, param } from "./outils.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

export const TID = (param("t") || CFG.id || "").trim();
export const DEMO = param("demo") === "1";

if (!/^[A-Za-z0-9_-]+$/.test(TID)) throw new Error("Identifiant de tournoi invalide dans config.js");

// role : null (lecture seule), "orga" ou "stream" ; cle : la clé du lien
export async function connecter({ role = null, cle = null } = {}) {
  return DEMO ? connecterDemo() : connecterFirebase(role, cle);
}

// ---------- Firebase ----------

async function connecterFirebase(role, cle) {
  const [{ initializeApp }, authMod, dbMod] = await Promise.all([
    import(SDK + "firebase-app.js"),
    import(SDK + "firebase-auth.js"),
    import(SDK + "firebase-database.js")
  ]);
  const { getDatabase, ref, onValue, update, serverTimestamp } = dbMod;
  const app = initializeApp(CFG.firebase, "tournoi");
  const db = getDatabase(app);
  const racine = `tournois/${TID}`;

  if (role) {
    if (!cle) throw new Error("Lien incomplet : il manque la clé (?key=…)");
    const auth = authMod.getAuth(app);
    const user = await new Promise((ok, ko) => {
      const stop = authMod.onAuthStateChanged(auth, (u) => { if (u) { stop(); ok(u); } });
      authMod.signInAnonymously(auth).catch(() => ko(new Error("Connexion impossible : l'authentification anonyme est-elle activée ?")));
    });
    try {
      await dbMod.set(ref(db, `tournoiAcces/${TID}/${role}/${user.uid}`), cle);
    } catch {
      throw new Error("Clé refusée : vérifie le lien (paramètre key).");
    }
  }

  let decalage = 0;
  onValue(ref(db, ".info/serverTimeOffset"), (s) => (decalage = s.val() || 0));

  return {
    demo: false,
    ecouter(chemin, cb, erreur) {
      return onValue(ref(db, chemin ? `${racine}/${chemin}` : racine), (s) => cb(s.val()), (e) => erreur?.(e));
    },
    maj(majs) { return update(ref(db, racine), majs); },
    ts() { return serverTimestamp(); },
    maintenant() { return Date.now() + decalage; },
    surConnexion(cb) { return onValue(ref(db, ".info/connected"), (s) => cb(s.val() === true)); }
  };
}

// ---------- Démo locale ----------

function connecterDemo() {
  const CLE = `tournoi-demo-${TID}`;
  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch { return {}; } };
  const auChemin = (obj, chemin) => (chemin ? chemin.split("/").reduce((o, k) => (o == null ? o : o[k]), obj) : obj) ?? null;
  const ecouteurs = new Set();
  const prevenir = () => { const d = lire(); ecouteurs.forEach((e) => e.cb(clone(auChemin(d, e.chemin)))); };
  const clone = (v) => (v == null ? null : JSON.parse(JSON.stringify(v)));
  addEventListener("storage", (ev) => { if (ev.key === CLE) prevenir(); });

  return {
    demo: true,
    ecouter(chemin, cb) {
      const e = { chemin, cb };
      ecouteurs.add(e);
      setTimeout(() => cb(clone(auChemin(lire(), chemin))), 0);
      return () => ecouteurs.delete(e);
    },
    async maj(majs) {
      const d = lire();
      for (const [chemin, v] of Object.entries(majs)) {
        const parts = chemin.split("/");
        let o = d;
        parts.slice(0, -1).forEach((k) => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; });
        const fin = parts[parts.length - 1];
        if (v === null || v === undefined) delete o[fin]; else o[fin] = clone(v);
      }
      localStorage.setItem(CLE, JSON.stringify(d));
      prevenir();
    },
    ts() { return Date.now(); },
    maintenant() { return Date.now(); },
    surConnexion(cb) { setTimeout(() => cb(true), 0); return () => {}; }
  };
}

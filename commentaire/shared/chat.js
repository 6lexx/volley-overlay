// Lecture du chat Twitch en anonyme (lecture seule, aucune clé, aucun compte).
// Connexion IRC par WebSocket avec un pseudo « justinfan », comme le lecteur Twitch
// quand on n'est pas connecté.
//
//   const chat = lireChat("silex62", { message, supprimer, vider, etat });
//   chat.fermer();

const URL_IRC = "wss://irc-ws.chat.twitch.tv:443";

export function lireChat(chaine, rappels = {}) {
  const canal = String(chaine || "").toLowerCase().replace(/^.*twitch\.tv\//, "").replace(/[^a-z0-9_]/g, "");
  let ws = null, ferme = false, essai = 0, minuterie = null;
  const etat = (e) => rappels.etat?.(e);

  function ouvrir() {
    if (ferme || !canal) return;
    etat("connexion");
    ws = new WebSocket(URL_IRC);
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan" + Math.floor(10000 + Math.random() * 80000));
      ws.send("JOIN #" + canal);
    };
    ws.onmessage = (ev) => String(ev.data).split("\r\n").forEach((l) => l && ligne(l));
    ws.onclose = () => {
      etat("coupe");
      if (ferme) return;
      const attente = Math.min(30000, 1000 * 2 ** essai++);
      minuterie = setTimeout(ouvrir, attente);
    };
    ws.onerror = () => { try { ws.close(); } catch {} };
  }

  function ligne(brut) {
    const m = analyser(brut);
    if (!m) return;
    switch (m.commande) {
      case "PING": ws.send("PONG :" + (m.texte || "tmi.twitch.tv")); break;
      case "JOIN": essai = 0; etat("ok"); break;
      case "RECONNECT": try { ws.close(); } catch {} break;
      case "PRIVMSG": rappels.message?.(message(m)); break;
      case "USERNOTICE": rappels.message?.({ ...message(m), systeme: m.tags["system-msg"] || "" }); break;
      case "CLEARMSG": rappels.supprimer?.({ id: m.tags["target-msg-id"] }); break;
      case "CLEARCHAT": m.texte ? rappels.supprimer?.({ utilisateur: m.tags["target-user-id"] }) : rappels.vider?.(); break;
    }
  }

  ouvrir();
  return {
    canal,
    fermer() { ferme = true; clearTimeout(minuterie); try { ws?.close(); } catch {} },
  };
}

// ---------- Analyse d'une ligne IRC ----------
// @tags :prefixe COMMANDE #canal :texte
export function analyser(brut) {
  let reste = brut, tags = {};
  if (reste.startsWith("@")) {
    const fin = reste.indexOf(" ");
    for (const t of reste.slice(1, fin).split(";")) {
      const i = t.indexOf("=");
      tags[t.slice(0, i)] = deEchapper(t.slice(i + 1));
    }
    reste = reste.slice(fin + 1);
  }
  let prefixe = "";
  if (reste.startsWith(":")) {
    const fin = reste.indexOf(" ");
    prefixe = reste.slice(1, fin);
    reste = reste.slice(fin + 1);
  }
  const i = reste.indexOf(" :");
  const tete = i >= 0 ? reste.slice(0, i) : reste;
  const texte = i >= 0 ? reste.slice(i + 2) : "";
  const [commande] = tete.split(" ");
  return { tags, prefixe, commande, texte };
}

function deEchapper(v) {
  return v.replace(/\\(.)/g, (_, c) => ({ s: " ", ":": ";", "\\": "\\", r: "\r", n: "\n" }[c] ?? c));
}

function message(m) {
  const t = m.tags;
  let texte = m.texte;
  let action = false;
  // /me : le message arrive entouré de \x01ACTION ... \x01
  if (texte.startsWith("\x01ACTION ")) { action = true; texte = texte.slice(8).replace(/\x01$/, ""); }
  return {
    id: t.id || String(Math.random()),
    utilisateurId: t["user-id"] || "",
    nom: t["display-name"] || m.prefixe.split("!")[0] || "?",
    couleur: t.color || "",
    badges: (t.badges || "").split(",").filter(Boolean).map((b) => b.split("/")[0]),
    morceaux: decouper(texte, t.emotes || ""),
    action,
  };
}

// Découpe le texte en morceaux { texte } et { emote: id, texte } d'après le tag emotes
// (positions en caractères Unicode, pas en unités UTF-16).
export function decouper(texte, emotes) {
  const car = Array.from(texte);
  const places = [];
  for (const e of emotes.split("/").filter(Boolean)) {
    const [id, pos] = e.split(":");
    for (const p of (pos || "").split(",")) {
      const [d, f] = p.split("-").map(Number);
      if (Number.isFinite(d) && Number.isFinite(f)) places.push({ id, d, f });
    }
  }
  places.sort((a, b) => a.d - b.d);
  const out = [];
  let i = 0;
  for (const p of places) {
    if (p.d < i) continue;
    if (p.d > i) out.push({ texte: car.slice(i, p.d).join("") });
    out.push({ emote: p.id, texte: car.slice(p.d, p.f + 1).join("") });
    i = p.f + 1;
  }
  if (i < car.length) out.push({ texte: car.slice(i).join("") });
  return out;
}

// Couleur du pseudo lisible sur fond sombre
const PALETTE = ["#FF6B6B", "#4DABF7", "#69DB7C", "#FFD43B", "#DA77F2", "#FFA94D", "#38D9A9", "#F783AC"];
export function couleurLisible(couleur, nom) {
  let c = /^#[0-9a-f]{6}$/i.test(couleur) ? couleur : null;
  if (!c) {
    let h = 0;
    for (const ch of nom) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum >= 0.45) return c;
  // Trop sombre : on l'éclaircit vers le blanc
  const k = 0.55;
  return "#" + [r, g, b].map((v) => Math.round(v + (255 - v) * k).toString(16).padStart(2, "0")).join("");
}

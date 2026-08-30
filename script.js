// ============================================================
// CONFIGURATION — a completer (voir README.md)
// ============================================================
// 1. Cree un Gist PUBLIC sur https://gist.github.com contenant
//    un fichier (ex: logs.json) avec le contenu : []
// 2. Recupere ton nom d'utilisateur GitHub et l'ID du Gist
//    (visible dans l'URL du Gist : gist.github.com/USER/ID)
// 3. Renseigne les 3 valeurs ci-dessous.
const CONFIG = {
  GIST_UTILISATEUR: "Matheo56600",
  GIST_ID: "635c9f837038f813b46fa30ff7d35081",
  GIST_FICHIER: "logs.json",
  INTERVALLE_MS: 5000,       // frequence de rafraichissement
  SECONDES_HORS_LIGNE: 30,   // au-dela, on affiche "HORS LIGNE"
  MAX_LIGNES_AFFICHEES: 300
};

// ============================================================
// Etat
// ============================================================
let dernierHorodatage = null;

const elJournal = document.getElementById("journal");
const elCurseur = document.getElementById("curseur");
const elStatutReseau = document.getElementById("statut-reseau");
const elStatutSync = document.getElementById("statut-sync");
const elPiedErreur = document.getElementById("pied-erreur");
const elLienSource = document.getElementById("lien-source");
const elCorps = document.querySelector(".terminal-corps");

// ============================================================
// Utilitaires
// ============================================================

function estConfigure() {
  return (
    CONFIG.GIST_UTILISATEUR !== "VOTRE-UTILISATEUR" &&
    CONFIG.GIST_ID !== "VOTRE-ID-DE-GIST"
  );
}

function urlGistBrut() {
  // URL "raw" sans hash de revision = toujours la derniere version,
  // servie par le CDN GitHub (pas soumise aux limites de l'API REST).
  return (
    "https://gist.githubusercontent.com/" +
    CONFIG.GIST_UTILISATEUR + "/" + CONFIG.GIST_ID +
    "/raw/" + CONFIG.GIST_FICHIER +
    "?cachebust=" + Date.now()
  );
}

function formaterHeure(epochMs) {
  const d = new Date(epochMs);
  const deux = (n) => String(n).padStart(2, "0");
  return deux(d.getHours()) + ":" + deux(d.getMinutes()) + ":" + deux(d.getSeconds());
}

function classeNiveau(niveau) {
  switch ((niveau || "info").toLowerCase()) {
    case "succes":
    case "ok":
      return "niveau-succes";
    case "warn":
    case "avertissement":
      return "niveau-warn";
    case "erreur":
    case "error":
      return "niveau-erreur";
    default:
      return "niveau-info";
  }
}

function texteNiveau(niveau) {
  switch ((niveau || "info").toLowerCase()) {
    case "succes":
    case "ok":
      return "OK";
    case "warn":
    case "avertissement":
      return "WARN";
    case "erreur":
    case "error":
      return "ERR ";
    default:
      return "INFO";
  }
}

// ============================================================
// Rendu
// ============================================================

function afficherEntrees(entrees) {
  if (!Array.isArray(entrees) || entrees.length === 0) {
    return;
  }

  elJournal.innerHTML = "";

  const visibles = entrees.slice(-CONFIG.MAX_LIGNES_AFFICHEES);

  for (const entree of visibles) {
    const ligne = document.createElement("p");
    ligne.className = "journal-ligne";

    const horodatage = document.createElement("span");
    horodatage.className = "journal-horodatage";
    horodatage.textContent = "[" + formaterHeure(entree.t) + "]";

    const niveau = document.createElement("span");
    niveau.className = "journal-niveau " + classeNiveau(entree.niveau);
    niveau.textContent = texteNiveau(entree.niveau);

    const message = document.createElement("span");
    message.textContent = entree.msg || "";

    ligne.appendChild(horodatage);
    ligne.appendChild(niveau);
    ligne.appendChild(message);
    elJournal.appendChild(ligne);
  }

  const derniere = entrees[entrees.length - 1];
  if (derniere && typeof derniere.t === "number") {
    dernierHorodatage = derniere.t;
  }

  // auto-scroll vers le bas
  elCorps.scrollTop = elCorps.scrollHeight;
}

function mettreAJourStatut() {
  if (dernierHorodatage === null) {
    elStatutReseau.textContent = "RESEAU : CONNEXION...";
    elStatutReseau.className = "statut statut-inconnu";
    elStatutSync.textContent = "derniere entree : —";
    return;
  }

  const secondes = Math.floor((Date.now() - dernierHorodatage) / 1000);
  elStatutSync.textContent = "derniere entree : " + secondes + "s";

  if (secondes > CONFIG.SECONDES_HORS_LIGNE) {
    elStatutReseau.textContent = "RESEAU : HORS LIGNE";
    elStatutReseau.className = "statut statut-hors-ligne";
  } else {
    elStatutReseau.textContent = "RESEAU : CONNECTE";
    elStatutReseau.className = "statut statut-connecte";
  }
}

function afficherErreur(message) {
  elPiedErreur.hidden = false;
  elPiedErreur.textContent = message;
}

function effacerErreur() {
  elPiedErreur.hidden = true;
  elPiedErreur.textContent = "";
}

// ============================================================
// Recuperation des logs
// ============================================================

async function rafraichir() {
  if (!estConfigure()) {
    afficherErreur("Source non configuree — voir CONFIG en haut de script.js");
    return;
  }

  try {
    const reponse = await fetch(urlGistBrut(), { cache: "no-store" });
    if (!reponse.ok) {
      throw new Error("HTTP " + reponse.status);
    }
    const donnees = await reponse.json();
    afficherEntrees(donnees);
    effacerErreur();
  } catch (err) {
    afficherErreur("Impossible de recuperer les logs (" + err.message + ")");
  }

  mettreAJourStatut();
}

// ============================================================
// Initialisation
// ============================================================

if (estConfigure()) {
  elLienSource.textContent =
    "gist.github.com/" + CONFIG.GIST_UTILISATEUR + "/" + CONFIG.GIST_ID;
} else {
  elLienSource.textContent = "non configuree";
}

rafraichir();
setInterval(rafraichir, CONFIG.INTERVALLE_MS);
setInterval(mettreAJourStatut, 1000);

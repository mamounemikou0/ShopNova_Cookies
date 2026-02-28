# 🍪 ShopNova — Démonstration de Consentement aux Cookies

## Projet pratique 1 — Sécurité et vie privée numérique  
⁠Application éducative qui rend visible et compréhensible ce qui se passe exactement lorsque vous interagissez avec une bannière de cookies.

---    

## 👥 Équipe

Projet réalisé par Elmamoune Mikou et Ayat Allah EL Anouar dans le cadre du cours de Gestion de la cybersécurité/données personnelles — UQAC, hiver 2026.   

---   

## Lien Démo du projet   

https://uqac.ca.panopto.com/Panopto/Pages/Viewer.aspx?id=cc115055-e923-4a54-8897-b3ff014e157d

---    

## 📋 Table des matières

1.⁠ ⁠[La menace étudiée](#-la-menace-étudiée)   

2.⁠ ⁠[Données observées](#-données-observées)   

3.⁠ ⁠[Implications](#implications)  

4.⁠ ⁠[Installation et utilisation](#-installation-et-utilisation)

5.⁠ ⁠[Scénarios reproductibles](#-scénarios-reproductibles)

6.⁠ ⁠[Architecture technique](#-architecture-technique)

7.⁠ ⁠[Limites de la démonstration](#-limites-de-la-démonstration)

8.⁠ ⁠[Analyse des risques et atténuation](#-analyse-des-risques-et-atténuation)

---

## 🎯 La menace étudiée

### Le mécanisme : bannière de consentement aux cookies

Un *cookie* est un petit fichier texte stocké localement dans votre navigateur par un site web. Les sites modernes affichent des *bannières de consentement* pour obtenir votre permission avant de créer certains types de cookies.

*Le problème :* Ces bannières utilisent fréquemment des *dark patterns* :
•⁠  ⁠Le bouton "Accepter" est grand, vert, et mis en évidence
•⁠  ⁠Le bouton "Refuser" est petit, gris, ou nécessite plusieurs clics supplémentaires
•⁠  ⁠Le texte est vague et ne décrit pas clairement ce qui sera collecté

*La question centrale de notre projet :*
	⁠"Qu'est-ce qui se passe exactement quand je clique sur « Accepter tout » ?"

### Types de cookies impliqués

| Catégorie | Exemples | Durée | Impact |
|-----------|----------|-------|--------|
| *Essentiels* | Session, langue, panier | Court (1 jour – 1 an) | Faible |
| *Analytiques* | Groupe A/B, première visite | Long (1–2 ans) | Modéré |
| *Marketing* | Identifiant persistant, source | Très long (2 ans) | *Élevé* |

---

## 🔍 Données observées

### Chronologie exacte des événements

<pre>
┌─────────────────────────────────────────────────────────────────┐
│  VISITE DU SITE (avant tout choix)                              │
│                                                                 │
│  ① Session ID générée           → sessionStorage (onglet seul)  │
│  ② Événement "bannière affichée" → localStorage (log)           │
│  ③ Cookies existants : 0                                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
               ┌───────────────┼────────────────┐
               ▼               ▼                ▼
         [REFUSER]      [ESSENTIELS]      [TOUT ACCEPTER]
               │               │                │
        1 cookie         3 cookies          6 cookies
        (refus 1an)  (session+consentement  (+user_id 2ans,
                      +langue 1an)          ab_group 1an,
                                            first_visit 2ans,
                                            src 30j)
               │               │                │
        0 pixel          0 pixel          📡 Pixel déclenché
        0 empreinte      0 empreinte      🔍 Empreinte collectée
        0 profil         0 profil         👁 Suivi comportemental
</pre>
		
### Quand chaque donnée est-elle collectée ?

*Immédiatement au chargement de la page :*
•⁠  ⁠Identifiant de session temporaire (sessionStorage)
•⁠  ⁠Log "page chargée" avec timestamp

*Au clic sur "Tout accepter" :*
•⁠  ⁠Cookie ⁠ shopnova_user_id ⁠ — identifiant unique persistant sur *2 ans*
•⁠  ⁠Cookie ⁠ shopnova_ab_group ⁠ — groupe A ou B pour tests de manipulation
•⁠  ⁠Cookie ⁠ shopnova_first_visit ⁠ — horodatage de première visite (2 ans)
•⁠  ⁠Cookie ⁠ shopnova_src ⁠ — source d'acquisition marketing (30 jours)
•⁠  ⁠Cookie ⁠ shopnova_session_id ⁠ — session courante (1 jour)
•⁠  ⁠Cookie ⁠ shopnova_lang ⁠ — langue du navigateur (1 an)
•⁠  ⁠Empreinte navigateur : langue, fuseau horaire, résolution, plateforme, CPU, RAM, DNT...
•⁠  ⁠Pixel de suivi déclenché (image 1×1px invisible)
•⁠  ⁠Activation du suivi comportemental (scroll, produits consultés, ajouts au panier)

*À chaque interaction produit (si consentement total) :*
•⁠  ⁠Log produit consulté + déclenchement d'un pixel ⁠ product_view ⁠
•⁠  ⁠Log ajout au panier + pixel ⁠ add_to_cart ⁠ + estimation du budget utilisateur

### Par quel mécanisme ?

Tous les mécanismes sont implémentés en code natif, sans aucune librairie tierce :

•⁠  ⁠*⁠ document.cookie ⁠* — création et lecture des cookies navigateur
•⁠  ⁠*⁠ localStorage ⁠* — stockage des logs, profil, empreinte (persistant)
•⁠  ⁠*⁠ sessionStorage ⁠* — identifiant de session (disparaît à la fermeture)
•⁠  ⁠*⁠ <img src="data:..."> ⁠ 1×1px* — simulation d'un pixel de tracking sans requête réseau réelle

---
## ⚠️ Implications

### Ce que ces données permettraient dans un contexte réel

*Avec "Tout accepter" :*

| Donnée collectée | Ce qu'elle permet |
|-----------------|-------------------|
| ⁠ user_id ⁠ persistant (2 ans) | Reconnaître l'utilisateur à chaque retour sans qu'il se connecte |
| ⁠ ab_group ⁠ | Afficher des prix différents selon le groupe — manipulation invisible |
| ⁠ first_visit ⁠ | Calculer la fréquence de visite, la fidélité, l'engagement |
| Empreinte navigateur | Identifier le navigateur parmi des millions même sans cookie |
| Produits consultés | Déduire les intérêts, habitudes de vie, niveau de vie |
| Budget estimé (panier) | Connaître la capacité d'achat pour adapter les prix |
| Profondeur de scroll | Mesurer l'engagement et l'intérêt réel pour le contenu |
| Pixel multi-événements | Reconstituer un parcours utilisateur complet |

*Dans un vrai site :* ces données seraient transmises à Google Analytics, Meta Pixel, doubleclick.net, etc. — *sans que l'utilisateur le sache.*

*Avec "Refuser" :*
•⁠  ⁠Aucune ré-identification possible
•⁠  ⁠Session anonyme et oubliée à la fermeture du navigateur
•⁠  ⁠Aucun profilage, aucune manipulation
•⁠  ⁠Un seul cookie créé : la mémorisation du refus (pour ne plus afficher la bannière)

---

## 💻 Installation et utilisation

### Prérequis

•⁠  ⁠Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
•⁠  ⁠Python 3 *ou* Node.js (pour serveur local)
•⁠  ⁠*Aucune installation de dépendances* — tout en vanilla JS

### Étape 1 — Cloner le dépôt

⁠ bash
git clone https://github.com/mamounemikou0/cookie-consent-demo.git
cd cookie-consent-demo
 ⁠

### Étape 2 — Lancer un serveur local

*Option A — Python :*
⁠ bash
python3 -m http.server 8080
 ⁠
Puis ouvrir : [http://localhost:8080](http://localhost:8080)

*Option B — Node.js :*
⁠ bash
npx serve .
 ⁠

*Option C — VS Code Live Server :*
1.⁠ ⁠Installer l'extension *Live Server* dans VS Code
2.⁠ ⁠Clic droit sur ⁠ index.html ⁠ → *"Open with Live Server"*

### Structure des fichiers


cookie-consent-demo/
├── index.html        ← Site simulé ShopNova (bannière + boutique)
├── dashboard.html    ← Tableau de bord de surveillance en temps réel
├── compare.html      ← Page de comparaison Avant / Après (3 colonnes)
├── engine.js         ← Moteur partagé (logging, cookies, profil, pixels)
└── README.md         ← Ce fichier


### Navigation entre les pages

| Page | URL | Rôle |
|------|-----|------|
| Site simulé | ⁠ index.html ⁠ | Interagir avec la bannière, naviguer |
| Tableau de bord | ⁠ dashboard.html ⁠ | Observer toutes les données collectées |
| Comparaison | ⁠ compare.html ⁠ | Voir les 3 scénarios côte à côte |

---

## 🧪 Scénarios reproductibles

	⁠Chaque scénario doit être suivi dans l’ordre. Commencez toujours par effacer les données via le tableau de bord → "🗑 Effacer tout".

---

### Scénario 1 — Observer "Tout accepter" en détail

*Objectif :* Voir l'intégralité des données collectées lors d'un consentement total.

1.⁠ ⁠Lancer le serveur local, ouvrir ⁠ index.html ⁠
2.⁠ ⁠Dans un nouvel onglet, ouvrir ⁠ dashboard.html ⁠
3.⁠ ⁠Sur le site, *ne pas cliquer sur la bannière* immédiatement
4.⁠ ⁠*Observer dans le dashboard :* 1 événement "session créée", 1 événement "bannière affichée" — *0 cookie*
5.⁠ ⁠Retourner sur le site → cliquer sur *"Tout accepter ✓"* (bouton vert)
6.⁠ ⁠*Observer dans le dashboard :*
   - 6 cookies listés dans la sidebar
   - L'empreinte navigateur apparaît (langue, résolution, CPU, RAM…)
   - 1 pixel "consent_given" enregistré dans le journal des pixels
   - Niveau de risque → *ÉLEVÉ*
   - La barre rouge monte à 92%
7.⁠ ⁠Retourner sur le site → cliquer sur *3 produits différents*
8.⁠ ⁠Ajouter *2 produits au panier*
9.⁠ ⁠*Observer dans le dashboard :*
   - Profil utilisateur : produits consultés listés
   - Budget estimé calculé automatiquement
   - Pixels ⁠ product_view ⁠ et ⁠ add_to_cart ⁠ dans le journal

*Résultats attendus :* ~15–20 événements, 6 cookies, empreinte complète, profil enrichi.

---

### Scénario 2 — Observer "Refuser" et comparer

*Objectif :* Montrer la différence radicale avec un refus.

1.⁠ ⁠Tableau de bord → *"🗑 Effacer tout"*
2.⁠ ⁠Recharger ⁠ index.html ⁠
3.⁠ ⁠Cliquer sur *"Refuser"* (bouton à gauche)
4.⁠ ⁠*Observer dans le dashboard :*
   - *1 seul cookie* : ⁠ shopnova_consent=refused ⁠
   - Aucune empreinte
   - Aucun pixel
   - Niveau de risque → *FAIBLE*
5.⁠ ⁠Cliquer sur des produits, ajouter au panier
6.⁠ ⁠*Observer :* les actions sont loguées pour la démo éducative, mais *aucun cookie tracking, aucun profil construit*

*Résultats attendus :* ~4–6 événements, 1 seul cookie, aucun pixel, risque faible.

---

### Scénario 3 — Comparaison côte à côte

*Objectif :* Visualiser les 3 scénarios simultanément avec données réelles.

1.⁠ ⁠Après avoir effectué l'un des scénarios ci-dessus
2.⁠ ⁠Ouvrir ⁠ compare.html ⁠
3.⁠ ⁠*Observer :* la colonne de votre choix actuel est mise en évidence (bordure violette)
4.⁠ ⁠La section "Données réelles" de chaque colonne affiche vos vraies données en temps réel
5.⁠ ⁠Effectuer un autre choix (retourner sur le site, effacer, rechoisir) et voir la colonne changer

---

### Scénario 4 — Persistance inter-sessions (cookie 2 ans)

*Objectif :* Prouver qu'un cookie persistant reconnaît l'utilisateur sans action de sa part.

1.⁠ ⁠Effectuer le Scénario 1 (Tout accepter) *sans effacer*
2.⁠ ⁠Fermer l'onglet ⁠ index.html ⁠
3.⁠ ⁠Attendre 5 secondes, puis rouvrir ⁠ index.html ⁠
4.⁠ ⁠*Observer dans le dashboard :*
   - Événement "Retour visiteur — consentement mémorisé : all"
   - La bannière *ne s'affiche pas* (mémorisée)
   - Le cookie ⁠ shopnova_user_id ⁠ est *toujours présent* (expirera dans 730 jours)
   - Le suivi comportemental reprend *automatiquement*
5.⁠ ⁠Dans ⁠ compare.html ⁠, voir la section "Historique des visites" qui liste les 2 visites

*Résultat attendu :* L'utilisateur est reconnu et le tracking reprend sans aucune action.

---

### Scénario 5 — Essentiels seulement (compromis)

*Objectif :* Voir le niveau intermédiaire.

1.⁠ ⁠Effacer tout → recharger → cliquer *"Essentiels"*
2.⁠ ⁠Observer : *3 cookies* (session, consentement, langue)
3.⁠ ⁠Observer : *0 pixel, 0 empreinte, 0 profil*, risque MODÉRÉ à 38%
4.⁠ ⁠Fermer et rouvrir l'onglet → la bannière ne réapparaît pas, mais *aucun user_id ne reconnaît l'utilisateur*

---

## ⚙️ Architecture technique

### Moteur (⁠ engine.js ⁠)

Module JavaScript vanilla partagé par les 3 pages. Expose un objet global ⁠ ENGINE ⁠ avec :

| Fonction | Description |
|----------|-------------|
| ⁠ ENGINE.log(type, msg, data, category) ⁠ | Enregistre un événement horodaté dans localStorage |
| ⁠ ENGINE.getLogs() ⁠ | Récupère le journal complet |
| ⁠ ENGINE.onLog(fn) ⁠ | Abonnement temps réel aux nouveaux événements |
| ⁠ ENGINE.setCookie(name, val, days, purpose) ⁠ | Crée un cookie ET le logue |
| ⁠ ENGINE.deleteCookie(name) ⁠ | Supprime un cookie ET le logue |
| ⁠ ENGINE.getAllShopCookies() ⁠ | Liste tous les cookies ⁠ shopnova_* ⁠ actifs |
| ⁠ ENGINE.collectFingerprint() ⁠ | Collecte 9 paramètres du navigateur |
| ⁠ ENGINE.firePixel(event, data) ⁠ | Simule un pixel 1×1px et logue le payload |
| ⁠ ENGINE.getPixelLogs() ⁠ | Récupère l'historique des pixels |
| ⁠ ENGINE.getProfile() ⁠ / ⁠ updateProfile() ⁠ | Gestion du profil utilisateur |
| ⁠ ENGINE.getVisitHistory() ⁠ / ⁠ recordVisit() ⁠ | Historique inter-sessions |
| ⁠ ENGINE.applyConsent(choice) ⁠ | Applique le consentement (crée/supprime les cookies) |
| ⁠ ENGINE.getRiskScore() ⁠ | Calcule le niveau de risque selon le choix |
| ⁠ ENGINE.clearAll() ⁠ | Réinitialisation complète (localStorage + cookies) |

### Format d'un événement (localStorage)

⁠ json
{
  "id": "evt_lnx3k2ab8f",
  "timestamp": "2025-03-01T14:23:45.123Z",
  "type": "cookie_set",
  "message": "Cookie créé : \"shopnova_user_id\"",
  "category": "cookie",
  "data": {
    "cookieName": "shopnova_user_id",
    "value": "usr_m2x9k3ab7d",
    "expires": "730 jour(s)",
    "purpose": "Identifiant utilisateur persistant (2 ans)",
    "sessionId": "sess_lnx2a1...",
    "page": "/index.html"
  }
}
 ⁠

### Simulation du pixel de tracking

⁠ javascript
// Création d'une image 1×1px invisible (sans vraie requête réseau)
const img = document.createElement('img');
img.src = `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///...`;
img.width = 1; img.height = 1;
img.style.cssText = 'position:absolute;opacity:0;pointer-events:none;';
img.setAttribute('data-pixel-event', event);
document.body.appendChild(img);
setTimeout(() => img.remove(), 100);
// Le payload qui SERAIT envoyé est loggé localement
 ⁠

### Contraintes respectées

•⁠  ⁠✅ *Données locales uniquement* : ⁠ localStorage ⁠, ⁠ sessionStorage ⁠, cookies navigateur
•⁠  ⁠✅ *Aucune requête réseau* : pixels simulés avec ⁠ data:image/gif ⁠ (pas de fetch)
•⁠  ⁠✅ *Code 100% original* : aucune API tierce (pas de GA, pas de FB Pixel, pas de Hotjar)
•⁠  ⁠✅ *Journalisation explicite* : chaque événement horodaté, typé, catégorisé, lisible
•⁠  ⁠✅ *Légal* : aucun hacking, aucun contournement — démonstration éducative uniquement

---

## 🚧 Limites de la démonstration

| Ce que la démo fait | Ce qu'elle simplifie |
|--------------------|---------------------|
| Crée de vrais cookies dans le navigateur | Ne les envoie pas à un vrai serveur |
| Simule un pixel 1×1px visible dans le DOM | N'effectue pas de vraie requête HTTP |
| Collecte une empreinte de base (9 paramètres) | Les vraies empreintes utilisent canvas, WebGL, fonts, timing |
| Suivi de scroll et clics produits | Pas de mousetracking ni heatmap complète |
| Persistance locale du profil | Pas de synchronisation serveur ou cross-device |
| Historique de visites local | Dans un vrai site, corrélé avec des dizaines d'autres sites |

---

## 🛡 Analyse des risques et atténuation

### Matrice de risques

| Risque | Sévérité | Vraisemblance | Mécanisme démontré |
|--------|----------|--------------|-------------------|
| Ré-identification par cookie persistant | 🔴 Élevée | Très probable | ⁠ shopnova_user_id ⁠ — 2 ans |
| Profilage comportemental | 🔴 Élevée | Probable | Scroll + produits + budget |
| Manipulation A/B des prix | 🟡 Modérée | Fréquent | Cookie ⁠ ab_group ⁠ |
| Empreinte navigateur (fingerprinting) | 🟡 Modérée | Possible | 9 paramètres combinés |
| Corrélation multi-sessions | 🔴 Élevée | Certain avec "Tout accepter" | ID liant toutes les visites |
| Partage avec tiers | 🔴 Élevée | Très fréquent (non simulé) | Mentionne la pratique |

### Méthodes d'atténuation proposées

*Solution 1 — Mode Vie Privée (implémenté dans le site)*
Le site propose un bouton "Mode Vie Privée" qui désactive activement tout tracking et supprime les cookies existants, même après avoir accepté. C'est la réponse directe aux dark patterns.

*Solution 2 — Pour les utilisateurs*
•⁠  ⁠Utiliser la *navigation privée* (supprime les cookies à la fermeture)
•⁠  ⁠Installer *uBlock Origin* ou *Privacy Badger* (bloqueurs de trackers)
•⁠  ⁠Toujours cliquer *"Refuser"* ou *"Essentiels seulement"*
•⁠  ⁠Vider régulièrement les cookies du navigateur

*Solution 3 — Pour les développeurs (conformité légale)*
•⁠  ⁠*Loi 25 (Québec)* : consentement libre, éclairé, spécifique et non équivoque avant toute collecte
•⁠  ⁠*RGPD (Europe)* : "Refuser" doit être aussi simple et visible que "Accepter" (CJUE 2020)
•⁠  ⁠Collecter le *strict minimum* nécessaire au fonctionnement
•⁠  ⁠Limiter la *durée de vie* des cookies au minimum nécessaire
•⁠  ⁠Ne jamais utiliser de *cases pré-cochées* (illégal depuis 2020)
•⁠  ⁠Fournir un moyen de *retirer le consentement* aussi facilement qu'il a été donné

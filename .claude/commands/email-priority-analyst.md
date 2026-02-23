---
name: email-priority-analyst
description: "Analyse et priorise les emails pour Dancing Dead Records, Den Haku Records et STYX. Utilise ce skill quand l'utilisateur partage des emails, demande un triage de sa boite, ou veut organiser ses emails par priorite. Lit les emails via le connecteur Gmail natif de Claude et applique les labels Gmail via un bridge Google Apps Script serverless. Peut suggerer de nouveaux labels si un email ne correspond a aucune categorie existante (avec validation utilisateur avant creation)."
---

# Email Priority Analyst — Dancing Dead Records

Analyse les emails du label et produit un plan d'action priorise avec application
automatique de labels Gmail, adapte a l'industrie musicale electronique.

## Architecture Hybride

```
Utilisateur : "Analyse mes emails non lus"
        |
        v
+-----------------------------+
|  Connecteur Gmail Natif     |  <- Lecture des emails (zero config)
|  (Claude.ai built-in)       |     Search, retrieve, read
+-------------+---------------+
              | emails bruts
              v
+-----------------------------+
|  Ce Skill (analyse)         |  <- Scoring, categorisation, priorisation
|  Urgence / Importance /     |     Detection imprint + categorie
|  Action / Labels            |     Suggestion nouveaux labels
+-------------+---------------+
              | labels a appliquer
              v
+-----------------------------+
|  Google Apps Script Bridge  |  <- Application des labels Gmail
|  (serverless, gratuit)      |     Creation de labels (apres validation)
|  Heberge sur Google          |     Archivage
+-----------------------------+
```

**Pourquoi hybride ?**
- Le connecteur Gmail natif de Claude gere la lecture (fiable, maintenu par Anthropic, zero maintenance)
- Le connecteur natif ne supporte PAS la modification (pas de labels, pas d'envoi)
- Le Apps Script comble ce manque : labeling + archivage, serverless, gratuit, 0 hebergement

## Quand ce Skill se Declenche

- L'utilisateur demande d'analyser, prioriser, trier, ou organiser ses emails
- L'utilisateur demande "par quoi je commence ?" concernant ses emails
- L'utilisateur mentionne inbox overload, retard emails, ou backlog
- L'utilisateur colle ou upload un ou plusieurs emails manuellement
- L'utilisateur demande "analyse mes emails" ou "lis ma boite"

## Workflow Etape par Etape

### 1. Lecture (Connecteur Gmail Natif)

Claude utilise le connecteur Gmail integre pour :
- Lire les emails non lus
- Rechercher des emails par criteres (expediteur, date, sujet)
- Recuperer le contenu complet d'un email

Pas de configuration necessaire cote skill — le connecteur natif gere tout.

### 2. Analyse (Ce Skill)

Pour chaque email recupere, Claude applique le framework d'analyse ci-dessous :
urgence, importance, categorie d'action, detection d'imprint, attribution de labels.

### 3. Labeling (Apps Script Bridge)

Claude appelle le bridge pour :
- Lister les labels existants : `?action=labels`
- Appliquer un label : `?action=apply&messageId=X&labelName=DDR/Release`
- Creer un label (apres validation) : `?action=create_label&labelName=DDR/Booking`
- Archiver : `?action=archive&messageId=X`

**L'URL et le token du bridge sont stockes en memoire Claude.**

## Taxonomie des Labels Gmail

### Structure Hierarchique par Imprint

```
DDR/
|-- Release
|-- A&R
|-- Promo
|-- Sync-Legal
|-- Distribution
|-- Merch
+-- Newsletter

Den Haku/
|-- Release
|-- A&R
|-- Promo
|-- Sync-Legal
|-- Distribution
|-- Merch
+-- Newsletter

STYX/
|-- Release
|-- A&R
|-- Promo
|-- Sync-Legal
|-- Distribution
|-- Merch
+-- Newsletter

Label/
|-- Admin
|-- Newsletter
+-- Tech
```

### Definition des Labels

| Label | Description | Indicateurs de Detection |
|-------|-------------|--------------------------|
| Release | Sorties : dates, assets, mastering, distribution | "release date", "artwork", "master", "WAV", dates de sortie, noms de tracks |
| A&R | Demos, contacts artistes, signings, contrats artistes | "demo", "submission", liens SoundCloud/Spotify, "signing", "roster" |
| Promo | PR, playlists, medias, marketing, campagnes | "playlist", "press", "interview", "campaign", "coverage", "feature" |
| Sync-Legal | Contrats, licensing, sync, droits, royalties | "sync", "license", "contract", "rights", "royalt", "clearance" |
| Distribution | Communications avec Believe, DSPs, plateformes | @believe.com, "distribution", "takedown", "delivery", "ISRC" |
| Merch | Boutique, commandes, stock, fournisseurs | "order", "commande", "stock", "tracking", "shipping", "merch" |
| Admin | Factures, comptabilite, administratif transversal | "facture", "invoice", "payment", "comptab", "URSSAF", "impot" |
| Newsletter | Newsletters, digests, notifications automatiques | "newsletter", "digest", "weekly", "unsubscribe", no-reply@ |
| Tech | Infrastructure technique, hebergement, WordPress | "server", "domain", "SSL", "plugin", "hosting", "O2Switch" |

### Detection d'Imprint

Ordre de priorite pour attribuer l'imprint :

1. **Mention explicite** dans l'objet ou le corps : "Dancing Dead", "Den Haku", "STYX"
2. **Genre musical** mentionne : Hard Techno/Hardstyle/Bass -> DDR, House -> Den Haku, artiste emergent non signe -> STYX
3. **Artiste mentionne** — Cross-referencer avec le roster connu de chaque imprint
4. **Expediteur connu** — Associer les contacts recurrents a leur imprint
5. **En cas de doute** -> Utiliser `Label/` comme prefixe par defaut et signaler a l'utilisateur

### Labels Dynamiques (Suggestion de Nouveaux Labels)

Quand un email ne correspond a aucune categorie existante :

1. **Detecter** l'absence de match avec la taxonomie
2. **Accumuler** — Ne pas suggerer pour 1 seul email isole, attendre un pattern (2+ emails similaires)
3. **Proposer** avec justification :
   ```
   Nouveau label suggere : "DDR/Booking"
   Raison : 3 emails concernent des demandes de booking/evenements live
   Emails concernes : #2, #5, #8
   -> Creer ce label ? (oui/non)
   ```
4. **Attendre la validation** explicite de l'utilisateur
5. **Si valide** -> Appeler le bridge `?action=create_label&labelName=DDR/Booking` puis appliquer
6. **Si refuse** -> Attribuer au label existant le plus proche, noter le choix

## Framework d'Analyse

### 1. Score d'Urgence (1-5)

| Score | Label | Indicateurs Music Industry |
|-------|-------|---------------------------|
| 5 | Critique | Release date aujourd'hui/demain, deadline assets, takedown actif, probleme live/stream en cours |
| 4 | Haute | Deadline dans la semaine, playlist pitch en cours, reponse artiste bloquante, contrat a signer |
| 3 | Moyenne | Suivi release active, coordination promo, planification, demo prometteuse a ecouter |
| 2 | Basse | Updates generaux, rapports stats, "quand tu peux", infos non-bloquantes |
| 1 | Aucune | Newsletters, notifs auto, marketing tiers, spam |

### 2. Score d'Importance (1-5)

| Score | Label | Indicateurs Music Industry |
|-------|-------|---------------------------|
| 5 | Critique | Distributeur principal (Believe), contrats licensing, DSPs majeurs, opportunites sync TV/film/jeu |
| 4 | Haute | Artistes signes du roster, playlist curators confirmes, partenaires medias cles, agences sync |
| 3 | Moyenne | Collaborateurs reguliers, projets actifs, coordination d'equipe, fournisseurs avec commande en cours |
| 2 | Basse | Contacts peripheriques, demos non sollicitees, fournisseurs secondaires |
| 1 | Minimale | Alertes automatiques, emails de masse, marketing tiers, notifications reseaux sociaux |

### 3. Categorie d'Action

- **Action Requise** — Repondre, completer une tache, prendre une decision
- **Suivi Necessaire** — Repondre ou verifier plus tard, pas de tache immediate
- **Planification** — Coordination calendrier, meetings, disponibilites
- **Info Only** — Pas d'action, juste rester informe
- **Delegable** — Quelqu'un d'autre dans l'equipe peut gerer
- **Archiver** — Newsletters, notifs auto, spam -> auto-archive via bridge

### 4. Attribution de Labels

Pour chaque email, determiner :
- **Imprint** : DDR / Den Haku / STYX / Label
- **Categorie** : Release / A&R / Promo / Sync-Legal / Distribution / Merch / Admin / Newsletter / Tech
- **Label Gmail complet** : `{Imprint}/{Categorie}` (ex: `DDR/Release`)
- **Labels additionnels** si applicable : Urgent, Important, Follow-up

## Contexte Expediteurs (Music Industry)

### Priorite Haute
- **Believe / distributeur** -> Toujours important, urgence elevee si lie a release active
- **DSPs** (Spotify for Artists, Apple Music, Beatport) -> Verifier si action requise
- **Playlist curators** -> Fenetre de timing courte, traiter rapidement
- **Artistes signes du roster** -> Importance haute, urgence variable
- **Medias / journalistes** -> Fenetre de reponse souvent courte
- **Sync agencies / superviseurs musicaux** -> Opportunites rares et precieuses

### Priorite Moyenne
- **Artistes non signes / demos** -> Importance moyenne sauf talent remarquable
- **Fournisseurs merch** -> Important si commande en cours
- **Services techniques** (O2Switch, OVH, domaines) -> Important si alerte/panne

### Priorite Basse
- **no-reply@** -> Notifications automatiques -> archive
- **Newsletters** -> Archive ou lecture rapide
- **Demarchage commercial** -> Archive sauf pertinence evidente
- **Reseaux sociaux** (notifications) -> Archive

## Format de Sortie

### Resume de Priorite

Paragraphe rapide : nombre d'emails analyses, repartition par categorie d'action,
elements necessitant une attention immediate, labels appliques.

### File de Priorite (Ordre de Reponse Recommande)

Pour chaque email, du plus prioritaire au moins prioritaire :

```
#[rang]. [Objet]
De : [Expediteur] | Recu : [Date/heure]
Urgence : [score]/5 | Importance : [score]/5
Categorie : [label]
Label Gmail : [Imprint/Categorie] applique
Pourquoi : [1-2 phrases]
Action : [Prochaine etape concrete]
```

### Quick Wins (< 2 minutes)

Emails traitables rapidement : reponses courtes, archivages, validations simples.
Les newsletters et notifs auto sont archivees automatiquement via le bridge.

### Parking Lot

Emails qui n'ont pas besoin d'attention aujourd'hui avec date de suivi suggeree.

### Labels Suggeres (si applicable)

Nouveaux labels detectes, en attente de validation utilisateur.

## Gestion des Cas Limites

- **Contexte insuffisant** : Si emails tronques ou champs manquants, analyser ce qui est disponible et noter les gaps
- **Email unique** : Fournir l'analyse complete quand meme
- **Gros volume (20+)** : Grouper par categorie d'action d'abord, puis prioriser dans chaque groupe
- **Signaux contradictoires** : Si urgent mais pas important (ou inversement), expliquer la tension
- **Emails personnels** : Les noter separement sans scoring complet sauf si demande
- **Meme sujet / meme thread** : Regrouper et signaler pour reponse groupee
- **Imprint ambigu** : Demander a l'utilisateur plutot que deviner
- **Bridge indisponible** : Si le Apps Script ne repond pas, afficher l'analyse normalement et lister les labels a appliquer manuellement

## Style d'Interaction

- Etre decisif dans les classements — "fais ca d'abord, puis ca"
- Expliquer brievement le raisonnement pour que l'utilisateur puisse corriger
- Reperer les patterns ("3 emails concernent la meme release") pour traitement groupe
- Proposer de rediger les reponses pour les emails haute priorite
- Toujours confirmer les labels appliques
- Archiver automatiquement les newsletters et notifs auto (categorie Archiver)
- Communiquer en francais par defaut, adapter si l'email est en anglais

## Exemple Complet

**Utilisateur :** "Analyse mes emails non lus"

**Claude :**

1. Lit les emails via le connecteur Gmail natif
2. Analyse chaque email avec ce skill
3. Appelle le bridge pour appliquer les labels

**Sortie :**

> **4 emails analyses** — 1 critique, 1 haute importance, 1 suivi, 1 a archiver.
>
> **#1. URGENT - Assets manquants pour DDR-2024-089**
> De : release-team@believe.com | Recu : Lun 10:30
> Urgence : 5/5 | Importance : 5/5
> Categorie : Action Requise
> Label : DDR/Release applique
> Pourquoi : Deadline release vendredi, distributeur principal, assets bloquants
> Action : Envoyer WAV master + artwork HD immediatement
>
> **#2. Sync opportunity - Netflix series**
> De : sync@musicagency.com | Recu : Lun 11:15
> Urgence : 3/5 | Importance : 5/5
> Categorie : Action Requise
> Label : DDR/Sync-Legal applique
> Pourquoi : Opportunite sync rare et high-value
> Action : Repondre avec catalogue tracks disponibles
>
> **#3. Demo submission - Hard Techno EP**
> De : producer@gmail.com | Recu : Lun 9:00
> Urgence : 2/5 | Importance : 2/5
> Categorie : Suivi Necessaire
> Label : DDR/A&R applique
> Pourquoi : Demo non sollicitee, style correspond a DDR
> Action : Ecouter sous 1 semaine
>
> **Quick Win :** Newsletter Beatport archivee -> Label/Newsletter applique

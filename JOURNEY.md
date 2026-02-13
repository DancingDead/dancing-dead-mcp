# 🗺️ Parcours de Débogage : Authentification Spotify

Ce document retrace tout le parcours de résolution des problèmes d'authentification Spotify.

## 📅 Chronologie

### Problème 1 : "Server disconnected" ❌
**Symptôme** : Le serveur MCP ne démarre pas dans Claude Desktop.

**Cause** : Les variables d'environnement du fichier `.env` n'étaient pas chargées dans le mode stdio.

**Solution** :
- Ajout de `dotenv` dans `stdio-server.ts`
- Chargement explicite du fichier `.env`
- Code : `config({ path: resolve(projectRoot, ".env") })`

**Fichiers modifiés** :
- `src/stdio-server.ts`

---

### Problème 2 : "INVALID_CLIENT: Invalid redirect URI" ❌
**Symptôme** : Spotify rejette l'authentification avec "Invalid redirect URI".

**Causes explorées** :
1. ❌ Utilisation de `localhost` vs `127.0.0.1`
2. ❌ Redirect URI manquante du chemin `/spotify/callback`
3. ✅ Finalement : URI pas encore ajoutée dans le Spotify Dashboard

**Solution** :
- Utiliser `127.0.0.1` (Spotify n'accepte plus `localhost` dans certains cas)
- Ajouter exactement `http://127.0.0.1:3000/spotify/callback` dans le Dashboard
- Serveur écoute sur `0.0.0.0` pour accepter les deux

**Fichiers modifiés** :
- `.env` : `SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback`
- `src/servers/spotify/oauth-server.ts` : Écoute sur `0.0.0.0`

**Documentation créée** :
- `SPOTIFY_SETUP.md`
- `RESOLUTION_INVALID_CLIENT.md`

---

### Problème 3 : "Unexpected token 'C', Check sett..." ❌
**Symptôme** : Erreur de parsing JSON lors du callback OAuth.

**Cause** : Un serveur HTTP principal (`npm run dev`) tournait sur le port 3000, empêchant le serveur OAuth temporaire de démarrer. Le callback allait vers le mauvais serveur avec un vieux handler bugué.

**Solution** :
- Identifier le processus : `lsof -i :3000`
- Tuer le processus : `kill -9 <PID>`
- Créer un script de nettoyage : `scripts/cleanup-ports.sh`
- Règle : Ne JAMAIS lancer `npm run dev` en même temps que Claude Desktop

**Diagnostic** :
```bash
lsof -i :3000
# COMMAND   PID      USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# node    34493 theoherve   28u  IPv4  ...             TCP *:hbci (LISTEN)

kill -9 34493
```

**Fichiers créés** :
- `scripts/cleanup-ports.sh`
- `PROBLEM_SOLVED.md`

---

### Problème 4 : "invalid_grant" / "Invalid authorization code" ❌
**Symptôme** : Le code OAuth expire ou est invalide.

**Causes** :
1. Utilisateur trop lent (> 2-5 minutes)
2. Code réutilisé (page rafraîchie)
3. Serveur OAuth pas démarré avant le clic

**Solution** :
- Améliorer les messages pour confirmer que le serveur est prêt
- Ajouter `⚠️ IMPORTANT: Don't wait too long!` dans les instructions
- Serveur démarre AVANT de générer l'URL
- Meilleure gestion d'erreur avec logs détaillés

**Fichiers modifiés** :
- `src/servers/spotify/tools.ts` : Message amélioré
- `src/servers/spotify/auth.ts` : Meilleur error handling
- `src/servers/spotify/oauth-server.ts` : Logs détaillés

**Documentation créée** :
- `TROUBLESHOOT_INVALID_GRANT.md`

---

### Problème 5 : "403 User not registered" ⚠️ **ACTUEL**
**Symptôme** : Après autorisation Spotify, erreur 403 lors de la récupération du profil.

**Cause** : L'application Spotify est en **mode Development**. Seuls les utilisateurs explicitement ajoutés dans le Dashboard peuvent se connecter.

**Solution** :
1. Aller sur https://developer.spotify.com/dashboard
2. Sélectionner l'application
3. Settings → User Management
4. Ajouter l'email Spotify de l'utilisateur
5. Réessayer l'authentification

**Documentation créée** :
- `SPOTIFY_403_FIX.md`

---

## 🛠️ Outils Créés

### Scripts de Diagnostic
1. **`test-mcp.sh`** : Test les serveurs MCP (ping + spotify)
2. **`spotify-diagnostic.sh`** : Vérifie la configuration Spotify
3. **`test-oauth-url.ts`** : Génère et affiche l'URL OAuth
4. **`verify-spotify-credentials.ts`** : Teste les credentials avec l'API Spotify
5. **`debug-oauth-error.ts`** : Simule l'échange de token pour voir l'erreur exacte
6. **`cleanup-ports.sh`** : Nettoie les processus sur le port 3000

### Documentation
1. **`README.md`** : Vue d'ensemble du projet
2. **`QUICKSTART.md`** : Démarrage rapide
3. **`CLAUDE_DESKTOP_SETUP.md`** : Configuration Claude Desktop
4. **`SPOTIFY_SETUP.md`** : Configuration Spotify OAuth
5. **`RESOLUTION_INVALID_CLIENT.md`** : Résolution "INVALID_CLIENT"
6. **`TROUBLESHOOT_INVALID_GRANT.md`** : Résolution "invalid_grant"
7. **`PROBLEM_SOLVED.md`** : Résolution conflit de port
8. **`SPOTIFY_403_FIX.md`** : Résolution erreur 403
9. **`CHECKLIST.md`** : Checklist de vérification complète
10. **`FINAL_SETUP.md`** : Guide de configuration finale

### Améliorations du Code
1. **Chargement .env** dans stdio-server
2. **Logs détaillés** partout (`[oauth-server]`, `[auth]`)
3. **Error handling** robuste avec messages clairs
4. **Serveur OAuth temporaire** qui démarre automatiquement
5. **Messages utilisateur** plus clairs et instructifs

---

## 📊 Statut Actuel

### ✅ Ce qui Fonctionne
- ✅ Serveur MCP démarre dans Claude Desktop
- ✅ Variables d'environnement chargées
- ✅ Serveur OAuth temporaire démarre correctement
- ✅ Redirect URI correcte
- ✅ Credentials Spotify valides
- ✅ Échange code → tokens fonctionne
- ✅ Tokens reçus avec succès

### ⚠️ Problème Actuel
- ❌ Erreur 403 lors de `/me` : Utilisateur non enregistré dans le Dashboard

### 🎯 Prochaine Étape
**Ajouter l'email de l'utilisateur dans le Spotify Dashboard** (section User Management)

Une fois fait, l'authentification devrait être **complètement fonctionnelle** ! 🎉

---

## 🔍 Leçons Apprises

### 1. OAuth en Mode Stdio
OAuth est complexe en mode stdio car il nécessite un serveur HTTP pour le callback. Solution : serveur temporaire qui démarre automatiquement.

### 2. Conflit de Ports
Quand on développe un serveur qui doit tourner en stdio ET en HTTP, attention aux conflits de ports.

### 3. Mode Development Spotify
Les applications Spotify en mode Development nécessitent d'ajouter manuellement chaque utilisateur (max 25).

### 4. Importance du Logging
Des logs détaillés ont été **cruciaux** pour identifier chaque problème. Sans eux, on aurait tourné en rond.

### 5. Documentation Progressive
Créer de la documentation au fur et à mesure du débogage aide énormément pour les problèmes futurs.

---

## 🎸 État Final

### Architecture Fonctionnelle

```
┌─────────────────────┐
│  Claude Desktop     │
└──────────┬──────────┘
           │ stdio
           ↓
┌─────────────────────┐
│  stdio-server.ts    │
│  ├─ Load .env       │
│  ├─ Register tools  │
│  └─ Start OAuth srv │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  OAuth Server       │
│  (temporary)        │
│  Port: 3000         │
│  Listen: 0.0.0.0    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Spotify API        │
│  ├─ Token exchange  │
│  ├─ Get profile     │
│  └─ Store tokens    │
└─────────────────────┘
           │
           ↓
┌─────────────────────┐
│  data/              │
│  spotify-accounts   │
│  .json              │
└─────────────────────┘
```

### Fichiers Clés

**Configuration** :
- `.env` : Variables d'environnement
- `claude_desktop_config.json` : Config Claude Desktop

**Code Principal** :
- `src/stdio-server.ts` : Entry point pour Claude Desktop
- `src/servers/spotify/oauth-server.ts` : Serveur OAuth temporaire
- `src/servers/spotify/auth.ts` : Logique OAuth
- `src/servers/spotify/tools.ts` : 33 outils Spotify MCP

**Scripts** :
- `scripts/cleanup-ports.sh` : Nettoyage
- `scripts/spotify-diagnostic.sh` : Diagnostic
- `scripts/verify-spotify-credentials.ts` : Test credentials

**Documentation** :
- Voir liste complète ci-dessus

---

## 🎉 Une Fois le Problème 403 Résolu

L'infrastructure sera **complètement opérationnelle** et vous pourrez :

1. ✅ Connecter plusieurs comptes Spotify
2. ✅ Gérer des playlists
3. ✅ Contrôler la lecture
4. ✅ Chercher des morceaux
5. ✅ Gérer la bibliothèque
6. ✅ Obtenir des insights (top tracks, etc.)

**33 outils Spotify** seront disponibles dans Claude Desktop ! 🎸

---

📖 **Documentation Complète** : Voir README.md

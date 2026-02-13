# ✅ Configuration Finale - Résolution "INVALID_CLIENT"

## 🎯 Problème Résolu

L'erreur "INVALID_CLIENT: Invalid redirect URI" était causée par une **incompatibilité entre `localhost` et `127.0.0.1`**.

## 📝 Configuration Finale

### 1. Fichier `.env`
```env
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
```
✅ Utilise `127.0.0.1` (Spotify n'accepte plus `localhost` depuis les récentes mises à jour)

### 2. Spotify Dashboard

Allez sur https://developer.spotify.com/dashboard et ajoutez cette URI **EXACTEMENT** :

```
http://127.0.0.1:3000/spotify/callback
```

**Important** :
- ✅ Utilisez `127.0.0.1` (Spotify n'accepte plus `localhost`)
- ✅ Incluez `/spotify/callback` à la fin
- ✅ Pas de slash final après `callback`
- ✅ Utilisez le port `3000`

### 3. Code du Serveur OAuth

Les serveurs (principal et OAuth) écoutent sur `0.0.0.0`, ce qui accepte les connexions via :
- ✅ `http://127.0.0.1:3000` (utilisé pour Spotify)
- ✅ `http://localhost:3000` (pour debug local)

**Note** : Même si les logs affichent "localhost", le serveur accepte bien les connexions via `127.0.0.1`.

## 🚀 Étapes Finales

### 1. Redémarrez Claude Desktop
Fermez complètement Claude Desktop et relancez-le.

### 2. Testez l'Authentification

Dans Claude Desktop :
```
Use spotify-auth to connect account "dancing-dead"
```

### 3. Ouvrez l'URL

Un serveur OAuth temporaire va démarrer automatiquement. Ouvrez l'URL générée dans votre navigateur.

### 4. Autorisez l'Application

Connectez-vous à Spotify et autorisez l'application.

### 5. Vérifiez

```
Use spotify-accounts
```

Vous devriez voir votre compte connecté ! 🎉

## 🔍 Vérification Rapide

```bash
# Vérifier la configuration
npx tsx scripts/test-oauth-url.ts

# Tester les serveurs
./scripts/test-mcp.sh

# Diagnostic Spotify
./scripts/spotify-diagnostic.sh
```

## 🎸 Utilisation

Une fois authentifié :

```
# Rechercher
Use spotify-search to find "Flume"

# Créer une playlist
Use spotify-create-playlist with name "My Playlist"

# Lecture
Use spotify-now-playing
Use spotify-play

# Explorer
Use spotify-list-playlists
Use spotify-top-items with type "tracks"
```

## 📊 Architecture Finale

```
┌──────────────┐
│ Claude       │
│ Desktop      │
└──────┬───────┘
       │ stdio
       ↓
┌──────────────┐
│ stdio-server │  ← Lance automatiquement
│ (spotify)    │     le serveur OAuth
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ OAuth Server │  ← Écoute sur localhost:3000
│ (temporary)  │     pendant l'authentification
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Spotify    │
│   Web API    │
└──────────────┘
```

## 🐛 Si Problème Persiste

1. **Vérifiez le Client ID** :
   ```bash
   echo $SPOTIFY_CLIENT_ID
   ```
   Comparez avec votre Spotify Dashboard

2. **Vérifiez l'URI exacte** dans Spotify Dashboard :
   - Pas d'espaces
   - Pas de caractères invisibles
   - Exactement : `http://localhost:3000/spotify/callback`

3. **Regardez les logs** :
   - Claude Desktop → View → Developer Tools → Console
   - Ou testez : `npx tsx src/stdio-server.ts spotify`

4. **Testez l'URL manuellement** :
   ```bash
   npx tsx scripts/test-oauth-url.ts
   ```
   Copiez l'URL générée et testez-la dans votre navigateur

## ✨ Améliorations Apportées

- ✅ Serveur OAuth temporaire qui se lance automatiquement
- ✅ Écoute sur `0.0.0.0` (compatible localhost et 127.0.0.1)
- ✅ Logs détaillés pour le débogage
- ✅ Scripts de diagnostic
- ✅ Documentation complète
- ✅ Auto-shutdown du serveur après authentification

## 📚 Documentation Complète

- [README.md](./README.md) - Vue d'ensemble
- [QUICKSTART.md](./QUICKSTART.md) - Démarrage rapide
- [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md) - Configuration Spotify
- [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) - Configuration Claude Desktop

---

🎸 Bon coding avec Dancing Dead MCP !

# 🎯 Résolution "INVALID_CLIENT: Invalid redirect URI"

## Résumé du Problème

Spotify a récemment modifié ses règles de sécurité et **n'accepte plus `localhost`** comme redirect URI. Il faut maintenant utiliser **`127.0.0.1`**.

## ✅ Solution Finale

### Configuration Requise

**1. Dans votre Spotify Dashboard** :
```
http://127.0.0.1:3000/spotify/callback
```

**2. Dans votre fichier `.env`** :
```env
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
```

**3. Les serveurs écoutent sur `0.0.0.0`** (accepte tout), donc même si les logs disent "localhost", ça marche avec `127.0.0.1`.

### Étapes de Configuration

1. **Ouvrez votre Spotify Dashboard** :
   https://developer.spotify.com/dashboard

2. **Sélectionnez votre application**

3. **Cliquez sur "Edit Settings"**

4. **Dans "Redirect URIs", ajoutez** :
   ```
   http://127.0.0.1:3000/spotify/callback
   ```

5. **Cliquez "Add" puis "Save"**

6. **Vérifiez votre `.env`** :
   ```bash
   cat .env | grep REDIRECT
   ```
   Devrait afficher : `SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback`

7. **Redémarrez Claude Desktop**

8. **Testez** :
   ```
   Use spotify-auth to connect account "dancing-dead"
   ```

## 🔍 Vérification

```bash
# Voir l'URL OAuth générée
npx tsx scripts/test-oauth-url.ts

# Tester les serveurs MCP
./scripts/test-mcp.sh

# Diagnostic Spotify
./scripts/spotify-diagnostic.sh
```

## ⚠️ Points d'Attention

### ❌ Ne PAS utiliser
- `http://localhost:3000/spotify/callback` (Spotify rejette)
- `http://127.0.0.1:3000/` (sans `/spotify/callback`)
- `http://127.0.0.1:3000/spotify/callback/` (slash final)

### ✅ Utiliser EXACTEMENT
```
http://127.0.0.1:3000/spotify/callback
```

## 🐛 Autres Causes Possibles

### 1. Client ID incorrect
Vérifiez que le `SPOTIFY_CLIENT_ID` dans `.env` correspond à celui du dashboard.

```bash
# Afficher votre Client ID (premiers caractères)
echo $SPOTIFY_CLIENT_ID | cut -c1-10
```

Comparez avec votre Spotify Dashboard.

### 2. Redirect URI avec espaces ou caractères invisibles
Copiez-collez directement depuis ce document :
```
http://127.0.0.1:3000/spotify/callback
```

### 3. Application Spotify désactivée
Dans le dashboard, vérifiez que votre application est en mode "Development" ou "In Production".

### 4. Cache du navigateur
Si vous testez manuellement l'URL OAuth :
- Ouvrez en navigation privée
- Ou videz le cache Spotify : https://accounts.spotify.com/logout

## 📊 Flux d'Authentification

```
1. Claude Desktop lance spotify-auth
   ↓
2. Le serveur OAuth temporaire démarre sur 0.0.0.0:3000
   ↓
3. URL générée avec redirect_uri=http://127.0.0.1:3000/spotify/callback
   ↓
4. Utilisateur ouvre l'URL dans le navigateur
   ↓
5. Spotify redirige vers http://127.0.0.1:3000/spotify/callback?code=...
   ↓
6. Le serveur OAuth reçoit le code (car il écoute sur 0.0.0.0)
   ↓
7. Tokens échangés et stockés dans data/spotify-accounts.json
   ↓
8. Serveur OAuth s'arrête automatiquement
```

## 📝 Historique du Problème

### Tentative 1 : `localhost`
❌ Erreur : Spotify rejette (nouvelle politique)

### Tentative 2 : `127.0.0.1` mais serveur sur `127.0.0.1` seulement
❌ Erreur : Parfois le navigateur utilise localhost

### Solution Finale : `127.0.0.1` + serveur sur `0.0.0.0`
✅ Fonctionne : Le serveur accepte les deux, Spotify force 127.0.0.1

## 🎸 Après l'Authentification

Une fois connecté, testez vos outils Spotify :

```
# Lister les comptes
Use spotify-accounts

# Voir votre profil
Use spotify-whoami

# Rechercher
Use spotify-search to find "Flume"

# Créer une playlist
Use spotify-create-playlist with name "Test"

# Contrôle de lecture
Use spotify-now-playing
Use spotify-play
Use spotify-pause
```

## 📚 Documentation Complète

- [FINAL_SETUP.md](./FINAL_SETUP.md) - Guide complet
- [QUICKSTART.md](./QUICKSTART.md) - Démarrage rapide
- [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md) - Configuration Spotify détaillée
- [README.md](./README.md) - Vue d'ensemble

---

🎵 Bon code avec Dancing Dead MCP !

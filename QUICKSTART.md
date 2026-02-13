# 🚀 Quick Start - Dancing Dead MCP

## Résoudre "INVALID_CLIENT: Invalid redirect URI"

### Étape 1 : Configurer l'Application Spotify

1. **Allez sur le Spotify Dashboard :**
   https://developer.spotify.com/dashboard

2. **Créez une application** (si pas déjà fait) :
   - Nom : Dancing Dead MCP (ou autre)
   - Type : Web API

3. **Ajoutez l'URI de redirection** :
   - Cliquez sur "Edit Settings"
   - Dans "Redirect URIs", ajoutez EXACTEMENT :
     ```
     http://127.0.0.1:3000/spotify/callback
     ```
   - ⚠️ Utilisez `127.0.0.1` (Spotify n'accepte plus `localhost` depuis les récentes mises à jour)
   - Cliquez sur "Add" puis "Save"

4. **Copiez vos credentials** :
   - Client ID
   - Client Secret (cliquez "Show Client Secret")

### Étape 2 : Configurer le Projet

1. **Copiez `.env.example` vers `.env` :**
   ```bash
   cp .env.example .env
   ```

2. **Éditez `.env` avec vos credentials :**
   ```env
   SPOTIFY_CLIENT_ID=votre_client_id_ici
   SPOTIFY_CLIENT_SECRET=votre_client_secret_ici
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
   ```

3. **Installez les dépendances :**
   ```bash
   npm install
   ```

### Étape 3 : Tester la Configuration

```bash
# Vérifier la configuration
./scripts/spotify-diagnostic.sh

# Tester les serveurs MCP
./scripts/test-mcp.sh
```

### Étape 4 : Redémarrer Claude Desktop

Fermez complètement Claude Desktop et relancez-le.

### Étape 5 : Authentifier Spotify

Dans Claude Desktop :
```
Use spotify-auth to connect account "dancing-dead"
```

Suivez l'URL générée, autorisez l'application, et revenez à Claude Desktop.

### Étape 6 : Vérifier

```
Use spotify-accounts to list connected accounts
```

Vous devriez voir votre compte connecté !

## 🎸 Utilisation

Une fois authentifié, vous pouvez utiliser tous les outils Spotify :

```
# Rechercher une chanson
Use spotify-search to find "Flume"

# Créer une playlist
Use spotify-create-playlist with name "Test Playlist"

# Obtenir ce qui joue actuellement
Use spotify-now-playing

# Lire une playlist
Use spotify-play with context_uri "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"
```

## 📚 Guides Complets

- **[SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md)** - Configuration Spotify détaillée
- **[CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md)** - Configuration Claude Desktop

## 🐛 Dépannage

### "Server disconnected"
- Vérifiez que le fichier `.env` existe
- Exécutez `./scripts/spotify-diagnostic.sh`

### "INVALID_CLIENT: Invalid redirect URI"
- Vérifiez que l'URI est bien ajoutée dans le Spotify Dashboard
- Utilisez `127.0.0.1`, pas `localhost`
- Voir [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md)

### "No accounts connected"
- Utilisez `spotify-auth` pour connecter un compte
- Vérifiez les logs dans Developer Tools de Claude Desktop

## 🔧 Scripts Utiles

```bash
# Diagnostic Spotify
./scripts/spotify-diagnostic.sh

# Tester les serveurs MCP
./scripts/test-mcp.sh

# Lancer le serveur HTTP (optionnel)
npm run dev
```

## 🎯 Architecture

Ce projet supporte 2 modes :

1. **Mode Stdio** (Claude Desktop) - Lancé automatiquement
   - Serveur OAuth temporaire pour l'authentification
   - Communication via stdin/stdout

2. **Mode HTTP/SSE** (Serveur centralisé) - Optionnel
   - Lancez avec `npm run dev`
   - Endpoints : http://localhost:3000

Les deux modes partagent le même store de tokens (`data/spotify-accounts.json`).

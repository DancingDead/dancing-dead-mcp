# Configuration Claude Desktop pour Dancing Dead MCP

## Architecture

Ce projet supporte **deux modes** :

### 1. Mode HTTP/SSE (Serveur Centralisé)
- Serveur HTTP qui expose plusieurs serveurs MCP via SSE
- Démarrage : `npm run dev` ou `npm start`
- Endpoints :
  - `http://localhost:3000/spotify/sse`
  - `http://localhost:3000/ping/sse`

### 2. Mode Stdio (Compatible Claude Desktop)
- Chaque serveur MCP peut être lancé individuellement via stdio
- Utilisé par Claude Desktop pour communiquer avec les serveurs MCP

## Configuration Claude Desktop

Le fichier de configuration se trouve à :
- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux** : `~/.config/Claude/claude_desktop_config.json`

### Configuration Actuelle

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/theoherve/WebstormProjects/dancing-dead-mcp/src/stdio-server.ts",
        "spotify"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "ping": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/theoherve/WebstormProjects/dancing-dead-mcp/src/stdio-server.ts",
        "ping"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important** : Remplacez `/Users/theoherve/WebstormProjects/dancing-dead-mcp` par le chemin absolu vers votre projet.

## Variables d'Environnement

Assurez-vous d'avoir un fichier `.env` à la racine du projet avec :

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
```

## Test de la Configuration

1. **Redémarrer Claude Desktop** après avoir modifié `claude_desktop_config.json`

2. **Vérifier que les serveurs MCP sont détectés** dans Claude Desktop

3. **Tester avec une commande** :
   ```
   Use the ping tool to test connectivity
   ```

4. **Pour Spotify**, vous devrez d'abord vous authentifier :
   ```
   Use spotify-auth to connect account "my-account"
   ```

   ⚠️ **Important** : Si vous obtenez l'erreur "INVALID_CLIENT: Invalid redirect URI", consultez le guide [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md) pour configurer correctement votre application Spotify.

## Ajout d'un Nouveau Serveur MCP

Pour ajouter un nouveau serveur MCP au système :

1. **Créer le serveur dans** `src/servers/your-server/`

2. **Ajouter un case dans** `src/stdio-server.ts` :
   ```typescript
   case "your-server": {
     mcpServer = new McpServer({
       name: "your-server",
       version: "1.0.0",
     });
     // Register tools...
     break;
   }
   ```

3. **Ajouter dans** `claude_desktop_config.json` :
   ```json
   "your-server": {
     "command": "npx",
     "args": ["-y", "tsx", "/path/to/src/stdio-server.ts", "your-server"]
   }
   ```

## Dépannage

### Erreur "Server disconnected"
Le serveur ne démarre pas. Causes possibles :

1. **Fichier .env manquant** :
   - Copiez `.env.example` vers `.env`
   - Remplissez vos credentials Spotify

2. **Chemin incorrect** :
   - Vérifiez que le chemin absolu vers `stdio-server.ts` est correct
   - Utilisez `pwd` dans le terminal pour obtenir le chemin complet

3. **Dépendances manquantes** :
   - Exécutez `npm install` dans le projet

4. **Voir les logs** :
   - Les logs sont visibles dans les Developer Tools de Claude Desktop
   - Ou testez manuellement : `npx tsx src/stdio-server.ts spotify`

### Erreur "command required"
- Vérifiez que le fichier `claude_desktop_config.json` contient bien le champ `command`
- N'utilisez **pas** le champ `url` (ce n'est pas supporté par Claude Desktop)

### Serveur ne démarre pas
- Vérifiez que le chemin absolu vers `stdio-server.ts` est correct
- Vérifiez que `tsx` est installé : `npm install -g tsx` ou utilisez `npx`

### Variables d'environnement non chargées
- Le fichier `.env` doit être à la racine du projet
- Le serveur charge automatiquement `.env` via `dotenv`

# Configuration Spotify pour Dancing Dead MCP

## Erreur "INVALID_CLIENT: Invalid redirect URI"

Cette erreur signifie que Spotify rejette votre demande d'authentification. Causes possibles :

### 1. URI de redirection non enregistrée

**Votre `.env` contient :**
```env
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
```

**Vous devez enregistrer EXACTEMENT cette URI dans le Spotify Dashboard :**

1. Allez sur https://developer.spotify.com/dashboard
2. Cliquez sur votre application
3. Cliquez sur "Edit Settings"
4. Dans "Redirect URIs", ajoutez :
   ```
   http://127.0.0.1:3000/spotify/callback
   ```
   ⚠️ **Important** : Utilisez `127.0.0.1`, PAS `localhost` (Spotify les traite différemment)
5. Cliquez sur "Add"
6. Cliquez sur "Save" en bas de page

### 2. Client ID ou Secret incorrect

Vérifiez que vos credentials dans `.env` correspondent à celles du dashboard :

```env
SPOTIFY_CLIENT_ID=votre_client_id_ici
SPOTIFY_CLIENT_SECRET=votre_client_secret_ici
```

Pour les obtenir :
1. Allez sur https://developer.spotify.com/dashboard
2. Cliquez sur votre application
3. Copiez le "Client ID"
4. Cliquez sur "Show Client Secret" et copiez-le

### 3. Application Spotify non créée

Si vous n'avez pas encore d'application Spotify :

1. Allez sur https://developer.spotify.com/dashboard
2. Cliquez sur "Create app"
3. Remplissez :
   - **App name** : Dancing Dead MCP (ou autre nom)
   - **App description** : MCP server for Spotify integration
   - **Redirect URI** : `http://127.0.0.1:3000/spotify/callback`
   - **API/SDKs** : Web API
4. Acceptez les conditions
5. Cliquez sur "Save"
6. Notez le Client ID et Client Secret

## Vérification de la configuration

Exécutez ce script pour vérifier votre configuration :

```bash
# Afficher les variables d'environnement (sans les secrets)
echo "SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID:0:8}..."
echo "SPOTIFY_REDIRECT_URI=$SPOTIFY_REDIRECT_URI"
```

## Test de l'authentification

1. **Redémarrez Claude Desktop** pour charger la nouvelle configuration

2. **Testez l'authentification** :
   ```
   Use spotify-auth to connect account "dancing-dead"
   ```

3. **Suivez l'URL** générée et autorisez l'application

4. **Vérifiez** que le compte est connecté :
   ```
   Use spotify-accounts to list connected accounts
   ```

## Flux OAuth complet

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Claude    │────>│  OAuth URL   │────>│   Spotify   │
│  Desktop    │     │  (browser)   │     │   Login     │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ↓
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Tokens    │<────│   Callback   │<────│   Redirect  │
│   Stored    │     │   (server)   │     │   (browser) │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Dépannage

### Le navigateur affiche "This site can't be reached"

- Le serveur OAuth temporaire n'est pas démarré
- Vérifiez que Claude Desktop a bien lancé le serveur
- Regardez les logs dans Developer Tools

### "Account connected" mais les tools ne marchent pas

- Vérifiez que le compte est bien enregistré :
  ```
  Use spotify-accounts
  ```
- Vérifiez les scopes demandés (dans auth.ts)

### Les tokens expirent trop vite

- C'est normal, Spotify les rafraîchit automatiquement
- Le système gère le refresh automatiquement
- Si problème persistant, reconnectez le compte

## URLs de référence

- **Spotify Dashboard** : https://developer.spotify.com/dashboard
- **Documentation OAuth** : https://developer.spotify.com/documentation/web-api/concepts/authorization
- **API Reference** : https://developer.spotify.com/documentation/web-api

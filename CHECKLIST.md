# ✅ Checklist - Configuration Spotify OAuth

Utilisez cette checklist pour vérifier votre configuration étape par étape.

## 📋 Vérification de Base

### 1. Fichier `.env`

```bash
cat .env | grep SPOTIFY
```

**Doit afficher** :
```env
SPOTIFY_CLIENT_ID=votre_client_id_ici
SPOTIFY_CLIENT_SECRET=votre_secret_ici
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
```

- [ ] Client ID est renseigné
- [ ] Client Secret est renseigné
- [ ] Redirect URI = `http://127.0.0.1:3000/spotify/callback`
- [ ] Pas de slash final après `callback`
- [ ] Utilise `127.0.0.1` (pas `localhost`)

### 2. Spotify Dashboard

1. Allez sur https://developer.spotify.com/dashboard
2. Sélectionnez votre application
3. Cliquez sur "Edit Settings"
4. Vérifiez la section "Redirect URIs"

**Doit contenir** :
```
http://127.0.0.1:3000/spotify/callback
```

- [ ] URI exactement comme ci-dessus
- [ ] Pas de caractères invisibles
- [ ] URI a été "Save" (en bas de page)

### 3. Client ID Match

```bash
# Afficher les 10 premiers caractères de votre Client ID
cat .env | grep CLIENT_ID | cut -d= -f2 | cut -c1-10
```

- [ ] Ces caractères correspondent au début du Client ID dans le dashboard

## 🔧 Tests de Configuration

### Test 1 : Diagnostic
```bash
./scripts/spotify-diagnostic.sh
```

**Attendu** :
- ✅ SPOTIFY_CLIENT_ID
- ✅ SPOTIFY_CLIENT_SECRET
- ✅ SPOTIFY_REDIRECT_URI: http://127.0.0.1:3000/spotify/callback

- [ ] Toutes les variables sont présentes
- [ ] Redirect URI correcte

### Test 2 : OAuth URL
```bash
npx tsx scripts/test-oauth-url.ts
```

**Attendu** :
- redirect_uri: `http://127.0.0.1:3000/spotify/callback`

- [ ] URL générée contient la bonne redirect_uri

### Test 3 : Serveurs MCP
```bash
./scripts/test-mcp.sh
```

**Attendu** :
- ✓ ping server OK
- ✓ spotify server OK

- [ ] Les deux serveurs passent

## 🚀 Test d'Authentification

### Dans Claude Desktop

1. **Redémarrez Claude Desktop** (important !)
   - [ ] Claude Desktop complètement fermé et relancé

2. **Vérifiez les serveurs MCP**
   - [ ] Le serveur "spotify" apparaît dans la liste

3. **Lancez l'authentification** :
   ```
   Use spotify-auth to connect account "dancing-dead"
   ```

4. **Vérifiez la réponse**
   - [ ] URL OAuth générée
   - [ ] Message indique que le serveur OAuth temporaire démarre

5. **Ouvrez l'URL dans votre navigateur**
   - [ ] Page de login Spotify s'affiche
   - [ ] Pas d'erreur "INVALID_CLIENT"

6. **Autorisez l'application**
   - [ ] Liste des permissions s'affiche
   - [ ] Bouton "Accepter" ou "Authorize" visible

7. **Après autorisation**
   - [ ] Redirection vers `http://127.0.0.1:3000/spotify/callback`
   - [ ] Page affiche "✅ Account connected!"
   - [ ] Nom du compte affiché

8. **Retour à Claude Desktop**
   ```
   Use spotify-accounts
   ```
   - [ ] Compte "dancing-dead" apparaît dans la liste

9. **Test fonctionnel**
   ```
   Use spotify-whoami
   ```
   - [ ] Profil Spotify s'affiche

## 🐛 En Cas de Problème

### Erreur "INVALID_CLIENT"

**Causes possibles** :
1. [ ] Redirect URI incorrecte dans Spotify Dashboard
2. [ ] Client ID ne correspond pas
3. [ ] Modifications non sauvegardées dans le dashboard

**Actions** :
- Vérifiez chaque caractère de l'URI
- Comparez Client ID `.env` vs dashboard
- Re-sauvegardez dans le dashboard

### Erreur "This site can't be reached"

**Causes possibles** :
1. [ ] Serveur OAuth pas démarré
2. [ ] Port 3000 déjà utilisé

**Actions** :
```bash
# Vérifier si le port 3000 est utilisé
lsof -i :3000

# Si occupé, tuer le processus ou changer le port dans .env
```

### "Account connected" mais outils ne marchent pas

**Causes possibles** :
1. [ ] Scopes insuffisants

**Actions** :
```
Use spotify-remove-account with account_name "dancing-dead"
Use spotify-auth to connect account "dancing-dead"
```

## 📊 Statut Final

Une fois tout vérifié :

- [ ] ✅ Fichier `.env` correct
- [ ] ✅ Spotify Dashboard configuré
- [ ] ✅ Tests de diagnostic passent
- [ ] ✅ Authentification réussie
- [ ] ✅ Compte visible dans spotify-accounts
- [ ] ✅ Outils Spotify fonctionnels

## 🎸 Vous êtes prêt !

Si toutes les cases sont cochées, votre configuration est complète.

Testez vos outils :
```
Use spotify-search to find "Flume"
Use spotify-list-playlists
Use spotify-now-playing
Use spotify-create-playlist with name "Test MCP"
```

---

📖 Besoin d'aide ? Consultez :
- [RESOLUTION_INVALID_CLIENT.md](./RESOLUTION_INVALID_CLIENT.md) - Guide de résolution
- [FINAL_SETUP.md](./FINAL_SETUP.md) - Configuration complète
- [QUICKSTART.md](./QUICKSTART.md) - Démarrage rapide

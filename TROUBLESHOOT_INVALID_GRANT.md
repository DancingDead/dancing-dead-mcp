# 🔧 Dépannage : "invalid_grant" / "Invalid authorization code"

## 🐛 Symptôme

Erreur lors de l'authentification Spotify :
```
Error: Spotify token exchange failed (400)
{"error":"invalid_grant","error_description":"Invalid authorization code"}
```

Ou dans le navigateur :
```
Error
Unexpected token 'C', "Check sett"... is not valid JSON
```

## ✅ Bonne Nouvelle

Cette erreur signifie que votre configuration est **presque correcte** :
- ✅ Client ID valide
- ✅ Client Secret valide
- ✅ Redirect URI correcte dans le Dashboard
- ✅ Serveur OAuth fonctionne

## 🎯 Cause : Code d'Autorisation Expiré

Le code OAuth que Spotify génère **expire après quelques minutes** (généralement 2-5 minutes).

### Scénarios Possibles

#### Scénario A : Trop Lent 🐌
```
1. Vous cliquez sur l'URL OAuth
2. Vous attendez...
3. Vous autorisez Spotify
4. ⏰ 3-5 minutes se sont écoulées
5. Le code a expiré → ❌ invalid_grant
```

#### Scénario B : Code Déjà Utilisé 🔄
```
1. Vous autorisez Spotify
2. Erreur se produit
3. Vous rafraîchissez la page callback
4. Le même code est réutilisé → ❌ invalid_grant
```

#### Scénario C : Port Déjà Utilisé 🔌 ⚠️ **CAUSE LA PLUS FRÉQUENTE**
```
1. Vous avez lancé npm run dev (serveur HTTP principal)
2. Serveur OAuth temporaire essaie de démarrer sur port 3000
3. ❌ Port déjà occupé → Serveur OAuth ne démarre pas
4. Callback va vers l'ANCIEN serveur HTTP
5. Ancien handler (auth.ts:204) sans bonne gestion d'erreur
6. ❌ Erreur "Check sett..." (HTML parsé comme JSON)
```

**C'EST PROBABLEMENT VOTRE PROBLÈME SI** :
- Vous voyez l'erreur `auth.ts:204` dans les logs
- Vous avez lancé `npm run dev` ou `npm start`
- Vous avez un serveur Node qui tourne en arrière-plan

## ✅ Solutions

### Solution 1 : Aller Plus Vite ⚡

**Quand vous voyez l'URL OAuth** :

1. ✅ **Vérifiez le message** : `OAuth server ready on port 3000`
2. ⚡ **Cliquez immédiatement** sur l'URL
3. ⚡ **Autorisez rapidement** (ne fermez pas la fenêtre)
4. ✅ **Attendez la redirection** complète

**Timing recommandé** : < 2 minutes entre le clic et l'autorisation

### Solution 2 : Ne PAS Rafraîchir la Page ❌

Si vous voyez une erreur dans le navigateur :
- ❌ **NE rafraîchissez PAS** la page
- ❌ **NE cliquez PAS** sur "Retour"
- ✅ **Retournez à Claude Desktop** et recommencez

### Solution 3 : Libérer le Port 3000 🔌 ⚠️ **ESSAYEZ CECI EN PREMIER**

**C'est la cause la plus fréquente du problème !**

#### Option A : Script de Nettoyage (Recommandé)

```bash
./scripts/cleanup-ports.sh
```

#### Option B : Manuel

Vérifiez si le port est déjà utilisé :

```bash
# macOS/Linux
lsof -i :3000
```

Si vous voyez un processus :
```bash
# Tuez le processus (remplacez <PID> par le numéro affiché)
kill -9 <PID>
```

**Important** :
- ❌ N'exécutez PAS `npm run dev` quand vous utilisez Claude Desktop
- ✅ Claude Desktop lance ses propres serveurs automatiquement

#### Option C : Changer le Port (Si Vraiment Nécessaire)

Si vous DEVEZ garder le port 3000 occupé :

```bash
# Dans .env
PORT=3001
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/spotify/callback
```

Puis ajoutez cette nouvelle URI dans le Spotify Dashboard.

### Solution 4 : Restart Complet 🔄

```bash
# 1. Fermez complètement Claude Desktop
# 2. Vérifiez qu'aucun processus Node ne tourne
ps aux | grep node

# 3. Tuez tous les processus node si nécessaire
killall node

# 4. Relancez Claude Desktop
# 5. Réessayez l'authentification
```

## 🧪 Test de Diagnostic

### Étape 1 : Vérifier les Credentials
```bash
npx tsx scripts/verify-spotify-credentials.ts
```
**Attendu** : ✅ SUCCESS! Credentials are valid!

### Étape 2 : Vérifier le Redirect URI
```bash
npx tsx scripts/debug-oauth-error.ts
```
**Attendu** : "The redirect URI is CORRECT!"

### Étape 3 : Tester le Port
```bash
lsof -i :3000
```
**Attendu** : Aucun processus (ou le serveur MCP attendu)

## 📋 Checklist Avant de Réessayer

- [ ] Credentials vérifiés (script verify-spotify-credentials.ts)
- [ ] Redirect URI vérifiée (script debug-oauth-error.ts)
- [ ] Port 3000 libre (ou PORT changé dans .env)
- [ ] Claude Desktop redémarré
- [ ] Prêt à aller VITE (< 2 minutes)

## 🚀 Processus Recommandé

### Avant de Commencer
```bash
# Vérifier la config
./scripts/spotify-diagnostic.sh

# Vérifier le port
lsof -i :3000
```

### Dans Claude Desktop

1. **Lancez l'authentification** :
   ```
   Use spotify-auth to connect account "dancing-dead"
   ```

2. **Vérifiez le message** :
   - ✅ `OAuth server ready on port 3000`
   - Si vous ne voyez pas ce message → problème avec le serveur

3. **Cliquez IMMÉDIATEMENT** sur l'URL

4. **Autorisez RAPIDEMENT** :
   - Login Spotify
   - Cliquez "Accepter"/"Authorize"
   - Ne fermez pas la fenêtre

5. **Attendez la redirection** :
   - URL change vers `http://127.0.0.1:3000/spotify/callback?code=...`
   - Page affiche "✅ Account connected!"

6. **Retournez à Claude Desktop** :
   ```
   Use spotify-accounts
   ```

## 🐛 Si Ça Ne Marche Toujours Pas

### Vérifiez les Logs Complets

Dans Claude Desktop :
1. View → Developer Tools → Console
2. Cherchez les messages `[oauth-server]` et `[auth]`

**Messages attendus** :
```
[oauth-server] Temporary OAuth server started on http://localhost:3000
[oauth-server] Exchanging code for tokens...
[oauth-server] Tokens received successfully
[oauth-server] Fetching Spotify profile...
[oauth-server] Profile fetched: YourName
[oauth-server] Account "dancing-dead" saved successfully
```

**Si vous voyez** :
- `Port already in use` → Solution 3 (changer le port)
- `Token exchange failed (400)` → Code expiré, réessayez plus vite
- `invalid_client` → Problème de credentials (vérifiez le dashboard)

### Créez un Rapport de Bug

Si rien ne fonctionne, collectez ces infos :

```bash
# 1. Configuration
./scripts/spotify-diagnostic.sh > debug.txt

# 2. Test credentials
npx tsx scripts/verify-spotify-credentials.ts >> debug.txt

# 3. Test redirect URI
npx tsx scripts/debug-oauth-error.ts >> debug.txt

# 4. Port status
lsof -i :3000 >> debug.txt

# 5. Partagez debug.txt
```

## 📚 Documentation Connexe

- [RESOLUTION_INVALID_CLIENT.md](./RESOLUTION_INVALID_CLIENT.md) - Si "INVALID_CLIENT"
- [CHECKLIST.md](./CHECKLIST.md) - Checklist complète
- [FINAL_SETUP.md](./FINAL_SETUP.md) - Configuration finale

---

⏱️ **Conseil Principal** : Soyez RAPIDE entre le clic sur l'URL et l'autorisation Spotify !

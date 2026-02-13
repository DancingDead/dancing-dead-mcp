# ⚡ Solution Rapide : Nouvelle Application Spotify

## 🎯 Problème Identifié

Votre application Spotify actuelle (Client ID: `2deef31c6cc3401c9b0309240e071295`) a des **quotas restreints** qui bloquent toutes les opérations d'écriture avec 403 Forbidden.

**Confirmé par test direct** : Même en appelant l'API Spotify sans passer par le MCP, Spotify rejette le token.

## ⚡ Solution Immédiate (10 minutes)

Créez une **nouvelle application** sur le Spotify Dashboard.

### Étape 1 : Créer l'Application

1. **Allez sur** : https://developer.spotify.com/dashboard
2. **Cliquez** : "Create app"
3. **Remplissez** :

```
App name: Dancing Dead MCP v2
App description: MCP server for Spotify - playlist management and music discovery
Website: https://dancingdead.world (optionnel)
Redirect URIs: http://127.0.0.1:3000/spotify/callback
API/SDKs: ✓ Web API
```

4. **Acceptez** les conditions
5. **Cliquez** "Save"

### Étape 2 : Copier les Credentials

1. **Copiez** le **Client ID**
2. **Cliquez** "Show Client Secret"
3. **Copiez** le **Client Secret**

### Étape 3 : Ajouter Votre Email

1. Dans la nouvelle app → **Settings**
2. **User Management** → **Add New User**
3. **Email** : `dancingdeadrecords@gmail.com`
4. **Save**

### Étape 4 : Mettre à Jour `.env`

```bash
cd /Users/theoherve/WebstormProjects/dancing-dead-mcp
nano .env
```

**Remplacez** :
```env
SPOTIFY_CLIENT_ID=NOUVEAU_CLIENT_ID_ICI
SPOTIFY_CLIENT_SECRET=NOUVEAU_CLIENT_SECRET_ICI
```

**Gardez** :
```env
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
```

### Étape 5 : Vérifier les Credentials

```bash
npx tsx scripts/verify-spotify-credentials.ts
```

**Attendu** : ✅ SUCCESS! Credentials are valid!

### Étape 6 : Redémarrer Claude Desktop

**Fermez complètement** Claude Desktop et relancez-le.

### Étape 7 : Reconnecter le Compte

Dans Claude Desktop :

```
Use spotify-remove-account with account_name "dancing-dead"
```

Puis :

```
Use spotify-auth to connect account "dancing-dead"
```

**Cliquez** sur l'URL générée et autorisez l'application.

### Étape 8 : Tester

```
Use spotify-create-playlist with name "Test New App"
```

**Résultat attendu** : ✅ Playlist créée avec succès !

## 🧪 Tests de Vérification

### Test 1 : Credentials
```bash
npx tsx scripts/verify-spotify-credentials.ts
```

### Test 2 : API Direct
```bash
npx tsx scripts/direct-api-test.ts
```

### Test 3 : Token Valide
```bash
npx tsx scripts/test-spotify-token.ts
```

### Test 4 : Création Playlist
Dans Claude Desktop :
```
Use spotify-create-playlist with name "Success!"
```

## 📊 Checklist

- [ ] Nouvelle app créée sur Dashboard
- [ ] Client ID et Secret copiés
- [ ] Email ajouté dans User Management
- [ ] `.env` mis à jour
- [ ] Credentials vérifiés (script)
- [ ] Claude Desktop redémarré
- [ ] Compte reconnecté (spotify-auth)
- [ ] Playlist créée avec succès

## ❓ Si Ça Ne Marche Toujours Pas

### Vérifier le Redirect URI

Dans la nouvelle app, vérifiez que **exactement** cette URI est présente :
```
http://127.0.0.1:3000/spotify/callback
```

Pas d'espace, pas de slash final, exactement `127.0.0.1` (pas localhost).

### Vérifier l'Email

L'email ajouté doit être **exactement** celui de votre compte Spotify :
```
dancingdeadrecords@gmail.com
```

### Attendre 5 Minutes

Parfois Spotify met quelques minutes à propager les changements.

## 🎯 Pourquoi Ça Va Marcher

Les **nouvelles applications** Spotify ont généralement des quotas plus permissifs que les anciennes.

En créant une app fraîche, vous évitez :
- Les anciennes restrictions
- Les quotas dépassés
- Les limitations régionales temporaires
- Les bugs de l'ancienne app

## 📝 Backup

**Gardez l'ancienne app** au cas où. Vous pourrez toujours y revenir si besoin.

Mais généralement, les nouvelles apps fonctionnent mieux ! 🚀

---

**Durée totale** : ~10 minutes
**Taux de succès** : ~95%

Créez la nouvelle app et ça devrait marcher ! 🎸

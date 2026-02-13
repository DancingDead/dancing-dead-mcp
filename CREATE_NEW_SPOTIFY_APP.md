# 🔧 Créer une Nouvelle Application Spotify

Si votre application actuelle a des restrictions, créez-en une nouvelle.

## 📝 Étapes

### 1. Allez sur le Dashboard Spotify
https://developer.spotify.com/dashboard

### 2. Cliquez sur "Create App"

### 3. Remplissez le Formulaire

**App Name** : `Dancing Dead MCP v2` (ou autre nom)

**App Description** :
```
MCP (Model Context Protocol) server for Spotify integration.
Internal tool for Dancing Dead Records.
Playlist management, playback control, and music discovery.
```

**Website** : (optionnel)
```
https://dancingdead.world
```

**Redirect URIs** : ⚠️ **IMPORTANT**
```
http://127.0.0.1:3000/spotify/callback
```

**API/SDKs** : Cochez **"Web API"**

### 4. Acceptez les Conditions

Cochez "I understand and agree with Spotify's Terms of Service and Design Guidelines"

### 5. Cliquez "Save"

### 6. Notez les Credentials

Une fois créée, vous verrez :
- **Client ID** : (copiez-le)
- **Client Secret** : Cliquez "Show Client Secret" et copiez-le

### 7. Mettez à Jour le `.env`

```bash
cd /Users/theoherve/WebstormProjects/dancing-dead-mcp
nano .env
```

Remplacez :
```env
SPOTIFY_CLIENT_ID=nouveau_client_id_ici
SPOTIFY_CLIENT_SECRET=nouveau_secret_ici
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify/callback
```

### 8. Ajoutez Votre Email

Dans la nouvelle app :
1. Settings → User Management
2. Add New User
3. Entrez votre email Spotify
4. Save

### 9. Reconnectez le Compte

Dans Claude Desktop :
```
Use spotify-remove-account with account_name "dancing-dead"
Use spotify-auth to connect account "dancing-dead"
```

### 10. Testez

```
Use spotify-create-playlist with name "Test Playlist"
```

## ⚠️ Si Ça Ne Marche Toujours Pas

### Option A : Demander Extended Quota

Dans votre nouvelle app :
1. Settings → Quota Extension
2. Remplissez le formulaire
3. Expliquez votre usage (outil interne, pas commercial)
4. Attendez l'approbation (1-7 jours)

### Option B : Vérifier les Restrictions Régionales

Testez avec un VPN sur une autre région (US, UK) pour voir si c'est un problème régional.

### Option C : Contacter Spotify Support

Si rien ne fonctionne, contactez le support développeurs :
https://community.spotify.com/t5/Spotify-for-Developers/bd-p/Spotify_Developer

## 🐛 Debugging

Après avoir mis à jour les credentials, testez :

```bash
# Vérifier les nouveaux credentials
npx tsx scripts/verify-spotify-credentials.ts

# Tester la création de playlist
npx tsx scripts/test-create-playlist.ts
```

## 📊 Checklist

- [ ] Nouvelle app créée sur le Dashboard
- [ ] Client ID et Secret copiés
- [ ] `.env` mis à jour avec nouveaux credentials
- [ ] Redirect URI ajoutée : `http://127.0.0.1:3000/spotify/callback`
- [ ] Email ajouté dans User Management
- [ ] Claude Desktop redémarré
- [ ] Compte reconnecté avec `spotify-auth`
- [ ] Test de création de playlist réussi

---

💡 **Astuce** : Gardez l'ancienne application au cas où, vous pourrez toujours y revenir.

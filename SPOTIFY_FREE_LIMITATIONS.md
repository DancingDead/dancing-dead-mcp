# 🎵 Spotify FREE vs Premium - Limitations de l'API

## 🔍 Détection de Votre Type de Compte

Pour vérifier votre type de compte :
```bash
npx tsx scripts/test-spotify-token.ts
```

Recherchez la ligne :
```
Product: free    # ou "premium"
```

## 📊 Comparaison des Fonctionnalités

### ✅ Fonctionnalités Disponibles en FREE

#### Métadonnées & Recherche
- ✅ `spotify-search` - Rechercher tracks, albums, artists, playlists
- ✅ `spotify-get-track` - Obtenir les détails d'une track
- ✅ `spotify-get-album` - Obtenir les détails d'un album
- ✅ `spotify-get-album-tracks` - Lister les tracks d'un album
- ✅ `spotify-get-artist` - Obtenir les détails d'un artiste
- ✅ `spotify-get-artist-albums` - Lister les albums d'un artiste

#### Profil & Account
- ✅ `spotify-whoami` - Voir votre profil
- ✅ `spotify-accounts` - Lister les comptes connectés
- ✅ `spotify-auth` - Connecter un nouveau compte

#### Playlists (Lecture Seule)
- ✅ `spotify-list-playlists` - Lister vos playlists
- ✅ `spotify-get-playlist-items` - Voir les tracks d'une playlist

#### Insights
- ✅ `spotify-top-items` - Vos top tracks/artists
- ✅ `spotify-recently-played` - Historique d'écoute
- ✅ `spotify-saved-tracks` - Voir vos tracks likées

### ❌ Fonctionnalités Premium Uniquement

#### Modification de Playlists
- ❌ `spotify-create-playlist` - Créer une playlist
- ❌ `spotify-update-playlist` - Modifier une playlist
- ❌ `spotify-add-to-playlist` - Ajouter des tracks
- ❌ `spotify-remove-from-playlist` - Retirer des tracks
- ❌ `spotify-reorder-playlist` - Réorganiser les tracks
- ❌ `spotify-update-playlist-cover` - Changer la cover

#### Contrôle de Lecture
- ❌ `spotify-play` - Lancer la lecture
- ❌ `spotify-pause` - Mettre en pause
- ❌ `spotify-next` - Track suivante
- ❌ `spotify-previous` - Track précédente
- ❌ `spotify-set-volume` - Changer le volume
- ❌ `spotify-devices` - Gérer les appareils

#### Queue
- ❌ `spotify-add-to-queue` - Ajouter à la queue
- ❌ `spotify-get-queue` - Voir la queue

#### État de Lecture
- ❌ `spotify-now-playing` - Lecture en cours
- ❌ `spotify-playback-state` - État complet de lecture

#### Bibliothèque (Modification)
- ❌ `spotify-save-tracks` - Liker des tracks via API
- ❌ `spotify-remove-saved-tracks` - Unliker des tracks via API

## ⚠️ Erreurs Typiques avec un Compte FREE

### Erreur 403 Forbidden

```
Error: Failed to ... : 403 Forbidden
Premium required
```

**Cause** : Vous essayez d'utiliser une fonctionnalité Premium avec un compte FREE.

**Solution** :
1. Upgrade vers Spotify Premium
2. Ou utilisez l'alternative manuelle (voir ci-dessous)

### Erreur 404 Player Not Found

```
Error: No active device found
```

**Cause** : Les fonctionnalités de lecture ne sont pas disponibles en FREE via l'API.

## 💡 Alternatives pour Comptes FREE

### 1. Lecture Seule des Données

Utilisez le MCP pour :
- 🔍 Rechercher et découvrir de la musique
- 📊 Analyser vos habitudes d'écoute
- 📝 Extraire des listes de tracks pour usage externe
- 🎨 Récupérer des métadonnées pour d'autres projets

### 2. Export vers Fichiers

Créez des fichiers avec les URIs Spotify pour manipulation manuelle :

```typescript
// Dans Claude Desktop
Use spotify-search to find "Naeleck"

// Puis demandez :
"Export these track URIs to a file"
```

Le fichier généré peut être utilisé pour :
- Créer manuellement une playlist dans l'app Spotify
- Partager avec d'autres
- Importer dans d'autres outils

### 3. Utilisation Hybride

**Avec MCP (FREE)** :
- Recherche et découverte
- Analyse de données
- Export de listes

**Manuellement dans Spotify** :
- Création de playlists
- Modification de bibliothèque
- Contrôle de lecture

## 🎯 Exemple : Créer une Playlist en Mode FREE

### Étape 1 : Recherche avec MCP
```
Use spotify-search to find tracks by "Naeleck"
Use spotify-get-artist-albums for artist "2DYDFBqoaBP2i9XrTGpOgF"
```

### Étape 2 : Export des URIs
Les URIs sont sauvegardées dans un fichier :
```
naeleck-playlist.txt
```

### Étape 3 : Création Manuelle
1. Ouvrez Spotify (app ou web)
2. Créez une nouvelle playlist
3. Pour chaque URL dans le fichier :
   - Cliquez sur le lien
   - Ajoutez à votre playlist

## 📈 Upgrade vers Premium

### Avantages pour le MCP
- ✅ Toutes les fonctionnalités MCP disponibles
- ✅ Contrôle complet de la lecture
- ✅ Gestion automatique des playlists
- ✅ Modification de la bibliothèque via API

### Prix Spotify Premium
- **Individuel** : ~10€/mois
- **Étudiant** : ~5€/mois
- **Famille** : ~16€/mois (jusqu'à 6 comptes)

### Comment Upgrader
1. Allez sur https://www.spotify.com/premium/
2. Choisissez votre plan
3. Une fois Premium activé, reconnectez votre compte :
   ```
   Use spotify-remove-account with account_name "dancing-dead"
   Use spotify-auth to connect account "dancing-dead"
   ```

## 🔧 Vérifier Votre Type de Compte

```bash
# Script de diagnostic
npx tsx scripts/test-spotify-token.ts
```

Ou via l'API :
```
Use spotify-whoami
```

Recherchez le champ `product` :
- `free` = Compte gratuit
- `premium` = Compte Premium
- `open` = Compte libre (certaines régions)

## 📚 Documentation Spotify

- **API Scopes** : https://developer.spotify.com/documentation/web-api/concepts/scopes
- **Premium Features** : https://www.spotify.com/premium/
- **API Reference** : https://developer.spotify.com/documentation/web-api

## 🎸 Résumé

| Feature | FREE | Premium |
|---------|------|---------|
| Recherche | ✅ | ✅ |
| Métadonnées | ✅ | ✅ |
| Top Items | ✅ | ✅ |
| Lire Playlists | ✅ | ✅ |
| **Créer Playlists** | ❌ | ✅ |
| **Modifier Playlists** | ❌ | ✅ |
| **Contrôle Lecture** | ❌ | ✅ |
| **Gérer Queue** | ❌ | ✅ |

---

💡 **Conseil** : Même avec un compte FREE, le MCP Spotify est utile pour la recherche, l'analyse et l'export de données musicales !

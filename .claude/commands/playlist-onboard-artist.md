## Workflow : Onboard un nouvel artiste dans le catalogue

Ajoute un artiste au catalogue Dancing Dead Records et intègre ses tracks dans les playlists gérées.

### Argument
L'artiste à onboard : $ARGUMENTS (nom, ID Spotify, URI ou URL)

### Étapes

1. **Identification** : Si un nom est donné (pas un ID), utilise `spotify-search` pour trouver l'artiste et confirmer l'identité

2. **Ajout au catalogue** : Lance `playlist-catalog-add-artist` avec `include_tracks: true` pour ajouter l'artiste et tous ses tracks

3. **Audit des playlists** : Pour chaque playlist gérée (depuis `playlist://overview`) :
   - Vérifie si des tracks de cet artiste sont déjà présentes
   - Identifie les playlists où ses tracks pourraient s'intégrer (par genre, énergie, popularité)

4. **Recommandations d'intégration** :
   Pour chaque track de l'artiste avec une popularité > 30, évalue :
   - Dans quelle(s) playlist(s) elle pourrait aller
   - À quelle position (pour le flow)
   - Quel track elle pourrait remplacer (si la playlist est déjà bien remplie)

5. **Présentation** :

```
=== ONBOARDING : [Nom Artiste] ===
Genres : [genres]
Tracks dans le catalogue : N

--- INTÉGRATION RECOMMANDÉE ---

Playlist "[Nom]" :
  + [Track A] (pop: X) → position Y
    Raison : [explication]

  ~ SWAP [Track existante] → [Track artiste]
    Raison : [explication]

Playlist "[Nom 2]" :
  + [Track B] (pop: X) → position Y
    Raison : [explication]

--- PAS D'INTÉGRATION ---
[Tracks qui ne correspondent à aucune playlist actuelle]
```

6. **Logger** chaque recommandation avec `playlist-recommend`
7. **Attendre confirmation** avant d'exécuter les changements

### Notes
- Ne pas forcer l'intégration si les tracks ne correspondent pas au style des playlists
- Prioriser les tracks les plus populaires de l'artiste
- Maximum 2-3 tracks par playlist pour ne pas déséquilibrer

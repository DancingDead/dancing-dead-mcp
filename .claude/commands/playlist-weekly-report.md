## Workflow : Rapport hebdomadaire des playlists

Génère un rapport complet de l'état des playlists Dancing Dead Records.

### Étapes

1. **Snapshots frais** : Lance `/playlist-snapshot-all` pour capturer l'état actuel de toutes les playlists

2. **Pour chaque playlist gérée**, collecte :
   - `playlist-analyze` pour les métriques actuelles
   - `playlist-diff` pour les changements depuis le dernier rapport

3. **Rapport global** avec ce format :

```
=== RAPPORT HEBDO - Dancing Dead Records ===
Date : [date du jour]

--- VUE D'ENSEMBLE ---
Playlists gérées : N
Total tracks : X
Total followers combinés : Y

--- PAR PLAYLIST ---

## [Nom Playlist 1]
- Tracks : X (±N depuis dernier snapshot)
- Followers : Y (±N)
- Popularité moyenne : Z
- Changements : [tracks ajoutées/retirées]
- Points d'attention : [tracks faibles, dips d'énergie]

## [Nom Playlist 2]
...

--- RECOMMANDATIONS PRIORITAIRES ---
1. [Recommandation la plus urgente]
2. [Deuxième recommandation]
3. [Troisième recommandation]

--- RECOMMANDATIONS EN ATTENTE ---
[Liste des recommandations non appliquées depuis playlist://recommendations]

--- ACTIONS SUGGÉRÉES CETTE SEMAINE ---
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
```

4. **Logger les nouvelles recommandations** avec `playlist-recommend`

### Notes
- Ce rapport doit être concis mais actionable
- Mettre en avant les changements significatifs (>5% de variation)
- Prioriser les recommandations par impact attendu

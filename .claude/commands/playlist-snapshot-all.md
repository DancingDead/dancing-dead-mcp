## Workflow : Snapshot de toutes les playlists gérées

Prends un snapshot de chaque playlist trackée par Dancing Dead Records.

### Étapes

1. Lis la resource `playlist://overview` pour lister toutes les playlists gérées
2. Si aucune playlist n'est trackée, indique-le et propose d'en ajouter avec `playlist-catalog-add-playlist`
3. Pour chaque playlist trouvée, lance `playlist-snapshot` avec son ID
4. À la fin, affiche un résumé :

```
=== Snapshots terminés ===
[nom playlist 1] - [X tracks] - [Y followers]
[nom playlist 2] - [X tracks] - [Y followers]
...
Total : N playlists mises à jour
```

5. S'il y a des diffs notables depuis le dernier snapshot, mentionne-les brièvement

### Notes
- Ne pas analyser en détail, juste capturer l'état
- Si une playlist échoue, continuer avec les autres et noter l'erreur
- Exécute les snapshots séquentiellement (pas besoin de paralléliser)

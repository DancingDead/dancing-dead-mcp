# 🔧 Fix : Erreur 403 "User not registered"

## 🐛 Symptôme

Après avoir autorisé l'application Spotify :

```
❌ Authentication Error
Failed to fetch Spotify profile: 403
Check settings on developer.spotify.com/dashboard,
the user may not be registered.
```

## ✅ Bonne Nouvelle !

Cela signifie que **presque tout fonctionne** :
- ✅ Serveur OAuth OK
- ✅ Redirect URI OK
- ✅ Credentials OK
- ✅ Tokens reçus avec succès
- ❌ Mais l'utilisateur n'est pas autorisé

## 🎯 La Cause

Votre application Spotify est en **mode Development**. Dans ce mode, seuls les utilisateurs **explicitement ajoutés** dans le Dashboard peuvent utiliser l'application.

## ✅ Solution : Ajouter l'Utilisateur au Dashboard

### Étapes Détaillées

1. **Allez sur le Spotify Dashboard**
   ```
   https://developer.spotify.com/dashboard
   ```

2. **Connectez-vous** avec votre compte Spotify développeur

3. **Sélectionnez votre application**
   (Celle avec le Client ID: 2deef31c6cc3401c9b0309240e071295)

4. **Cliquez sur "Settings"** (en haut à droite)

5. **Scrollez jusqu'à "User Management"**

   Vous devriez voir une section avec :
   - Titre : "User Management" ou "Users"
   - Bouton : "Add New User" ou similaire

6. **Cliquez sur "Add New User"**

7. **Entrez votre email Spotify**

   ⚠️ **IMPORTANT** : Utilisez l'email avec lequel vous vous **connectez** à Spotify :

   - Si vous utilisez **Google** pour vous connecter : Votre email Google
   - Si vous utilisez **Facebook** : L'email associé à Facebook
   - Si vous avez un **compte Spotify direct** : Votre email Spotify

   **Pas sûr ?** Allez sur https://www.spotify.com/account/ pour voir votre email.

8. **Cliquez sur "Add"**

9. **Vérifiez que l'utilisateur apparaît dans la liste**

### Capture d'Écran Attendue

Vous devriez voir quelque chose comme :

```
User Management
───────────────────────────────
Name                    Email                   Role
───────────────────────────────────────────────────
Your Name              you@email.com           User
───────────────────────────────────────────────────
[+ Add New User]
```

## 🚀 Après l'Ajout

### 1. Réessayez l'Authentification

Dans Claude Desktop :
```
Use spotify-auth to connect account "dancing-dead"
```

### 2. Autorisez à Nouveau

Cliquez sur l'URL et autorisez l'application.

### 3. Succès ! 🎉

Vous devriez maintenant voir :
```
✅ Account connected!
Account "dancing-dead" connected as YourName.
```

### 4. Vérifiez

```
Use spotify-accounts
```

Devrait afficher :
```
Connected accounts:
- dancing-dead: YourName (your_spotify_id)
```

## 🔄 Alternative : Mode Extended Quota

Si vous prévoyez d'avoir beaucoup d'utilisateurs ou ne voulez pas les ajouter manuellement :

1. Dans le Dashboard, demandez "Extended Quota Mode"
2. Spotify examinera votre application
3. Une fois approuvé, n'importe qui peut se connecter

**Note** : Pour un usage personnel ou interne à Dancing Dead Records, le mode Development avec utilisateurs ajoutés manuellement est suffisant.

## 🧪 Test de Diagnostic

Vérifiez votre email Spotify :

```bash
# Ouvrez cette URL dans votre navigateur
open "https://www.spotify.com/account/"
```

L'email affiché est celui que vous devez ajouter dans le Dashboard.

## ❓ FAQ

### Q : Combien d'utilisateurs puis-je ajouter en mode Development ?
**R** : Jusqu'à 25 utilisateurs.

### Q : Est-ce que chaque membre de Dancing Dead Records doit être ajouté ?
**R** : Oui, si vous voulez qu'ils puissent utiliser le MCP serveur avec leurs comptes.

### Q : L'email doit-il être le même que le compte développeur ?
**R** : Non, vous pouvez ajouter n'importe quel email Spotify.

### Q : Que se passe-t-il si j'ajoute le mauvais email ?
**R** : Vous obtiendrez toujours la même erreur 403. Supprimez-le et ajoutez le bon.

### Q : Puis-je ajouter plusieurs comptes ?
**R** : Oui, vous pouvez ajouter jusqu'à 25 utilisateurs différents.

## 📊 Checklist

- [ ] Dashboard Spotify ouvert
- [ ] Application sélectionnée
- [ ] Settings → User Management trouvé
- [ ] Email Spotify identifié (via spotify.com/account/)
- [ ] Utilisateur ajouté dans le Dashboard
- [ ] Utilisateur apparaît dans la liste
- [ ] Claude Desktop redémarré
- [ ] Réessayé l'authentification
- [ ] ✅ Compte connecté avec succès !

## 🎸 Prêt !

Une fois votre email ajouté, réessayez l'authentification. Ça devrait fonctionner parfaitement maintenant !

---

📚 Documentation :
- [PROBLEM_SOLVED.md](./PROBLEM_SOLVED.md) - Résolution du conflit de port
- [TROUBLESHOOT_INVALID_GRANT.md](./TROUBLESHOOT_INVALID_GRANT.md) - Dépannage complet
- [README.md](./README.md) - Documentation générale

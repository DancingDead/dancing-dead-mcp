# 🎉 PROBLÈME RÉSOLU : Port 3000 Occupé

## 🐛 Le Problème

Vous receviez cette erreur :
```
Error: Unexpected token 'C', "Check sett"... is not valid JSON
SyntaxError at auth.ts:204
```

## 🎯 La Cause

Un **serveur HTTP principal** tournait déjà sur le port 3000, empêchant le **serveur OAuth temporaire** de démarrer.

```
┌─────────────────────┐
│ npm run dev lancé   │ ← Serveur HTTP principal sur port 3000
└─────────────────────┘
          │
          ↓
┌─────────────────────┐
│ spotify-auth        │
└─────────────────────┘
          │
          ↓
┌─────────────────────┐
│ Serveur OAuth       │
│ essaie port 3000    │ ← ❌ Échoue car port occupé
└─────────────────────┘
          │
          ↓
┌─────────────────────┐
│ Callback va vers    │
│ VIEUX serveur HTTP  │ ← ❌ Mauvais handler = erreur
└─────────────────────┘
```

## ✅ La Solution

J'ai **tué le processus** qui occupait le port 3000 (PID 34493).

```bash
kill -9 34493
```

Le port 3000 est maintenant **libre** ! ✅

## 🚀 Prochaines Étapes

### 1. Redémarrez Claude Desktop

Fermez complètement et relancez.

### 2. Réessayez l'Authentification

```
Use spotify-auth to connect account "dancing-dead"
```

### 3. Vérifiez le Message

Vous DEVEZ voir :
```
✅ OAuth server ready on port 3000
```

Si ce message n'apparaît pas → le serveur n'a pas pu démarrer.

### 4. Cliquez et Autorisez

Rapidement (< 2 minutes) !

### 5. Succès ! 🎉

```
✅ Account connected!
Account "dancing-dead" connected as YourName.
You can close this tab now.
```

## 🛡️ Pour Éviter ce Problème

### ❌ NE FAITES PAS

```bash
npm run dev      # N'exécutez pas en même temps que Claude Desktop
npm start        # Idem
```

### ✅ FAITES

Utilisez **uniquement Claude Desktop** en mode stdio. Il lance automatiquement tout ce dont vous avez besoin.

Si vous devez tester le serveur HTTP séparément (pour développement) :
1. Fermez Claude Desktop
2. Lancez `npm run dev`
3. Testez
4. Arrêtez le serveur (`Ctrl+C`)
5. Relancez Claude Desktop

## 🔧 Script de Nettoyage

Si le problème revient, utilisez :

```bash
./scripts/cleanup-ports.sh
```

Ce script tue automatiquement les processus sur le port 3000.

## 📊 Checklist Finale

Avant de réessayer :

- [x] ✅ Port 3000 libéré (vérifié avec `lsof -i :3000`)
- [ ] ✅ Aucun `npm run dev` en cours
- [ ] ✅ Claude Desktop redémarré
- [ ] ✅ Prêt à aller vite (< 2 minutes)

## 🎸 C'est Reparti !

Tout est prêt maintenant. Réessayez l'authentification et ça devrait marcher !

Si vous avez encore des problèmes :
```bash
# Vérifier que le port est libre
lsof -i :3000

# Si un processus apparaît, le tuer
./scripts/cleanup-ports.sh

# Redémarrer Claude Desktop
```

---

📚 Documentation :
- [TROUBLESHOOT_INVALID_GRANT.md](./TROUBLESHOOT_INVALID_GRANT.md) - Guide de dépannage complet
- [CHECKLIST.md](./CHECKLIST.md) - Checklist de vérification
- [README.md](./README.md) - Documentation générale

🎵 Bon coding avec Dancing Dead MCP !

# Tutoriel Git : Pull depuis GitHub sur o2switch

Ce guide vous explique comment récupérer et mettre à jour votre code GitHub sur un serveur o2switch via le terminal SSH.

## Prérequis

- Un compte o2switch avec accès SSH activé
- Un dépôt GitHub (public ou privé)
- Les identifiants SSH de votre compte o2switch

## 1. Connexion au serveur o2switch

### Se connecter via SSH

```bash
ssh votre-utilisateur@votre-domaine.com
# ou
ssh votre-utilisateur@ssh.cluster0XX.hosting.ovh.net
```

Remplacez :
- `votre-utilisateur` par votre nom d'utilisateur o2switch (souvent le même que cPanel)
- `votre-domaine.com` par votre domaine ou l'adresse SSH fournie par o2switch

Entrez votre mot de passe cPanel quand demandé.

### Vérifier que Git est installé

```bash
git --version
```

Si Git n'est pas installé, contactez le support o2switch (généralement, Git est préinstallé).

## 2. Configuration initiale de Git

### Configurer votre identité

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
```

### Vérifier la configuration

```bash
git config --list
```

## 3. Authentification GitHub

### Option A : Utiliser un Personal Access Token (Recommandé)

GitHub ne permet plus l'authentification par mot de passe. Vous devez créer un token.

**Créer un token sur GitHub :**
1. Allez sur GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Cliquez sur "Generate new token (classic)"
3. Donnez un nom au token (ex: "o2switch-server")
4. Sélectionnez les permissions nécessaires : au minimum `repo` pour les dépôts privés
5. Générez et **copiez le token** (vous ne pourrez plus le voir après)

**Utiliser le token :**
Lors du clone ou du pull, utilisez le token comme mot de passe :
- Username : votre nom d'utilisateur GitHub
- Password : votre token (pas votre mot de passe GitHub)

### Option B : Utiliser une clé SSH (Méthode avancée)

**Générer une clé SSH sur o2switch :**

```bash
# Générer une nouvelle clé SSH
ssh-keygen -t ed25519 -C "votre@email.com"

# Appuyez sur Entrée pour accepter l'emplacement par défaut
# Vous pouvez définir une passphrase ou laisser vide
```

**Afficher votre clé publique :**

```bash
cat ~/.ssh/id_ed25519.pub
```

**Ajouter la clé à GitHub :**
1. Copiez le contenu de la clé publique
2. Allez sur GitHub.com → Settings → SSH and GPG keys → New SSH key
3. Collez la clé et donnez-lui un nom (ex: "o2switch-server")

**Tester la connexion SSH :**

```bash
ssh -T git@github.com
```

Vous devriez voir : "Hi username! You've successfully authenticated..."

## 4. Cloner un dépôt GitHub

### Naviguer vers le bon dossier

```bash
# Aller dans le dossier web (souvent public_html ou www)
cd ~/public_html

# Ou créer un dossier spécifique
mkdir ~/mon-projet
cd ~/mon-projet
```

### Cloner avec HTTPS (avec token)

```bash
git clone https://github.com/utilisateur/nom-du-depot.git
```

Entrez votre nom d'utilisateur GitHub et votre **token** comme mot de passe.

### Cloner avec SSH

```bash
git clone git@github.com:utilisateur/nom-du-depot.git
```

## 5. Récupérer les mises à jour (Pull)

### Workflow de base

```bash
# 1. Naviguer dans le dossier du projet
cd ~/public_html/nom-du-depot

# 2. Vérifier l'état actuel
git status

# 3. Récupérer les dernières modifications
git pull
```

### Pull depuis une branche spécifique

```bash
# Pull depuis la branche main
git pull origin main

# Pull depuis la branche master
git pull origin master

# Pull depuis une autre branche
git pull origin nom-de-la-branche
```

### Workflow complet avec vérifications

```bash
# 1. Vérifier la branche actuelle
git branch

# 2. Voir les commits distants disponibles
git fetch
git log HEAD..origin/main --oneline

# 3. Récupérer et fusionner
git pull

# 4. Vérifier que tout est à jour
git status
```

## 6. Gérer plusieurs projets

### Structure recommandée

```bash
# Créer une structure organisée
mkdir ~/projets
cd ~/projets

# Cloner plusieurs dépôts
git clone https://github.com/user/projet1.git
git clone https://github.com/user/projet2.git
git clone https://github.com/user/projet3.git

# Naviguer entre les projets
cd projet1
git pull

cd ../projet2
git pull
```

## 7. Automatiser les mises à jour

### Créer un script de déploiement

```bash
# Créer un fichier deploy.sh
nano ~/deploy.sh
```

Contenu du script :

```bash
#!/bin/bash

echo "Début du déploiement..."

# Naviguer vers le projet
cd ~/public_html/mon-projet

# Récupérer les modifications
echo "Pull depuis GitHub..."
git pull origin main

# Si vous utilisez Node.js, npm, etc.
# npm install
# npm run build

echo "Déploiement terminé!"
```

Rendre le script exécutable :

```bash
chmod +x ~/deploy.sh
```

Exécuter le script :

```bash
~/deploy.sh
```

## 8. Résolution de problèmes

### Erreur : "Permission denied (publickey)"

**Problème :** La clé SSH n'est pas correctement configurée.

**Solution :**
```bash
# Vérifier que l'agent SSH est actif
eval "$(ssh-agent -s)"

# Ajouter votre clé
ssh-add ~/.ssh/id_ed25519

# Tester à nouveau
ssh -T git@github.com
```

### Erreur : "Authentication failed"

**Problème :** Token ou mot de passe incorrect.

**Solution :**
- Vérifiez que vous utilisez un Personal Access Token et non votre mot de passe
- Assurez-vous que le token a les bonnes permissions
- Régénérez un nouveau token si nécessaire

### Conflits lors du pull

**Problème :** Vous avez modifié des fichiers sur le serveur qui entrent en conflit avec GitHub.

**Solution 1 - Écraser les modifications locales :**
```bash
# Sauvegarder vos modifications (optionnel)
git stash

# Récupérer la version de GitHub
git pull

# Restaurer vos modifications si besoin
git stash pop
```

**Solution 2 - Forcer l'écrasement (ATTENTION : perte des modifications locales) :**
```bash
git fetch origin
git reset --hard origin/main
```

### Espace disque insuffisant

**Vérifier l'espace disponible :**
```bash
df -h
```

**Nettoyer le cache Git :**
```bash
cd ~/public_html/mon-projet
git gc --aggressive --prune=now
```

## 9. Bonnes pratiques pour o2switch

### Ne jamais modifier directement sur le serveur

Le serveur doit être une copie de votre dépôt GitHub :
- Faites vos modifications en local
- Commitez et pushez vers GitHub
- Pullez sur le serveur

### Gérer les fichiers de configuration

Certains fichiers ne doivent pas être sur GitHub (`.env`, etc.) :

```bash
# Créer un .env local sur le serveur
nano ~/public_html/mon-projet/.env

# S'assurer qu'il est dans .gitignore (vérifier en local)
```

### Permissions des fichiers

Après un pull, vérifiez les permissions :

```bash
# Fichiers : 644
find ~/public_html/mon-projet -type f -exec chmod 644 {} \;

# Dossiers : 755
find ~/public_html/mon-projet -type d -exec chmod 755 {} \;
```

## 10. Exemple de workflow complet

```bash
# Connexion au serveur
ssh utilisateur@domaine.com

# Navigation vers le projet
cd ~/public_html/mon-site

# Vérification de l'état
git status
git log -1

# Récupération des mises à jour
git pull origin main

# Si vous avez des dépendances à installer
# npm install (pour Node.js)
# composer install (pour PHP)

# Vérification finale
ls -la
git log -1

# Déconnexion
exit
```

## Commandes utiles sur o2switch

### Navigation et fichiers

```bash
pwd              # Afficher le dossier actuel
ls -la           # Lister tous les fichiers
cd chemin        # Changer de dossier
nano fichier     # Éditer un fichier
cat fichier      # Afficher le contenu d'un fichier
```

### Git

```bash
git status       # État du dépôt
git log          # Historique des commits
git branch       # Voir les branches
git remote -v    # Voir les dépôts distants
git pull         # Récupérer les mises à jour
```

## Ressources

- [Documentation o2switch](https://faq.o2switch.fr/)
- [GitHub Docs - Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Docs - SSH Keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

**Note :** o2switch est un hébergeur mutualisé, certaines commandes système avancées peuvent être limitées. En cas de problème, contactez le support o2switch qui est réputé très réactif.

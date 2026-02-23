# Tutoriel Git : Commit et Push vers GitHub

Ce guide vous explique comment enregistrer vos modifications locales et les envoyer vers GitHub.

## Prérequis

- Git installé sur votre machine
- Un dépôt GitHub configuré avec un remote (généralement nommé `origin`)

## Étapes de base

### 1. Vérifier l'état de votre dépôt

```bash
git status
```

Cette commande affiche :
- Les fichiers modifiés
- Les fichiers non suivis (untracked)
- Les fichiers déjà ajoutés au staging

### 2. Ajouter les fichiers au staging

Pour ajouter **tous** les fichiers modifiés :

```bash
git add .
```

Pour ajouter des fichiers **spécifiques** :

```bash
git add chemin/vers/fichier.js
git add dossier/
```

Pour ajouter plusieurs fichiers spécifiques :

```bash
git add fichier1.js fichier2.css src/components/
```

### 3. Créer un commit

Un commit enregistre vos modifications avec un message descriptif :

```bash
git commit -m "Votre message de commit"
```

**Bonnes pratiques pour les messages de commit :**
- Utilisez l'impératif présent : "Add feature" plutôt que "Added feature"
- Soyez concis mais descriptif
- Exemples :
  - `git commit -m "Add user authentication"`
  - `git commit -m "Fix login button alignment"`
  - `git commit -m "Update README with installation steps"`

Pour un message multi-lignes :

```bash
git commit -m "Titre court du commit

Description plus détaillée si nécessaire.
- Point 1
- Point 2"
```

### 4. Pousser vers GitHub

Pour pousser vos commits vers la branche actuelle :

```bash
git push
```

Si c'est la première fois que vous poussez cette branche :

```bash
git push -u origin nom-de-la-branche
```

L'option `-u` (ou `--set-upstream`) configure le suivi de la branche distante.

## Workflow complet

Voici un exemple de workflow complet :

```bash
# 1. Vérifier l'état
git status

# 2. Ajouter les fichiers
git add .

# 3. Créer le commit
git commit -m "Add new feature for user profiles"

# 4. Pousser vers GitHub
git push
```

## Commandes utiles supplémentaires

### Voir les différences avant de commiter

```bash
git diff              # Différences non stagées
git diff --staged     # Différences stagées
```

### Voir l'historique des commits

```bash
git log               # Historique complet
git log --oneline     # Historique condensé
git log -n 5          # Les 5 derniers commits
```

### Annuler des actions

```bash
# Retirer un fichier du staging (avant commit)
git reset HEAD fichier.js

# Modifier le dernier commit (message ou fichiers)
git commit --amend

# Annuler les modifications d'un fichier
git checkout -- fichier.js
```

## Workflow avec branches

```bash
# Créer une nouvelle branche et basculer dessus
git checkout -b nouvelle-branche

# Faire vos modifications, add et commit
git add .
git commit -m "Work on new feature"

# Pousser la nouvelle branche
git push -u origin nouvelle-branche

# Revenir sur la branche principale
git checkout main
# ou
git checkout master
```

## Résolution de problèmes courants

### Erreur : "Updates were rejected"

Cela signifie que la branche distante a des commits que vous n'avez pas localement.

Solution :

```bash
# Récupérer et fusionner les modifications distantes
git pull

# Résoudre les éventuels conflits, puis
git push
```

### Erreur : "fatal: not a git repository"

Vous n'êtes pas dans un dépôt Git initialisé.

Solution :

```bash
git init
# ou naviguez vers le bon dossier
```

### Fichiers sensibles commités par erreur

Utilisez `.gitignore` pour éviter de commit des fichiers sensibles :

```bash
# Créer/éditer .gitignore
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore

# Supprimer du tracking (mais garder le fichier local)
git rm --cached .env

# Commit la suppression
git commit -m "Remove .env from tracking"
git push
```

## Ressources

- [Documentation officielle Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

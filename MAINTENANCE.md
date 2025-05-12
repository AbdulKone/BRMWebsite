# Guide de Maintenance - Black Road Music

## Table des matières
1. [Configuration du Projet](#configuration-du-projet)
2. [Tests Automatisés](#tests-automatisés)
3. [Base de Données](#base-de-données)
4. [Sécurité](#sécurité)
5. [Déploiement](#déploiement)
6. [Maintenance Régulière](#maintenance-régulière)

## Configuration du Projet

### Prérequis
- Node.js (v18+)
- npm (v9+)
- Compte Supabase

### Installation
```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Build production
npm run build
```

## Tests Automatisés

### Exécution des Tests
```bash
# Lancer tous les tests
npm test

# Lancer les tests avec couverture
npm run test:coverage

# Interface visuelle des tests
npm run test:ui
```

### Types de Tests
1. **Tests Unitaires**: Composants et fonctions utilitaires
2. **Tests d'Intégration**: Interactions entre composants
3. **Tests de Sécurité**: Validation des entrées et protection CSRF

### Ajout de Nouveaux Tests
- Placer les tests dans `src/tests/`
- Nommer les fichiers `*.test.tsx` ou `*.test.ts`
- Utiliser les utilitaires de test depuis `src/tests/utils.tsx`

## Base de Données

### Migrations
- Les migrations sont dans `supabase/migrations/`
- Créer une nouvelle migration pour chaque changement de schéma
- Ne jamais modifier les migrations existantes

### Maintenance
1. Vérifier régulièrement les index de performance
2. Nettoyer les données obsolètes
3. Vérifier les politiques RLS

## Sécurité

### Vérifications Régulières
1. Audit des dépendances : `npm audit`
2. Mise à jour des packages : `npm update`
3. Vérification des politiques CSP
4. Revue des politiques RLS

### Validation des Entrées
- Images : taille max 5MB, formats JPG/PNG/WebP
- URLs YouTube : format valide
- Protection CSRF active
- Rate limiting configuré

## Déploiement

### Procédure
1. Exécuter la validation complète :
   ```bash
   npm run validate
   ```
2. Vérifier la couverture des tests
3. Build production :
   ```bash
   npm run build
   ```
4. Déployer sur l'hébergeur

### Vérifications Post-Déploiement
1. Tester les formulaires
2. Vérifier le chargement des médias
3. Tester l'authentification admin
4. Vérifier les intégrations (YouTube, reCAPTCHA)

## Maintenance Régulière

### Hebdomadaire
- Vérifier les logs d'erreur
- Examiner les performances
- Sauvegarder la base de données

### Mensuelle
- Mise à jour des dépendances
- Audit de sécurité
- Revue des accès admin
- Nettoyage du stockage média

### Trimestrielle
- Revue complète du code
- Test de restauration des sauvegardes
- Mise à jour de la documentation
- Optimisation des performances
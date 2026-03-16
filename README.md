# Widgets garage Notion — version Vercel prête à brancher

Cette version est pensée pour un déploiement simple sur **Vercel**.

## Contenu

- `devis.html` → widget **Devis clients**
- `commandes.html` → widget **Commandes de pièces**
- `api/devis.js` → lire / créer des devis
- `api/commandes.js` → lire / créer des commandes
- `api/devis/[id]/create-piece-order.js` → bouton **Pièce à commander**
- `styles.css` → style partagé
- `vercel.json` → URLs propres (`/devis` et `/commandes`)

## Bases Notion à préparer

### Base 1 — Devis

Propriétés exactes :

- `Nom` → Title
- `Client` → Rich text
- `Véhicule` → Rich text
- `Immat` → Rich text
- `Intervention` → Rich text
- `Statut` → Select (`En attente`, `À relancer`, `Validé`)
- `Commande créée` → Checkbox
- `ID commande pièce` → Rich text

### Base 2 — Commandes de pièces

Propriétés exactes :

- `Nom` → Title
- `Client` → Rich text
- `Véhicule` → Rich text
- `Immat` → Rich text
- `Intervention` → Rich text
- `Fournisseur` → Rich text
- `Date commande` → Date
- `Statut` → Select (`À commander`, `Commandé`, `Reçu`)
- `Devis lié` → Rich text

## Variables d'environnement Vercel

Ajoute ces 3 variables dans ton projet Vercel :

- `NOTION_TOKEN`
- `DEVIS_DB_ID`
- `COMMANDES_DB_ID`

## Déploiement rapide

1. Crée un projet Vercel.
2. Envoie ce dossier.
3. Ajoute les variables d'environnement.
4. Déploie.

## Fonctionnement du bouton “Pièce à commander”

Depuis un devis :

1. le bouton lit le devis
2. vérifie si une commande existe déjà
3. crée une ligne dans **Commandes de pièces** avec :
   - Immat
   - Véhicule
   - Client
   - Intervention
   - Statut = `À commander`
4. met à jour le devis :
   - `Commande créée = true`
   - `ID commande pièce = ID de la commande créée`

## URLs

- `/devis`
- `/commandes`

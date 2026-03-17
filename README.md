# Widget Devis - version Vercel corrigée

Page :
- /devis/

Fichiers :
- devis/index.html
- styles.css
- api/devis.js
- api/commandes.js
- api/devis/[id]/create-piece-order.js
- lib/notion.js

Variables Vercel :
- NOTION_TOKEN
- DEVIS_DB_ID
- COMMANDES_DB_ID

Base Devis :
- Client → Title
- Véhicule → Text
- Immat → Text
- Intervention → Text
- Téléphone → Text
- Mail → Email ou Text
- Date → Date
- Statut → Select
- Photo → Files & media (optionnel)
- Photo URL → URL (optionnel)
- Commande créée → Checkbox
- ID commande pièce → Text

Base Commandes de pièces :
- Immat → Title
- Véhicule → Text
- Client → Text
- Intervention → Text
- Fournisseur → Text
- Date commande → Date
- Statut → Select

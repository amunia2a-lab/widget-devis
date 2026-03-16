const {
  notion,
  COMMANDES_DB_ID,
  rt,
  mapCommande,
  sendJson,
  parseBody
} = require('../lib/notion');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

  if (!process.env.NOTION_TOKEN || !COMMANDES_DB_ID) {
    return sendJson(res, 500, { error: 'Variables Vercel manquantes.' });
  }

  try {
    if (req.method === 'GET') {
      const result = await notion.databases.query({
        database_id: COMMANDES_DB_ID,
        sorts: [{ property: 'Date commande', direction: 'descending' }]
      });
      return sendJson(res, 200, result.results.map(mapCommande));
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const {
        client = '',
        vehicule = '',
        immat = '',
        intervention = '',
        fournisseur = '',
        dateCommande = null,
        statut = 'À commander'
      } = body;
      const nom = `${vehicule || 'Véhicule'} — ${intervention || 'Intervention'}`;

      const created = await notion.pages.create({
        parent: { database_id: COMMANDES_DB_ID },
        properties: {
          'Nom': { title: rt(nom) },
          'Client': { rich_text: rt(client) },
          'Véhicule': { rich_text: rt(vehicule) },
          'Immat': { rich_text: rt(immat) },
          'Intervention': { rich_text: rt(intervention) },
          'Fournisseur': { rich_text: rt(fournisseur) },
          'Date commande': dateCommande ? { date: { start: dateCommande } } : { date: null },
          'Statut': { select: { name: statut } },
          'Devis lié': { rich_text: [] }
        }
      });

      return sendJson(res, 201, { ok: true, id: created.id });
    }

    return sendJson(res, 405, { error: 'Méthode non autorisée.' });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: 'Impossible de traiter les commandes.' });
  }
};

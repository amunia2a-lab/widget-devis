const {
  notion,
  DEVIS_DB_ID,
  rt,
  mapDevis,
  sendJson,
  parseBody
} = require('../lib/notion');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

  if (!process.env.NOTION_TOKEN || !DEVIS_DB_ID) {
    return sendJson(res, 500, { error: 'Variables Vercel manquantes.' });
  }

  try {
    if (req.method === 'GET') {
      const result = await notion.databases.query({
        database_id: DEVIS_DB_ID,
        sorts: [{ property: 'Client', direction: 'ascending' }]
      });
      return sendJson(res, 200, result.results.map(mapDevis));
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const {
        client = '',
        vehicule = '',
        immat = '',
        intervention = '',
        telephone = '',
        mail = '',
        date = null,
        statut = 'En attente',
        photoUrl = ''
      } = body;

      const properties = {
        'Client': { title: rt(client || 'Sans nom') },
        'Véhicule': { rich_text: rt(vehicule) },
        'Immat': { rich_text: rt(immat) },
        'Intervention': { rich_text: rt(intervention) },
        'Téléphone': { rich_text: rt(telephone) },
        'Mail': { email: mail || null },
        'Date': date ? { date: { start: date } } : { date: null },
        'Statut': { select: { name: statut } },
        'Commande créée': { checkbox: false },
        'ID commande pièce': { rich_text: [] }
      };

      if (photoUrl) {
        properties['Photo URL'] = { url: photoUrl };
      }

      const created = await notion.pages.create({
        parent: { database_id: DEVIS_DB_ID },
        properties
      });

      return sendJson(res, 201, { ok: true, id: created.id });
    }

    return sendJson(res, 405, { error: 'Méthode non autorisée.' });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: 'Impossible de traiter les devis.' });
  }
};

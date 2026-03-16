const {
  notion,
  COMMANDES_DB_ID,
  rt,
  mapDevis,
  sendJson
} = require('../../../lib/notion');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Méthode non autorisée.' });

  if (!process.env.NOTION_TOKEN || !COMMANDES_DB_ID) {
    return sendJson(res, 500, { error: 'Variables Vercel manquantes.' });
  }

  try {
    const { id: devisId } = req.query;
    const devisPage = await notion.pages.retrieve({ page_id: devisId });
    const devis = mapDevis(devisPage);

    if (devis.commandeCreee) {
      return sendJson(res, 400, { error: 'Commande déjà créée pour ce devis.' });
    }

    const nom = `${devis.vehicule || 'Véhicule'} — ${devis.intervention || 'Intervention'}`;

    const commande = await notion.pages.create({
      parent: { database_id: COMMANDES_DB_ID },
      properties: {
        'Nom': { title: rt(nom) },
        'Client': { rich_text: rt(devis.client) },
        'Véhicule': { rich_text: rt(devis.vehicule) },
        'Immat': { rich_text: rt(devis.immat) },
        'Intervention': { rich_text: rt(devis.intervention) },
        'Fournisseur': { rich_text: [] },
        'Date commande': { date: null },
        'Statut': { select: { name: 'À commander' } },
        'Devis lié': { rich_text: rt(devis.id) }
      }
    });

    await notion.pages.update({
      page_id: devisId,
      properties: {
        'Commande créée': { checkbox: true },
        'ID commande pièce': { rich_text: rt(commande.id) }
      }
    });

    return sendJson(res, 200, { ok: true, commandeId: commande.id });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: 'Impossible de créer la commande depuis le devis.' });
  }
};

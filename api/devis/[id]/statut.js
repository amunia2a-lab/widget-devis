const { notion, sendJson, parseBody } = require('../../../lib/notion');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Méthode non autorisée.' });

  try {
    const { id } = req.query;
    const body = await parseBody(req);
    const statut = body?.statut || 'Validé';

    const page = await notion.pages.retrieve({ page_id: id });
    const props = page.properties || {};

    const candidates = ['Statut', 'État', 'Etat'];
    let statutPropName = null;

    for (const name of candidates) {
      if (props[name]?.type === 'select') {
        statutPropName = name;
        break;
      }
    }

    if (!statutPropName) {
      for (const [name, prop] of Object.entries(props)) {
        if (prop?.type === 'select') {
          statutPropName = name;
          break;
        }
      }
    }

    if (!statutPropName) {
      return sendJson(res, 400, { error: 'Aucune propriété Statut de type select trouvée.' });
    }

    await notion.pages.update({
      page_id: id,
      properties: {
        [statutPropName]: { select: { name: statut } }
      }
    });

    return sendJson(res, 200, { ok: true, statut });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error.message || 'Impossible de modifier le statut.' });
  }
};

const { notion, sendJson, parseBody, rt } = require('../../../lib/notion');

function normalizeKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]/g, '')
    .toLowerCase();
}

function findPropName(properties, preferredNames = [], preferredType = null) {
  const entries = Object.entries(properties || {});
  const byNormalized = new Map(entries.map(([name, prop]) => [normalizeKey(name), { name, prop }]));

  for (const candidate of preferredNames) {
    const found = byNormalized.get(normalizeKey(candidate));
    if (found && (!preferredType || found.prop?.type === preferredType)) return found.name;
  }
  if (preferredType) {
    for (const [name, prop] of entries) {
      if (prop?.type === preferredType) return name;
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Méthode non autorisée.' });

  try {
    const { id } = req.query;
    const body = await parseBody(req);

    const page = await notion.pages.retrieve({ page_id: id });
    const props = page.properties || {};

    const titleName = findPropName(props, ['Client', 'Nom client', 'Nom'], 'title');
    const vehiculeName = findPropName(props, ['Véhicule', 'Vehicule', 'Voiture'], 'rich_text');
    const immatName = findPropName(props, ['Immat', 'Immatriculation', 'Plaque'], 'rich_text');
    const interventionName = findPropName(props, ['Intervention', 'Devis', 'Prestation'], 'rich_text');
    const telephoneName = findPropName(props, ['Téléphone', 'Telephone', 'Tel'], 'rich_text');
    const mailEmailName = findPropName(props, ['Mail', 'Email', 'E-mail'], 'email');
    const mailTextName = findPropName(props, ['Mail', 'Email', 'E-mail'], 'rich_text');
    const dateName = findPropName(props, ['Date', 'Date devis', '📅 Date'], 'date');
    const statutName = findPropName(props, ['Statut', 'État', 'Etat'], 'select');
    const urlName = findPropName(props, ['URL', 'Photo URL', 'Lien photo'], 'url');

    const updateProps = {};
    if (titleName) updateProps[titleName] = { title: rt(body.client || 'Sans nom') };
    if (vehiculeName) updateProps[vehiculeName] = { rich_text: rt(body.vehicule || '') };
    if (immatName) updateProps[immatName] = { rich_text: rt(body.immat || '') };
    if (interventionName) updateProps[interventionName] = { rich_text: rt(body.intervention || '') };
    if (telephoneName) updateProps[telephoneName] = { rich_text: rt(body.telephone || '') };
    if (mailEmailName) updateProps[mailEmailName] = { email: body.mail || null };
    else if (mailTextName) updateProps[mailTextName] = { rich_text: rt(body.mail || '') };
    if (dateName) updateProps[dateName] = body.date ? { date: { start: body.date } } : { date: null };
    if (statutName) updateProps[statutName] = { select: { name: body.statut || 'En attente' } };
    if (urlName) updateProps[urlName] = { url: body.photoUrl || null };

    await notion.pages.update({
      page_id: id,
      properties: updateProps
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error.message || 'Impossible de modifier le devis.' });
  }
};

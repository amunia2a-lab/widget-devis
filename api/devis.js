const {
  notion,
  DEVIS_DB_ID,
  rt,
  mapDevis,
  sendJson,
  parseBody
} = require('../lib/notion');

const NOTION_VERSION = '2026-03-11';
const MAX_SMALL_FILE_BYTES = 20 * 1024 * 1024;

async function createNotionFileUpload({ filename, contentType }) {
  const res = await fetch('https://api.notion.com/v1/file_uploads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mode: 'single_part',
      filename,
      content_type: contentType
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Impossible de préparer l’upload de la photo.');
  }
  return data;
}

async function sendFileToNotion(uploadUrl, file) {
  const bytes = Buffer.from(file.data, 'base64');
  if (bytes.length > MAX_SMALL_FILE_BYTES) {
    throw new Error(`Le fichier "${file.name}" dépasse 20 MB.`);
  }

  const form = new FormData();
  form.append(
    'file',
    new Blob([bytes], { type: file.type || 'application/octet-stream' }),
    file.name || 'photo.jpg'
  );

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION
    },
    body: form
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Impossible d’envoyer le fichier "${file.name}".`);
  }
  return data;
}

async function uploadPhotosToNotion(photoFiles = []) {
  const uploaded = [];

  for (const file of photoFiles) {
    if (!file?.data) continue;

    const prepared = await createNotionFileUpload({
      filename: file.name || 'photo.jpg',
      contentType: file.type || 'image/jpeg'
    });

    const sent = await sendFileToNotion(prepared.upload_url, file);

    uploaded.push({
      id: sent.id || prepared.id,
      name: file.name || 'photo.jpg'
    });
  }

  return uploaded;
}

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
        photoFiles = [],
        photoUrl = ''
      } = body;

      const uploadedPhotos = await uploadPhotosToNotion(photoFiles);

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

      if (uploadedPhotos.length) {
        properties['Photo'] = {
          files: uploadedPhotos.map((file) => ({
            name: file.name,
            type: 'file_upload',
            file_upload: { id: file.id }
          }))
        };
      }

      if (photoUrl) {
        properties['URL'] = { url: photoUrl };
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
    return sendJson(res, 500, { error: error.message || 'Impossible de traiter les devis.' });
  }
};

const { Client: NotionClient } = require('@notionhq/client');

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
const DEVIS_DB_ID = process.env.DEVIS_DB_ID;
const COMMANDES_DB_ID = process.env.COMMANDES_DB_ID;

function rt(text = '') {
  return text ? [{ text: { content: text } }] : [];
}

function readTitle(prop) {
  return prop?.title?.[0]?.plain_text ?? '';
}

function readRichText(prop) {
  return prop?.rich_text?.map((x) => x.plain_text).join('') ?? '';
}

function readSelect(prop) {
  return prop?.select?.name ?? '';
}

function readCheckbox(prop) {
  return !!prop?.checkbox;
}

function readDate(prop) {
  return prop?.date?.start ?? '';
}

function readEmail(prop) {
  return prop?.email ?? '';
}

function readUrl(prop) {
  return prop?.url ?? '';
}

function readFile(prop) {
  const files = prop?.files || [];
  const first = files[0];
  if (!first) return '';
  if (first.type === 'external') return first.external?.url || '';
  if (first.type === 'file') return first.file?.url || '';
  return '';
}

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
    if (found && (!preferredType || found.prop?.type === preferredType)) {
      return found.name;
    }
  }

  if (preferredType) {
    for (const [name, prop] of entries) {
      if (prop?.type === preferredType) return name;
    }
  }

  return null;
}

function pickProp(properties, names = [], type = null) {
  const propName = findPropName(properties, names, type);
  return propName ? properties[propName] : null;
}

function mapDevis(page) {
  const p = page.properties || {};

  const clientProp = pickProp(p, ['Client', 'Nom client', 'Nom'], 'title');
  const vehiculeProp = pickProp(p, ['Véhicule', 'Vehicule', 'Voiture'], 'rich_text');
  const immatProp = pickProp(p, ['Immat', 'Immatriculation', 'Plaque'], 'rich_text');
  const interventionProp = pickProp(p, ['Intervention', 'Devis', 'Prestation'], 'rich_text');
  const telephoneProp = pickProp(p, ['Téléphone', 'Telephone', 'Tel', 'Téléphone client'], 'rich_text');
  const mailEmailProp = pickProp(p, ['Mail', 'Email', 'E-mail'], 'email');
  const mailTextProp = pickProp(p, ['Mail', 'Email', 'E-mail'], 'rich_text');
  const dateProp = pickProp(p, ['Date', 'Date devis', '📅 Date'], 'date');
  const statutProp = pickProp(p, ['Statut', 'État', 'Etat'], 'select');
  const photoProp = pickProp(p, ['Photo', 'Photos', 'Image'], 'files');
  const urlProp = pickProp(p, ['URL', 'Photo URL', 'Lien photo'], 'url');
  const commandeCreeeProp = pickProp(p, ['Commande créée', 'Commande creee', 'Commande envoyée'], 'checkbox');
  const idCommandeProp = pickProp(p, ['ID commande pièce', 'ID commande piece', 'Commande ID'], 'rich_text');

  return {
    id: page.id,
    client: readTitle(clientProp),
    vehicule: readRichText(vehiculeProp),
    immat: readRichText(immatProp),
    intervention: readRichText(interventionProp),
    telephone: readRichText(telephoneProp),
    mail: readEmail(mailEmailProp) || readRichText(mailTextProp),
    date: readDate(dateProp),
    statut: readSelect(statutProp),
    photo: readFile(photoProp) || readUrl(urlProp),
    commandeCreee: readCheckbox(commandeCreeeProp),
    idCommandePiece: readRichText(idCommandeProp)
  };
}

function mapCommande(page) {
  const p = page.properties || {};

  const immatTitleProp = pickProp(p, ['Immat', 'Immatriculation', 'Plaque'], 'title');
  const vehiculeProp = pickProp(p, ['Véhicule', 'Vehicule', 'Voiture'], 'rich_text');
  const clientProp = pickProp(p, ['Client', 'Nom client', 'Nom'], 'rich_text');
  const interventionProp = pickProp(p, ['Intervention', 'Prestation', 'Devis'], 'rich_text');
  const fournisseurProp = pickProp(p, ['Fournisseur', 'Supplier'], 'rich_text');
  const dateCommandeProp = pickProp(p, ['Date commande', 'Date', '📅 Date commande'], 'date');
  const statutProp = pickProp(p, ['Statut', 'État', 'Etat'], 'select');

  return {
    id: page.id,
    immat: readTitle(immatTitleProp),
    vehicule: readRichText(vehiculeProp),
    client: readRichText(clientProp),
    intervention: readRichText(interventionProp),
    fournisseur: readRichText(fournisseurProp),
    dateCommande: readDate(dateCommandeProp),
    statut: readSelect(statutProp)
  };
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  return await new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 50_000_000) reject(new Error('Payload trop volumineux'));
    });

    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('JSON invalide')); }
    });

    req.on('error', reject);
  });
}

module.exports = {
  notion,
  DEVIS_DB_ID,
  COMMANDES_DB_ID,
  rt,
  mapDevis,
  mapCommande,
  sendJson,
  parseBody
};

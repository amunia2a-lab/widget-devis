const { Client: NotionClient } = require('@notionhq/client');

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
const DEVIS_DB_ID = process.env.DEVIS_DB_ID;
const COMMANDES_DB_ID = process.env.COMMANDES_DB_ID;

function rt(text = '') {
  return text ? [{ text: { content: text } }] : [];
}
function readTitle(prop) { return prop?.title?.[0]?.plain_text ?? ''; }
function readRichText(prop) { return prop?.rich_text?.map((x) => x.plain_text).join('') ?? ''; }
function readSelect(prop) { return prop?.select?.name ?? ''; }
function readCheckbox(prop) { return !!prop?.checkbox; }
function readDate(prop) { return prop?.date?.start ?? ''; }
function readEmail(prop) { return prop?.email ?? ''; }
function readUrl(prop) { return prop?.url ?? ''; }
function readFile(prop) {
  const file = prop?.files?.[0];
  if (!file) return '';
  return file.external?.url || file.file?.url || '';
}

function mapDevis(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    client: readTitle(p['Client']),
    vehicule: readRichText(p['Véhicule']),
    immat: readRichText(p['Immat']),
    intervention: readRichText(p['Intervention']),
    telephone: readRichText(p['Téléphone']),
    mail: readEmail(p['Mail']) || readRichText(p['Mail']),
    date: readDate(p['Date']),
    statut: readSelect(p['Statut']),
    photo: readFile(p['Photo']) || readUrl(p['Photo URL']),
    commandeCreee: readCheckbox(p['Commande créée']),
    idCommandePiece: readRichText(p['ID commande pièce'])
  };
}

function mapCommande(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    immat: readTitle(p['Immat']),
    vehicule: readRichText(p['Véhicule']),
    client: readRichText(p['Client']),
    intervention: readRichText(p['Intervention']),
    fournisseur: readRichText(p['Fournisseur']),
    dateCommande: readDate(p['Date commande']),
    statut: readSelect(p['Statut'])
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
      if (data.length > 1_000_000) reject(new Error('Payload trop volumineux'));
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

function readTitle(prop) { return prop?.title?.[0]?.plain_text ?? ''; }
function readRichText(prop) { return prop?.rich_text?.map(x => x.plain_text).join('') ?? ''; }
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
    photo: readFile(p['Photo']) || readUrl(p['URL']),
    commandeCreee: readCheckbox(p['Commande créée'])
  };
}

module.exports = { mapDevis };

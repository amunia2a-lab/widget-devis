const {Client}=require("@notionhq/client")

const notion=new Client({auth:process.env.NOTION_TOKEN})

const DEVIS_DB_ID=process.env.DEVIS_DB_ID
const COMMANDES_DB_ID=process.env.COMMANDES_DB_ID

function rt(text=""){
return text?[{text:{content:text}}]:[]
}

function readTitle(p){return p?.title?.[0]?.plain_text||""}
function readRich(p){return p?.rich_text?.map(x=>x.plain_text).join("")||""}
function readSelect(p){return p?.select?.name||""}
function readEmail(p){return p?.email||""}
function readUrl(p){return p?.url||""}
function readCheckbox(p){return p?.checkbox||false}

function mapDevis(page){

const p=page.properties

return{
id:page.id,
client:readTitle(p.Client),
vehicule:readRich(p["Véhicule"]),
immat:readRich(p.Immat),
intervention:readRich(p.Intervention),
telephone:readRich(p["Téléphone"]),
mail:readEmail(p.Mail),
statut:readSelect(p.Statut),
photo:readUrl(p["Photo URL"]),
commandeCreee:readCheckbox(p["Commande créée"])
}

}

function sendJson(res,status,body){
res.statusCode=status
res.setHeader("Content-Type","application/json")
res.end(JSON.stringify(body))
}

async function parseBody(req){
let data=""
for await (const chunk of req) data+=chunk
return JSON.parse(data||"{}")
}

module.exports={
notion,
DEVIS_DB_ID,
COMMANDES_DB_ID,
rt,
mapDevis,
sendJson,
parseBody
}

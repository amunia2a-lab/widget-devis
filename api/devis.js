const {
notion,
DEVIS_DB_ID,
rt,
mapDevis,
sendJson,
parseBody
}=require("../lib/notion")

module.exports=async function handler(req,res){

if(req.method==="GET"){

const data=await notion.databases.query({
database_id:DEVIS_DB_ID
})

return sendJson(res,200,data.results.map(mapDevis))

}

if(req.method==="POST"){

const body=await parseBody(req)

const created=await notion.pages.create({
parent:{database_id:DEVIS_DB_ID},
properties:{
Client:{title:rt(body.client)},
Véhicule:{rich_text:rt(body.vehicule)},
Immat:{rich_text:rt(body.immat)},
Intervention:{rich_text:rt(body.intervention)},
Téléphone:{rich_text:rt(body.telephone)},
Mail:{email:body.mail||null},
Statut:{select:{name:body.statut}},
"Photo URL":{url:body.photoUrl||""},
"Commande créée":{checkbox:false},
"ID commande pièce":{rich_text:[]}
}
})

return sendJson(res,200,{ok:true,id:created.id})

}

}

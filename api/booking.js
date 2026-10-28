import {migrate,rateLimit} from '../server/db.js';
import {authenticated,verifyPassword,login,logout,digest,currentPasswordHash,changePassword} from '../server/auth.js';
import {readState,availability,mutate} from '../server/service.js';
let ready;
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Cookie');
try{
if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Metodo non consentito.'});}
if(req.method==='POST'){
const origin=req.headers.origin;const host=req.headers.host;
if(!origin||origin!=='https://'+host&&!(process.env.NODE_ENV==='test'&&origin==='http://'+host))return res.status(403).json({error:'Origine non consentita.'});
if(!req.headers['content-type']?.startsWith('application/json'))return res.status(415).json({error:'Formato non consentito.'});
if(JSON.stringify(req.body||{}).length>100000)return res.status(413).json({error:'Richiesta troppo grande.'});
}
await (ready??=migrate().catch(e=>{ready=undefined;throw e;}));
const url=new URL(req.url,'https://'+req.headers.host),action=url.searchParams.get('action');
if(req.method==='GET'){
if(action==='availability')return res.json(await availability(url.searchParams.get('date')||'',Number(url.searchParams.get('people'))));
const admin=await authenticated(req);
if(action==='session')return res.json({authenticated:admin});
if(!admin)return res.status(401).json({error:'Accedi per visualizzare le prenotazioni.'});
return res.json(await readState());
}
const b=req.body||{};
const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
if(b.action==='login'){
if(!await currentPasswordHash())return res.status(503).json({error:'Accesso amministratore non ancora configurato.'});
await rateLimit('login:'+digest(ip),10,900);
if(!await verifyPassword(b.password,await currentPasswordHash()))return res.status(401).json({error:'Credenziali non valide.'});
await login(res);return res.json({ok:true});
}
if(b.action==='changePassword'){if(!await authenticated(req))return res.status(401).json({error:'Accesso richiesto.'});await rateLimit('password:'+digest(ip),10,900);if(!await verifyPassword(b.currentPassword,await currentPasswordHash()))return res.status(401).json({error:'Password attuale non valida.'});await changePassword(b.password);await login(res);return res.json({ok:true});}
if(b.action==='logout'){await logout(req,res);return res.json({ok:true});}
const admin=b.action==='reserve'?false:await authenticated(req);
if(b.action==='reserve')b.action='create';
if(!admin){await rateLimit('booking:'+digest(ip),30,3600);}
try{return res.json(await mutate(b,admin));}catch(e){if(!e.status&&!e.code)e.status=400;throw e;}
}catch(e){const status=e.status||503;return res.status(status).json({error:status===503?'Servizio temporaneamente non disponibile. Riprova più tardi.':e.message});}
}

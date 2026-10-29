import {migrate,rateLimit,database,transaction} from '../server/db.js';
import {verifyPassword,login,logout,digest,currentPasswordHash,changePassword,principal,loginIdentity} from '../server/auth.js';
import {readState,availability,mutate} from '../server/service.js';
import {authorizeRestaurant,restaurantExists,overview,manage,audit,customerCsv} from '../server/tenancy.js';
import {notificationState,enqueue,dispatch} from '../server/notifications.js';
let ready;
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Cookie');
try{
if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Metodo non consentito.'});}
if(req.method==='POST'){const origin=req.headers.origin,host=req.headers.host;if(!origin||origin!=='https://'+host&&!(process.env.NODE_ENV==='test'&&origin==='http://'+host))return res.status(403).json({error:'Origine non consentita.'});if(!req.headers['content-type']?.startsWith('application/json'))return res.status(415).json({error:'Formato non consentito.'});if(JSON.stringify(req.body||{}).length>100000)return res.status(413).json({error:'Richiesta troppo grande.'});}
await (ready??=migrate().catch(e=>{ready=undefined;throw e;}));
const url=new URL(req.url,'https://'+req.headers.host),action=url.searchParams.get('action'),b=req.body||{},actor=await principal(req);
const requested=url.searchParams.get('restaurant')||b.restaurant||null;
if(req.method==='GET'){
if(action==='availability'){const restaurant=requested||'recanto',info=await restaurantExists(restaurant);return res.json({...await availability(url.searchParams.get('date')||'',Number(url.searchParams.get('people')),restaurant),restaurant:info});}
if(action==='session')return res.json({authenticated:!!actor,actor});
if(action==='superadmin')return res.json(await overview(actor));
const restaurant=authorizeRestaurant(actor,requested);await restaurantExists(restaurant);
if(action==='audit'){const cursor=Number(url.searchParams.get('cursor')||0);if(!Number.isSafeInteger(cursor)||cursor<0)return res.status(400).json({error:'Cursore non valido.'});return res.json({events:await audit(restaurant,cursor)});}
if(action==='notifications')return res.json(await notificationState(restaurant));
if(action==='export'){const state=await readState(restaurant);res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="clienti-'+restaurant+'.csv"');await database().query('INSERT INTO recanto_audit(restaurant_id,actor,action) VALUES($1,$2,$3)',[restaurant,actor.username,'export_customers']);return res.send(customerCsv(state.bookings));}
return res.json({...await readState(restaurant),actor,restaurant});
}
const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
if(b.action==='login'){await rateLimit('login:'+digest(ip),10,900);const identity=await loginIdentity(b.username);if(!identity?.hash||!await verifyPassword(b.password,identity.hash))return res.status(401).json({error:'Credenziali non valide.'});await login(res,identity.id);return res.json({ok:true});}
if(b.action==='logout'){await logout(req,res);return res.json({ok:true});}
if(b.action==='changePassword'){if(!actor)return res.status(401).json({error:'Accesso richiesto.'});await rateLimit('password:'+digest(ip),10,900);if(!await verifyPassword(b.currentPassword,await currentPasswordHash(actor.id)))return res.status(401).json({error:'Password attuale non valida.'});await changePassword(b.password,actor.id);await login(res,actor.id);return res.json({ok:true});}
if(['createRestaurant','createUser','disableUser'].includes(b.action))return res.json(await manage(actor,b));
if(b.action==='reserve'||!actor){await rateLimit('booking:'+digest(ip),30,3600);const restaurant=requested||'recanto';await restaurantExists(restaurant);const result=await mutate({...b,action:b.action==='reserve'?'create':b.action},false,restaurant);if(result.notificationId)await dispatch(result.notificationId,restaurant);return res.json({booking:result.booking});}
const restaurant=authorizeRestaurant(actor,requested);await restaurantExists(restaurant);
if(b.action==='sendNotification'){await rateLimit('send:'+restaurant+':'+actor.username,30,3600);if(typeof b.requestId!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(b.requestId))return res.status(400).json({error:'Identificativo richiesta non valido.'});const state=await readState(restaurant),booking=state.bookings.find(x=>x.id===b.bookingId);if(!booking)return res.status(404).json({error:'Prenotazione non trovata.'});const id=restaurant+':manual:'+b.requestId;await transaction(c=>enqueue(c,restaurant,booking,b.channel||state.settings.notificationChannel||'email',id));return res.json(await dispatch(id,restaurant));}
const result=await mutate(b,true,restaurant,actor);if(result.notificationId)await dispatch(result.notificationId,restaurant);return res.json(result);
}catch(e){const status=e.status||(e.code==='23505'?409:e.code?503:400);return res.status(status).json({error:status===503?'Servizio temporaneamente non disponibile. Riprova più tardi.':e.code==='23505'?'Identificativo già utilizzato.':e.message});}
}

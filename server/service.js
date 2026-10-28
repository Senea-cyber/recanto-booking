import {BookingStore,available,channelNames,validate,today} from '../booking.js';
import {transaction,database} from './db.js';
export class MemoryStorage{
constructor(data={}){this.data=structuredClone(data);if(!Object.hasOwn(this.data,'recanto-booking-demo-v1'))this.data['recanto-booking-demo-v1']=[];}
getItem(k){return Object.hasOwn(this.data,k)?JSON.stringify(this.data[k]):null;}
setItem(k,v){this.data[k]=JSON.parse(v);}
removeItem(k){delete this.data[k];}
}
export function snapshot(row){const s=new BookingStore(new MemoryStorage(row.data));return {version:row.version,bookings:s.list(),settings:s.settings(),layout:s.layout(),events:s.events(),waitlist:row.data.waitlist||[]};}
export async function readState(){const r=await database().query('SELECT * FROM recanto_state WHERE id=1');return snapshot(r.rows[0]);}
export async function availability(date,people){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(people)||people<1||people>30)throw Object.assign(Error('Data o persone non valide.'),{status:400});const state=await readState();return {settings:state.settings,slots:available(state.bookings,date,people,state.settings)};}
const publicFields=['first','last','phone','notes','date','time','people'];
export async function mutate(body,admin){return transaction(async c=>{
const r=await c.query('SELECT * FROM recanto_state WHERE id=1 FOR UPDATE');const row=r.rows[0];
if(admin&&body.version!==row.version)throw Object.assign(Error('I dati sono cambiati. Aggiorna la pagina e riprova.'),{status:409});
const storage=new MemoryStorage(row.data),store=new BookingStore(storage);let result;
if(!admin){
if(body.action!=='create')throw Object.assign(Error('Accesso richiesto.'),{status:401});
if(typeof body.requestId!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(body.requestId))throw Error('Identificativo richiesta mancante.');
const previous=await c.query('SELECT result FROM recanto_requests WHERE key=$1',[body.requestId]);if(previous.rowCount)return {booking:previous.rows[0].result};
const d=body.data||{};const clean=Object.fromEntries(publicFields.map(k=>[k,d[k]]));
clean.source='online';clean.status='prenotato';clean.origin=Object.hasOwn(channelNames,d.origin)?d.origin:'direct';
result=store.create(clean);await c.query('INSERT INTO recanto_requests(key,result) VALUES($1,$2)',[body.requestId,JSON.stringify(result)]);
}else{
const args=body.args;if(!Array.isArray(args)||args.length>3)throw Error('Richiesta non valida.');
if(body.action==='enqueue'){const d=args[0]||{};const b={...d,id:'WL-'+crypto.randomUUID(),duration:store.settings().duration,tables:[],status:'prenotato',arrivedCount:0,source:'phone',createdAt:new Date().toISOString()};validate(b,store.layout().tables);if(b.date<today())throw Error('Scegli una data futura.');storage.data.waitlist=[...(storage.data.waitlist||[]),b];result=b;}else if(body.action==='removeWaiting'){storage.data.waitlist=(storage.data.waitlist||[]).filter(b=>b.id!==args[0]);}else if(body.action==='promote'){const b=(storage.data.waitlist||[]).find(b=>b.id===args[0]);if(!b)throw Error('Voce non trovata.');result=store.create(b);storage.data.waitlist=storage.data.waitlist.filter(x=>x.id!==b.id);}else {
const allowed=['create','update','setSettings','setLayout','setClosed','markRead'];if(!allowed.includes(body.action))throw Error('Operazione non valida.');
result=store[body.action](...args);}
}
await c.query('UPDATE recanto_state SET data=$1,version=version+1 WHERE id=1',[JSON.stringify(storage.data)]);
return admin?{state:snapshot({data:storage.data,version:row.version+1}),result}:{booking:result};
});}

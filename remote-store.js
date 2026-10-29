import {layoutForDate,capacityForDate} from './booking.js';
export async function request(body,query=''){
const params=new URLSearchParams(query);const restaurant=body?.restaurant||new URLSearchParams(location.search).get('restaurant');if(restaurant&&!params.has('restaurant'))params.set('restaurant',restaurant);
const r=await fetch('/api/booking?'+params,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'Operazione non riuscita.'),{status:r.status});return data;}
export class RemoteStore{
constructor(){this.state=null;this.busy=false;}
async refresh(){this.state=await request(null,'?action=state');}
list(){return this.state.bookings;}
settings(date){return date?{...this.state.settings,capacity:capacityForDate(this.state.layout,this.state.settings,date)}:this.state.settings;}
layout(date){return layoutForDate(this.state.layout,date);}
waitlist(){return this.state.waitlist||[];}
enqueue(...args){return this.change('enqueue',args);}
removeWaiting(...args){return this.change('removeWaiting',args);}
promote(...args){return this.change('promote',args);}
events(){return this.state.events;}
async change(action,args){if(this.busy)throw Error('Salvataggio in corso. Attendi.');this.busy=true;try{const r=await request({action,args,version:this.state.version});this.state={...this.state,...r.state};return r.result;}finally{this.busy=false;}}
create(...args){return this.change('create',args);}
update(...args){return this.change('update',args);}
setSettings(...args){return this.change('setSettings',args);}
setFloorplan(...args){return this.change('setFloorplan',args);}
setLayout(...args){return this.change('setLayout',args);}
setClosed(...args){return this.change('setClosed',args);}
markRead(...args){return this.change('markRead',args);}
}

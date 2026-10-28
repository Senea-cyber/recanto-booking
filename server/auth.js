import {randomBytes,createHash,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {database} from './db.js';
const scrypt=promisify(derive);
export const digest=value=>createHash('sha256').update(value).digest('hex');
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');return salt+':'+(await scrypt(password,salt,64)).toString('hex');}
export async function verifyPassword(password,encoded){if(typeof password!=='string'||password.length>256||typeof encoded!=='string'||!/^([a-f0-9]{32}):([a-f0-9]{128})$/.test(encoded))return false;const [salt,hash]=encoded.split(':');return timingSafeEqual(await scrypt(password,salt,64),Buffer.from(hash,'hex'));}
export function token(req){return /(?:^|;\s*)recanto_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1]||'';}
export async function authenticated(req){const t=token(req);if(!t)return false;const r=await database().query('SELECT 1 FROM recanto_sessions WHERE token_hash=$1 AND expires_at>now()',[digest(t)]);return !!r.rowCount;}
export async function login(res){const t=randomBytes(32).toString('hex');await database().query("DELETE FROM recanto_sessions WHERE expires_at<now()");await database().query("INSERT INTO recanto_sessions VALUES($1,now()+interval '8 hours')",[digest(t)]);res.setHeader('Set-Cookie','recanto_session='+t+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800');}
export async function logout(req,res){await database().query('DELETE FROM recanto_sessions WHERE token_hash=$1',[digest(token(req))]);res.setHeader('Set-Cookie','recanto_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');}

export async function currentPasswordHash(){const r=await database().query('SELECT password_hash FROM recanto_admin WHERE id=1');return r.rows[0]?.password_hash||process.env.ADMIN_PASSWORD_HASH;}
export async function changePassword(password){if(typeof password!=='string'||password.length<14||password.length>256)throw Object.assign(Error('Usa una password di almeno 14 caratteri.'),{status:400});const hash=await hashPassword(password);const c=await database().connect();try{await c.query('BEGIN');await c.query('INSERT INTO recanto_admin VALUES(1,$1) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash',[hash]);await c.query('DELETE FROM recanto_sessions');await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}

import pg from 'pg';
import {defaultWeek} from '../booking.js';
let pool;
export function database(){if(!process.env.DATABASE_URL)throw Object.assign(Error('Database non configurato.'),{status:503});return pool??=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:8000});}
export async function transaction(fn){const c=await database().connect();try{await c.query('BEGIN');await c.query("SET LOCAL lock_timeout = '8s'");const value=await fn(c);await c.query('COMMIT');return value;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
export async function migrate(){await database().query(`
CREATE TABLE IF NOT EXISTS recanto_state(id integer PRIMARY KEY CHECK(id=1),version integer NOT NULL DEFAULT 0,data jsonb NOT NULL);

CREATE TABLE IF NOT EXISTS recanto_admin(id integer PRIMARY KEY CHECK(id=1),password_hash text NOT NULL);
CREATE TABLE IF NOT EXISTS recanto_sessions(token_hash text PRIMARY KEY,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS recanto_limits(key text PRIMARY KEY,hits integer NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS recanto_requests(key text PRIMARY KEY,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
`);await database().query('INSERT INTO recanto_state(id,data) VALUES(1,$1) ON CONFLICT DO NOTHING',[JSON.stringify({'recanto-booking-demo-v1':[],'recanto-booking-settings-v2':{weekly:defaultWeek().map(day=>({...day,open:false}))}})]);}
export async function rateLimit(key,limit,seconds){const r=await database().query(`INSERT INTO recanto_limits(key,hits,expires_at) VALUES($1,1,now()+$2*interval '1 second')
ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN recanto_limits.expires_at<now() THEN 1 ELSE recanto_limits.hits+1 END,expires_at=CASE WHEN recanto_limits.expires_at<now() THEN excluded.expires_at ELSE recanto_limits.expires_at END RETURNING hits`,[key,seconds]);if(r.rows[0].hits>limit)throw Object.assign(Error('Troppi tentativi. Riprova più tardi.'),{status:429});}

# Recanto Booking

Applicazione per una sede con prenotazioni condivise in PostgreSQL, area amministratore autenticata e gestione sala.

## Architettura
- Interfaccia italiana: prenotazioni pubbliche, agenda, schema tavoli, sale e posti configurabili, giorni/orari, chiusure per servizio, walk-in, lista d'attesa e riconferme manuali.
- API Vercel `/api/booking`; PostgreSQL Neon in regione Francoforte.
- Stato centrale JSONB versionato: transazione con `SELECT FOR UPDATE` prima di validare e salvare. Capienza e conflitti tavoli sono verificati sul server. Le modifiche amministrative obsolete ricevono 409.
- Sessioni casuali di otto ore nel database (token memorizzati come hash), cookie Secure/HttpOnly/SameSite=Strict, verifica Origin, password scrypt, limite dei tentativi e logout revocabile.
- Dati dei clienti restituiti solo alle sessioni amministratore; API pubblica restituisce disponibilità senza elenco clienti. Il canale src Facebook/Instagram/Google/Maps resta disponibile.
- Lista d'attesa senza occupazione posti; promozione a prenotazione atomica e subordinata alla disponibilità.
- Riconferme gestite dal personale: nessun SMS, WhatsApp o email automatico.

## Configurazione
Variabili server Vercel: `DATABASE_URL` e `ADMIN_PASSWORD_HASH` (salt esadecimale di 16 byte, due punti, hash scrypt di 64 byte). Nessuna credenziale in Git.
Database production e preview distinti tramite branch Neon. Il cambio password dall'area amministratore salva il nuovo hash nel database e invalida le altre sessioni; il valore in database prevale sull'hash iniziale.
Il primo avvio crea tabelle senza sovrascrivere dati. Un nuovo archivio parte senza prenotazioni e con tutti i giorni chiusi online: configurare prima sale, tavoli, capienza e calendario dal pannello.
Le impostazioni iniziali dei tavoli sono un modello da adattare alla sala reale. I dati delle vecchie demo nel browser non vengono cancellati né importati automaticamente: non costituiscono prenotazioni ricevute dal ristorante.

## Pubblicazione
`npm ci && npm run build` copia solo i sei asset pubblici in `public/`. Vercel pubblica l'API separatamente e non espone i sorgenti server, test o file di configurazione.
Repository: https://github.com/Senea-cyber/recanto-booking
Sito: https://recanto-booking.vercel.app/admin

## Test
- `npm test`: regole originali di disponibilità, tavoli, calendario, capienza e canali.
- `npm run test:integration`: database PostgreSQL dedicato **esclusivamente ai test**. Impostare DATABASE_URL; il test svuota le tabelle recanto_* del database indicato. Non eseguire su database production o preview con dati da conservare.
- `TEST_PASSWORD=... node test/browser.mjs`: Playwright 1.56.1 installato separatamente, ambiente test isolato. Verifica login, impostazioni, attesa/promozione, cancellazione, logout, prenotazione online, Instagram, schema sale e larghezza mobile. Il test modifica dati: non usarlo in produzione.
- `server/dev.mjs` è esclusivamente un server per test in cloud, mai il server di produzione.

## Limiti e prossimi interventi
La piantina è uno schema per sala, senza coordinate o trascinamento. Promemoria automatici e messaggistica non sono collegati. L'amministrazione usa un account condiviso: ruoli per dipendente e storico completo delle modifiche sono evoluzioni successive. Lo stato JSONB viene serializzato per sede; valutare tabelle normalizzate e archivio separato quando cresceranno volume e numero di sedi.
Il piano Neon dell'organizzazione è Free: nessun piano a pagamento attivato. Restano applicabili le quote gratuite dei servizi e dell'hosting.

## Riferimenti funzionali
- [Top Food](https://topfood.app/it/sistema-prenotazioni-ristorante-gratis): semplicità della prenotazione diretta e capienza contemporanea.
- [easyTable](https://easytable.com/it/caratteristiche/): agenda, elenco e vista tavoli.
- [tablesat](https://tablesat.com/it/pricing): walk-in e organizzazione della sala; i messaggi automatici risultano indicati come funzioni in arrivo nella pagina consultata.

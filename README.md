# Recanto Booking

Prenotazioni condivise in PostgreSQL con accesso protetto e gestione di più ristoranti.

## Funzioni
- Agenda, disponibilità, capienza, giorni/orari, chiusure, walk-in, lista d'attesa e tracking provenienza social.
- Piantina riservata al personale: tavoli trascinabili e spostabili con pulsanti, forme, pareti e ingressi disegnabili, salvataggio condiviso. Nomi e stato dei clienti per orario; conferma arrivo/uscita dal tavolo. Sale, nomi tavoli e posti restano configurabili dalle impostazioni del responsabile.
- Prenotazione telefonica con suggerimenti degli orari disponibili, controlli di capienza e conflitti eseguiti anche dal server.
- Clienti: ricerca, cronologia prenotazioni, esportazione CSV e registro delle operazioni da questa versione.
- /superadmin: creazione ristoranti, utenti responsabili/operatori, disattivazione accessi e ingresso nei pannelli delle sedi. Le nuove sedi partono senza prenotazioni e con calendario chiuso.
- Conferme manuali o automatiche alla creazione, canale predefinito email/SMS/WhatsApp e registro esiti. Gli invii sono disattivati finché non viene collegato un fornitore.

## Accessi e separazione
L'account preesistente è il superamministratore, nome utente `owner`, con password invariata. I nuovi utenti sono assegnati a una sola sede. Il responsabile configura il ristorante; l'operatore gestisce prenotazioni, piantina e clienti ma non modifica calendario, capienza o impostazioni generali.
Le API verificano ruolo e sede sul server. I link delle sedi usano `?restaurant=identificativo`, anche sulla pagina pubblica. Il parametro non concede accesso ai dati di un altro ristorante.
Sessioni di otto ore con token memorizzati come hash, cookie Secure/HttpOnly/SameSite=Strict, verifica Origin, password scrypt, limite tentativi e revoca al cambio password/disattivazione.

## Database
API Vercel /api/booking, PostgreSQL Neon in Francoforte. Stato JSONB versionato per sede e SELECT FOR UPDATE prima della validazione: richieste contemporanee non superano la capienza, modifiche amministrative obsolete ricevono 409.
Le migrazioni sono additive e non sovrascrivono l'archivio esistente. Recanto mantiene la propria riga originale; le altre sedi usano righe separate. Audit, utenti e coda messaggi sono tabelle dedicate.
Variabili server: DATABASE_URL e ADMIN_PASSWORD_HASH per il primo avvio. Il nuovo hash salvato nel database prevale sul valore iniziale. Database preview e production separati.
Il modello iniziale di tavoli va adattato alla sala reale. Le vecchie demo nel browser non sono importate automaticamente.

## Notifiche
Email è il canale predefinito. In /superadmin, sezione **Email dei ristoranti**, selezionare la sede e inserire server SMTP, porta 587 STARTTLS o 465 TLS, mittente, utente e password. Lasciare vuota la password nei successivi salvataggi per mantenerla. Il pulsante Verifica connessione controlla autenticazione e TLS senza inviare email. Il provider può richiedere una password per app; alcuni account con solo OAuth non supportano questa modalità.
Le configurazioni sono cifrate con AES-256-GCM e vincolate alla sede; la chiave server SETTINGS_ENCRYPTION_KEY è distinta per production/preview, esclusa da Git. Non ruotarla senza ricifrare le configurazioni già salvate. La password non viene restituita dalle API. SMTP accetta solo host pubblici, TLS verificato e porte 465/587. La configurazione è riservata al superamministratore.
Quando SMTP è abilitato ha precedenza sull'adattatore Resend. Nessuna casella reale è ancora configurata; testare il proprio mittente prima di attivare conferme automatiche.

Variabile server privata `NOTIFICATION_PROVIDERS`: oggetto JSON indicizzato per identificativo ristorante, ad esempio `recanto`. Ogni sede può avere:
- `email: {apiKey, from}`: Resend, mittente autorizzato.
- `sms: {sid, token, from}`: Twilio, mittente abilitato.
- `whatsapp: {sid, token, from, contentSid}`: Twilio WhatsApp, template approvato con variabili 1 nome, 2 data, 3 ora, 4 persone, 5 stato.

Non inserire credenziali nel repository o nel browser. Configurarle solo nelle variabili protette Vercel. SMS/WhatsApp richiedono numero internazionale +39...; email richiede l'indirizzo nella prenotazione.
Ogni invio passa da una coda persistente e viene acquisito una volta. “accepted” significa accettato dal fornitore, non consegnato. Esiti incerti vanno verificati prima di ripetere l'invio. Non sono presenti webhook di consegna, retry automatici o promemoria programmati; restano disponibili le riconferme manuali.
Nessun fornitore o piano a pagamento è stato attivato. Gli adattatori sono verificati con risposte simulate; l'invio reale richiede configurazione e prova autorizzata del mittente. La gratuità di SMS/WhatsApp non è garantita.

## Pubblicazione e verifiche
`npm ci && npm run build` copia solo gli asset autorizzati in public/. I sorgenti server, test e configurazioni non vengono pubblicati come file statici.
- `npm test`: 10 test delle regole di prenotazione.
- `npm run test:integration`: 18 test di API, concorrenza, autenticazione, isolamento sedi, ruoli, piantina, CSV e notifiche. **Svuota solo il database isolato recanto_test su localhost/127.0.0.1**; il codice rifiuta altri database.
- `node test/features.browser.mjs`: Playwright 1.56.1 installato separatamente, dopo i test di integrazione e con server/dev.mjs su localhost:3000. Modifica esclusivamente i dati di test. Verifica trascinamento/salvataggio, disegno pareti, arrivo cliente, esportazione/storico, preferenze messaggi, superadmin, telefono e larghezza mobile.
- server/dev.mjs serve esclusivamente per prove isolate in cloud.
- I test automatici non vanno eseguiti sulla produzione.

Repository: https://github.com/Senea-cyber/recanto-booking
Amministrazione: https://recanto-booking.vercel.app/admin
Superamministrazione: https://recanto-booking.vercel.app/superadmin

## Limiti e passi successivi
App dedicata a operatori/camerieri, notifiche push e promemoria temporizzati restano fasi successive. Il pannello attuale è utilizzabile da browser mobile.
Lo storico mostra le prenotazioni esistenti; l'audit delle operazioni parte da questa versione e non ricostruisce modifiche precedenti. Per grandi volumi valutare prenotazioni normalizzate, paginazione e archivio separato.
Il piano Neon è Free; nessun upgrade attivato. Restano applicabili le quote gratuite dei servizi e dell'hosting.

## Piantina adattiva e disposizioni giornaliere
In **Tavoli**, la vista **Tutte le sale** mostra le piantine affiancate su schermi grandi e una sotto l'altra sul telefono. Cerca un cliente per vedere sala, tavolo e orario; scegli il risultato e conferma l'arrivo.
Prima di modificare scegli **Solo questo giorno** oppure **Modello abituale**. Seleziona un tavolo per cambiare i posti (1–30), forma, orientamento e dimensioni. La lunghezza automatica segue le persone della prenotazione attiva all'orario mostrato; per un gruppo su più tavoli mostra la quota di persone su ciascuno e i riferimenti del gruppo. Puoi anche trascinare il quadratino nell'angolo per ridimensionare manualmente.
Le disposizioni del giorno sono conservate separatamente dal modello abituale. Posti ridotti sono verificati contro prenotazioni assegnate, coperti complessivi e soggiorni a cavallo della mezzanotte. La capienza online non viene alzata automaticamente oltre il limite generale delle Impostazioni.
La disposizione giornaliera vale per l'intera giornata, mentre nomi e occupazione cambiano con l'orario selezionato. La lunghezza grafica non assegna automaticamente tavoli ai clienti: assegna un tavolo o più tavoli dalla prenotazione, dopo aver verificato la disposizione reale.
Verifiche aggiuntive: `node --test test/adaptive.test.mjs` (4 test), `node test/adaptive.browser.mjs` (browser in cloud, database isolato). I test di integrazione sono ora 19.

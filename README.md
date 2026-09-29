# Recanto Booking

Demo statica mobile-first per Recanto Brasil. Nessuna integrazione esterna attiva, nessun pagamento, nessuna prenotazione reale.

## Percorsi
- `/`: prenotazione, persone, data, orari, contatti, note.
- `/conferma`: riepilogo dell'ultima prova nella sessione.
- `/admin`: amministrazione demo aperta; elenco giornaliero, inserimento telefonico, modifica, cancellazione e otto stati.

## Prova
Aprire la pagina pubblica, scegliere una data futura e un orario, inserire un nome fittizio e `0001234567`, confermare. Aprire `/admin` nello stesso browser e selezionare la stessa data. Provare modifica, cambio stato e cancellazione. Dieci prenotazioni fittizie sono create alla prima apertura per il giorno corrente.

## Limiti espliciti della demo
Dati in localStorage, separati per origine/browser/dispositivo; nessun database condiviso o autenticazione. `/admin` non è riservato. Non inserire dati personali reali. Disponibilità dimostrativa: 130 coperti contemporanei, durata 120 minuti, massimo 30 persone per prenotazione, fuso Europe/Rome. Nessuna garanzia di atomicità tra più schede: per l'uso reale occorre un backend transazionale.

## Pubblicazione Vercel
Repository nuovo `recanto-booking`, framework preset Other, root directory del progetto, nessun comando build, output directory `.`. `vercel.json` gestisce i percorsi e gli header. Nessun dominio da acquistare, nessuna dipendenza di runtime. La disponibilità del dominio `recanto-booking.vercel.app` deve essere verificata da Vercel.

## Evoluzione prevista, non implementata
`booking.js` separa l'archivio dall'interfaccia. Sostituire BookingStore con un'API server e un database transazionale; autenticare gli amministratori e autorizzare tutte le operazioni sul server. Applicare controllo concorrenza, rate limit, validazione server, retention e informativa privacy prima dell'uso reale.

`integrations` espone quattro configurazioni disattivate: WhatsApp, Google Business Profile, Facebook e Instagram. Futuri connettori solo lato server, con credenziali in variabili d'ambiente. Nessun SDK, tracking, messaggio o collegamento attivo in questa versione. Non è garantita la futura approvazione di pulsanti o API da parte delle piattaforme.

## Verifica
`npm test`: capienza per intervalli sovrapposti, liberazione posti tramite cancellazione, persistenza e validazione. UI in italiano, HTML semantico, dialoghi nativi, navigazione da tastiera, layout responsive.

## Simulazione gestione sala v2
Vedi STUDIO-FUNZIONALE.md per fonti, corrispondenze, limiti e prove. Agenda per servizi, intervalli 15 minuti, tavoli demo, arrivi parziali, note interne, storico cliente, registro notifiche, chiusura online. I dati esistenti sono conservati e completati con valori predefiniti. Per uno scenario pieno, scegliere una data vuota e usare Carica scenario da 130 coperti.

## Giorni e orari di apertura
In Admin → Impostazioni si configurano i sette giorni, con apertura/chiusura giornaliera e pranzo/cena indipendenti. Primo e ultimo arrivo prenotabile sono inclusi, con passo di 15 minuti. La demo distingue pranzo prima delle 17:00 e cena dalle 17:00; non gestisce arrivi oltre mezzanotte. Le prenotazioni esistenti restano visibili e modificabili. Le chiusure straordinarie per data prevalgono sul calendario. Il personale può inserire manualmente eccezioni agli orari (sempre entro i limiti di capienza e tavoli). I dati e il calendario restano locali al browser.

## Sale e tavoli configurabili
Admin → Impostazioni → Sale, tavoli e posti: aggiunta/rinomina/rimozione sale, inserimento di più tavoli con posti predefiniti, nome e posti modificabili per tavolo. Le identità dei tavoli sono stabili anche rinominandoli. Il salvataggio aggiorna la capienza alla somma dei posti; il limite può poi essere ridotto nelle impostazioni generali. Rimozione di tavoli assegnati oggi o in futuro e riduzioni incompatibili con le prenotazioni attive vengono rifiutate. I dati storici vengono conservati. La vista sale è uno schema, senza posizionamento grafico dei tavoli.

## Link per canale, solo per prove
- Facebook: `https://recanto-booking.vercel.app/?src=facebook`
- Instagram: `https://recanto-booking.vercel.app/?src=instagram`
- Google Business Profile: `https://recanto-booking.vercel.app/?src=google`
- Google Maps: `https://recanto-booking.vercel.app/?src=maps`

La scheda admin indica il canale di provenienza per le nuove prenotazioni demo. I parametri arbitrari sono ignorati. Questi link NON vanno ancora pubblicati sui profili reali: l'archivio è nel browser del cliente, l'admin non è protetto e nessun ristorante riceve la prenotazione. Prima della distribuzione occorrono archivio condiviso, controllo capienza sul server, area admin autenticata, informativa privacy e verifica completa. I pulsanti delle piattaforme si configurano nei profili della sede con accesso autorizzato; la presenza del link non implica l'integrazione partner “Prenota con Google” o il pulsante “Prenota” di Instagram.

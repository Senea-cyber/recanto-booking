# Recanto Booking

Demo statica mobile-first per Recanto Brasil. Nessuna integrazione esterna attiva, nessun pagamento, nessuna prenotazione reale.

## Percorsi
- `/`: prenotazione, persone, data, orari, contatti, note.
- `/conferma`: riepilogo dell'ultima prova nella sessione.
- `/admin`: amministrazione demo aperta; elenco giornaliero, inserimento telefonico, modifica, cancellazione e cinque stati.

## Prova
Aprire la pagina pubblica, scegliere una data futura e un orario, inserire un nome fittizio e `0001234567`, confermare. Aprire `/admin` nello stesso browser e selezionare la stessa data. Provare modifica, cambio stato e cancellazione. Sei prenotazioni fittizie sono create alla prima apertura per il giorno corrente.

## Limiti espliciti della demo
Dati in localStorage, separati per origine/browser/dispositivo; nessun database condiviso o autenticazione. `/admin` non è riservato. Non inserire dati personali reali. Disponibilità dimostrativa: 40 coperti contemporanei, durata 120 minuti, massimo 30 persone per prenotazione, fuso Europe/Rome. Nessuna garanzia di atomicità tra più schede: per l'uso reale occorre un backend transazionale.

## Pubblicazione Vercel
Repository nuovo `recanto-booking`, framework preset Other, root directory del progetto, nessun comando build, output directory `.`. `vercel.json` gestisce i percorsi e gli header. Nessun dominio da acquistare, nessuna dipendenza di runtime. La disponibilità del dominio `recanto-booking.vercel.app` deve essere verificata da Vercel.

## Evoluzione prevista, non implementata
`booking.js` separa l'archivio dall'interfaccia. Sostituire BookingStore con un'API server e un database transazionale; autenticare gli amministratori e autorizzare tutte le operazioni sul server. Applicare controllo concorrenza, rate limit, validazione server, retention e informativa privacy prima dell'uso reale.

`integrations` espone quattro configurazioni disattivate: WhatsApp, Google Business Profile, Facebook e Instagram. Futuri connettori solo lato server, con credenziali in variabili d'ambiente. Nessun SDK, tracking, messaggio o collegamento attivo in questa versione. Non è garantita la futura approvazione di pulsanti o API da parte delle piattaforme.

## Verifica
`npm test`: capienza per intervalli sovrapposti, liberazione posti tramite cancellazione, persistenza e validazione. UI in italiano, HTML semantico, dialoghi nativi, navigazione da tastiera, layout responsive.

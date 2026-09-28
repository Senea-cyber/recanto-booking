# Recanto Booking — riferimento funzionale

Analisi del 28 settembre 2026. Obiettivo: simulare il lavoro quotidiano mostrato nelle cinque foto del cliente, con identità Recanto e dati inventati. Non si è avuto accesso a un account TheFork Manager: la corrispondenza dei dettagli interni non è verificata.

## Fonti
- Foto fornite dal cliente: agenda pranzo/cena, gruppi per orario, assegnazione tavolo, scheda prenotazione, arrivi, uscita, note interne, durata, notifiche di riconferma/cancellazione. Nessun nominativo o numero delle foto è stato importato.
- [Pagina ufficiale gestione prenotazioni](https://www.theforkmanager.com/it/app-gestione-prenotazioni-ristorante): conferma gestione centralizzata, servizi e turni, pianta sala, assegnazione automatica, schede clienti e lavoro condiviso tra dispositivi.
- [Novità ufficiali del gestionale](https://www.theforkmanager.com/it/blog/strumenti-thefork/ultime-novita-thefork-manager): descrive segnalazione ritardi oltre 15 minuti, accessi del personale tramite PIN e gestione della durata. Articolo storico: non prova la disposizione attuale dei comandi.

## Simulazione implementata
| Area | Comportamento Recanto |
|---|---|
| Agenda | Giorno precedente/successivo, oggi, pranzo/cena/tutti; conteggi per servizio; raggruppamento ogni 15 minuti |
| Ricerca | Nome, telefono, codice; filtro stato, attesi, ritardi, tavoli non assegnati |
| Accoglienza | Prenotato, confermato, riconfermato, arrivo parziale con conteggio, arrivato, uscito, no-show, cancellato |
| Prenotazione | Data, orario, 1–30 persone, durata, provenienza, note cliente/interne, occasione |
| Cliente | Storico dimostrativo associato allo stesso telefono |
| Tavoli | Schema di esempio: 20 tavoli da 4 e 5 da 10; due sale; selezione multipla; blocco sovrapposizioni e verifica posti |
| Disponibilità | Capienza contemporanea iniziale 130, durata iniziale 120 minuti, chiusura online per data e servizio |
| Registro | Eventi locali con non letti e accesso alla prenotazione; nessun invio esterno |
| Prova sala piena | Su giornata vuota: 4 gruppi da 30 e uno da 10 alle 19:30 |

## Differenze e decisioni aperte
- Nessun database condiviso, login o ruolo staff. La demo usa localStorage; la prenotazione di un altro telefono non arriva qui.
- Lo stato riconfermato è manuale: non simula l'invio di un messaggio al cliente.
- Pianta reale, tavoli unibili, giorni di chiusura, orari e durata reale da concordare. 130 è un riferimento operativo comunicato dal cliente, non una certificazione di capienza.
- Assegnazione tavoli manuale; nessun algoritmo automatico di combinazione né trascinamento della pianta.
- Nessuna sincronizzazione con TheFork, marketplace, recensioni, punti fedeltà, pagamenti, chiamate automatiche, Google o social.
- Nessuna garanzia contro scritture simultanee tra schede: il passaggio reale richiede API e database transazionali.

Prima fase di valutazione: il personale prova una giornata, aggiunge una telefonata, assegna tavoli, registra arrivi/uscite e chiude online un servizio. Solo dopo si configurano archiviazione condivisa, autenticazione e integrazioni.

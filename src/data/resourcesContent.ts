// Contenuti estesi delle risorse: operativi, diretti, senza giri di parole.

export interface ResourceSection {
  title: string;
  body: string;
  points: string[];
}

export interface ResourceContent {
  slug: string;
  intro: string[];
  sections: ResourceSection[];
  checklist: string[];
}

export const RESOURCES_CONTENT: Record<string, ResourceContent> = {
  'template-landing': {
    slug: 'template-landing',
    intro: [
      'Una landing page ha un solo lavoro: trasformare un visitatore confuso in un iscritto convinto. Struttura obbligatoria, dall\u2019alto in basso: headline con promessa misurabile, sottotitolo che dice per chi è, CTA con email, 3 benefici con screenshot, prova sociale (anche “usato da 12 beta tester”), pricing o “gratis in beta”, FAQ che smontano le 5 obiezioni, footer con contatti veri.',
      'Regole dure: una sola azione per pagina (iscriviti), niente menu di navigazione che distrae, caricamento sotto 2 secondi, leggibile da telefono (il 70% del traffico). Se la headline non si capisce in 5 secondi, riscrivila.',
    ],
    sections: [
      {
        title: 'Headline che converte',
        body: 'Formula: [risultato] per [utente specifico] senza [dolore]. Cattiva: “La piattaforma innovativa per il futuro”. Buona: “Chiudi la prima nota in 2 ore, se sei un commercialista con meno di 10 dipendenti”.',
        points: ['Una promessa, un numero, un utente', 'Sottotitolo: per chi è e cosa NON è', 'CTA sopra la piega: email + bottone, nient\u2019altro'],
      },
      {
        title: 'Le 3 sezioni che non puoi saltare',
        body: 'Benefici (non funzioni): ogni beneficio = titolo + 1 riga + screenshot. Prova sociale: numeri veri, anche piccoli (“37 iscritti alla beta”). FAQ: le 5 obiezioni che senti in call, con risposte da 2 righe.',
        points: ['Beneficio → screenshot → didascalia, × 3', 'Numeri veri, mai “migliaia di utenti felici” inventati', 'FAQ scritte con le parole dei clienti, non le tue'],
      },
      {
        title: 'Deploy in 5 minuti',
        body: 'Next.js + Tailwind, push su GitHub, import su Vercel, collega il dominio. Form email: il provider che usi già (Resend, Loops) con double opt-in solo se serve davvero — all\u2019inizio, ogni attrito uccide iscrizioni.',
        points: ['Vercel: import repo → deploy → dominio', 'Analytics minimali: iscrizioni/giorno e fonte', 'Test su telefono reale prima di condividere il link'],
      },
    ],
    checklist: ['Headline capita in 5 secondi', 'Una sola CTA per pagina', 'Niente menu che distrae', '3 benefici con screenshot', 'Prova sociale con numeri veri', 'FAQ con 5 obiezioni', 'Sotto 2 secondi di caricamento', 'Leggibile da telefono'],
  },
  'checklist-pre-lancio': {
    slug: 'checklist-pre-lancio',
    intro: [
      'Il lancio fallisce quasi mai per il prodotto e quasi sempre per gli ovvii dimenticati: email che finiscono in spam, pagamenti che non sbloccano, link rotti. Questa checklist si fa in 2 ore, nell\u2019ordine scritto.',
    ],
    sections: [
      {
        title: 'Prodotto e conti',
        body: 'Il giro soldi deve funzionare end-to-end in modalità test E live: paga, verifica l\u2019accesso sbloccato, rimborsa. Poi i limiti: rate limit sulle API, tetto di spesa AI, backup verificato.',
        points: ['Checkout test + live (poi rimborso)', 'Webhook con firma e dedup verificati', 'Piani e prezzi letti dal DB, mai dal client', 'Tetto spesa AI + kill-switch attivo'],
      },
      {
        title: 'Email e domini',
        body: 'Dominio verificato (SPF/DKIM), email di test a Gmail e Outlook lette fuori dallo spam, link di reset e OTP provati da telefono. Redirect OAuth e callback aggiornati al dominio di produzione, non localhost.',
        points: ['SPF/DKIM verificati', 'OTP + reset + ricevute testati', 'Redirect auth sul dominio reale', 'Pagina 404 e pagina errore decenti'],
      },
      {
        title: 'Legale e misura',
        body: 'Privacy e termini pubblicati e collegati nel footer, cookie banner se tracci, analytics con i 4 numeri del funnel (visite → signup → attivazione → pagamento). Errori in Sentry con alert che leggi davvero.',
        points: ['Privacy + termini online', 'Funnel a 4 numeri in dashboard', 'Sentry attivo + alert testato', 'Uptime monitor esterno'],
      },
      {
        title: 'Giorno del lancio',
        body: 'Congela il codice la sera prima (niente deploy il giorno X salvo hotfix). Prepara: post di lancio, risposte alle 10 obiezioni, lista di 30 persone da avvisare. Il giorno X stai nei commenti, non nell\u2019editor.',
        points: ['Freeze codice la sera prima', 'Post + video demo <90s pronti', '30 persone avvisate', 'Risposta a ogni commento entro 1h'],
      },
    ],
    checklist: ['Giro soldi test+live+rimborso', 'Webhook firmati con dedup', 'Email fuori dallo spam', 'Redirect auth su dominio reale', 'Privacy/termini pubblicati', 'Funnel 4 numeri attivo', 'Sentry + uptime monitor', 'Freeze codice + piano giorno X'],
  },
  'domini-hosting': {
    slug: 'domini-hosting',
    intro: [
      'Il dominio si sceglie in un pomeriggio e si tiene per anni: .com o estensione del tuo paese, corto, pronunciabile al telefono, senza trattini né numeri. Se il .com è occupato da un sito attivo, cambia nome: litigare per domini è un lusso da grandi aziende.',
    ],
    sections: [
      {
        title: 'Registrazione e DNS',
        body: 'Registrar: Cloudflare, Porkbun o Namecheap (prezzi onesti, niente upsell). DNS su Cloudflare (gratis, veloce, con proxy). Record minimi: A/AAAA o CNAME verso l\u2019hosting, MX solo se usi email sul dominio, TXT per SPF/DKIM quando mandi email.',
        points: ['Auto-rinnovo attivo + lock trasferimento', 'DNS su Cloudflare con proxy', 'TTL basso (300s) solo durante migrazioni'],
      },
      {
        title: 'Hosting senza pensieri',
        body: 'Next.js → Vercel (zero config, preview per PR). Cron, email e storage restano sui servizi gestiti che usi già. VPS solo se hai un motivo preciso e sai amministrarlo: aggiornamenti, firewall, backup diventano lavoro tuo.',
        points: ['Produzione e preview separati', 'Variabili d\u2019ambiente diverse per env', 'HTTPS e redirect www→apex (o viceversa) coerenti'],
      },
      {
        title: 'Errori costosi da evitare',
        body: 'Email mandate dal dominio senza SPF/DKIM (spam garantito), DNS modificato senza annotare i vecchi valori, dominio registrato con email personale che perderai, scadenza dominio senza auto-rinnovo. Ognuno di questi ha ucciso lanci veri.',
        points: ['SPF/DKIM prima della prima email', 'Screenshot dei record DNS prima di toccarli', 'Email amministrativa su casella che controlli', 'Scadenza dominio in calendario + auto-rinnovo'],
      },
    ],
    checklist: ['Nome corto, pronunciabile, .com o ccTLD', 'Registrar serio + auto-rinnovo + lock', 'DNS Cloudflare, HTTPS attivo', 'SPF/DKIM se mandi email', 'Redirect www coerenti', 'Env separate prod/preview'],
  },
  'wireframe-kit': {
    slug: 'wireframe-kit',
    intro: [
      'Il wireframe serve a buttare via idee brutte in ore invece che in settimane di codice. Regola: grigio, niente colori né loghi, solo gerarchia e flusso. Se discuti di colori sui wireframe, stai sbagliando fase.',
    ],
    sections: [
      {
        title: 'Le 5 schermate obbligatorie',
        body: 'Landing (headline + CTA + prova), signup/login (minimo campi possibile), schermata principale vuota (onboarding/empty state curato: è quello che vedono i nuovi utenti), flusso core (il job-to-be-done in 3 click), impostazioni/pagamento. Tutto il resto è extra.',
        points: ['Disegna mobile prima: il 70% arriva da lì', 'Empty state disegnato, mai pagina bianca', 'Max 3 click per il task principale'],
      },
      {
        title: 'Componenti da riusare sempre',
        body: 'Header con una sola azione, card con titolo + 2 righe + azione, form con label sopra e errore sotto il campo, tabella con max 5 colonne su desktop (cards su mobile), modale solo per conferme distruttive. Costruisci questi 5 blocchi una volta e componi tutto il resto.',
        points: ['5 blocchi base, niente eccezioni', 'Stati: loading, vuoto, errore per OGNI blocco', 'Focus visibile e contrasto AA sui testi'],
      },
      {
        title: 'Test in 1 ora con 3 persone',
        body: 'Mostra i wireframe a 3 potenziali utenti con un task (“iscriviti e fai X”). Non spiegare nulla: dove esitano, l\u2019interfaccia è sbagliata. Tre test trovano l\u201980% dei problemi; rifai e ripeti.',
        points: ['Task concreto, zero spiegazioni', 'Annota esitazioni, non opinioni', 'Itera sui 3 problemi più gravi e ritesta'],
      },
    ],
    checklist: ['5 schermate core disegnate', 'Mobile prima', 'Empty/loading/error per ogni blocco', 'Task core in ≤3 click', 'Test con 3 utenti fatto', 'Niente colori prima della struttura ok'],
  },
  'roadmap-2026': {
    slug: 'roadmap-2026',
    intro: [
      'Cosa studiare nel 2026 se vuoi fare il founder tecnico (o farti assumere mentre costruisci). Ordine di priorità, non lista della spesa: finisci un livello prima di aprire il successivo.',
    ],
    sections: [
      {
        title: 'Livello 1 — shippare (mesi 1-3)',
        body: 'HTML/CSS/JavaScript moderni, React + Next.js (routing, form, fetch dati), Git + GitHub (branch, PR), Tailwind, deploy su Vercel. Obiettivo: una app CRUD online con login. Senza questo, tutto il resto è teoria.',
        points: ['1 app CRUD completa online', 'Git usato ogni giorno', 'Leggere documentazione ufficiale, non solo tutorial'],
      },
      {
        title: 'Livello 2 — backend serio (mesi 3-6)',
        body: 'Postgres + SQL vero (join, indici, transazioni), API design (REST, validazione, errori), auth e RLS, Stripe base, email transazionali. Obiettivo: SaaS con pagamenti che funziona.',
        points: ['SaaS con checkout funzionante', 'RLS su ogni tabella utente', 'Webhook testati con retry'],
      },
      {
        title: 'Livello 3 — AI in produzione (mesi 6-9)',
        body: 'Chiamate LLM con streaming, prompt engineering pratico, gestione costi e limiti, RAG solo se serve, valutazione con set di esempi. Obiettivo: una feature AI che utenti reali usano e pagano.',
        points: ['Feature AI con streaming + limiti', 'Eval set da 50 esempi', 'Costo per richiesta misurato'],
      },
      {
        title: 'Livello 4 — operare (sempre)',
        body: 'CI/CD, Sentry, analytics, SEO base, copywriting, supporto utenti. La differenza tra progetto e business sta tutta qui.',
        points: ['Pipeline verde su ogni PR', 'Funnel misurato ogni settimana', 'Rispondere agli utenti entro 24h'],
      },
    ],
    checklist: ['1 app CRUD online', '1 SaaS con pagamenti', '1 feature AI usata da utenti veri', 'SQL + RLS padroneggiati', 'Pipeline + monitoring attivi'],
  },
  'piano-30-giorni': {
    slug: 'piano-30-giorni',
    intro: [
      'Trenta giorni dall\u2019idea al primo segnale di pagamento. Ogni settimana ha un output verificabile: se manchi l\u2019output, non passare alla successiva. Stampalo e spunta.',
    ],
    sections: [
      {
        title: 'Settimana 1 — problema e paganti',
        body: 'Giorni 1-2: frase del problema + mappa di 10 posti dove vive l\u2019utente. Giorni 3-5: 5 call da 20 minuti con la domanda di chiusura (“lo compri a X€?”). Giorni 6-7: decisione con soglia (3 “sì con carta” su 5) o si cambia idea.',
        points: ['Output: 5 call fatte + verdetto scritto', 'Se sotto soglia: pivota, non costruire'],
      },
      {
        title: 'Settimana 2 — offerta e landing',
        body: 'Giorni 8-9: offerta in una frase + 3 tier. Giorni 10-12: landing con headline, 3 benefici, prova, FAQ, form email. Giorni 13-14: mostra la landing alle 5 persone delle call + outreach a 20 nuovi contatti.',
        points: ['Output: landing online + 50 visite', 'Metrica: % email lasciate (target >10%)'],
      },
      {
        title: 'Settimana 3 — MVP imbarazzante',
        body: 'Solo le 2 funzioni che risolvono il problema. Niente: refusi perfetti, dark mode, 10 integrazioni. Deploy venerdì anche se fa schifo: deve funzionare per 5 beta tester veri, non essere bello.',
        points: ['Output: 5 beta tester dentro', 'Regola: se non vergogna, hai aspettato troppo'],
      },
      {
        title: 'Settimana 4 — prezzo e chiusura',
        body: 'Giorni 22-24: guarda usare il prodotto (call condivise), annota frizioni. Giorni 25-27: chiedi la carta con trial 14 giorni. Giorni 28-30: conta. Un pagante = piano validato. Zero = torna alla settimana 1 con dati veri, non è un fallimento.',
        points: ['Output: primo pagamento o verdetto documentato', 'Scorecard: call, visite, signup, attivazioni, pagamenti'],
      },
    ],
    checklist: ['Problema in una frase', '5 call + verdetto', 'Landing online + 50 visite', 'MVP con 5 beta tester', 'Carta richiesta a tutti i tester', 'Scorecard compilata'],
  },
  'kit-validazione-idee': {
    slug: 'kit-validazione-idee',
    intro: [
      'Quaderno operativo per validare prima di costruire. Usalo così: una copia per idea, 5 giorni di tempo, verdetto scritto alla fine. Se un\u2019idea non passa, archiviarla è una vittoria (ti ha risparmiato mesi).',
    ],
    sections: [
      {
        title: 'Scheda idea (10 minuti)',
        body: 'Compila: utente specifico, problema in una frase, costo attuale del problema (€ o ore), la tua soluzione in una riga, perché tu (vantaggio concreto: accesso, competenza, distribuzione). Se “perché tu” è vuoto, l\u2019idea è debole per TE anche se è buona in assoluto.',
        points: ['Utente + problema + costo scritti', 'Soluzione in 1 riga', 'Vantaggio personale dichiarato'],
      },
      {
        title: 'Script delle 5 call (20 minuti l\u2019una)',
        body: 'Apri sul loro mondo, non sulla tua idea: “come fai X oggi? quanto tempo ti porta via? cosa hai provato? cosa non ha funzionato?”. Presenta la soluzione solo negli ultimi 5 minuti. Chiudi sempre con la domanda di pagamento. Vietato: “ti piace?”, “lo useresti?”, pitch da 10 minuti.',
        points: ['15 min sul problema, 5 sulla soluzione', 'Domanda di pagamento sempre', 'Note con costi citati, parola per parola'],
      },
      {
        title: 'Griglia di valutazione',
        body: 'Per ogni call segna 1-5: intensità del dolore, budget disponibile, raggiungibilità di altri come lui, tua capacità di costruire. Totale <12: scarta. 12-15: approfondisci con altre 5 call. >15 con 3 segnali di pagamento: costruisci.',
        points: ['Punteggio per call, non a sensazione', 'Soglia decisa prima delle call', 'Verdetto scritto e datato'],
      },
    ],
    checklist: ['Scheda idea completa', '5 call con script', 'Costi annotati', 'Punteggi in griglia', 'Verdetto: costruisci / approfondisci / scarta'],
  },
  'kit-test-landing': {
    slug: 'kit-test-landing',
    intro: [
      'La landing è un test, non un monumento. Obiettivo: in 7 giorni e con 100 visite capire se l\u2019offerta tira. Se la conversione email è sotto il 5%, il problema è offerta o traffico sbagliato — mai i colori.',
    ],
    sections: [
      {
        title: 'Formula dell\u2019offerta',
        body: '“[Risultato misurabile] per [utente] in [tempo], senza [dolore] — a partire da [prezzo]”. Esempio: “Prima nota chiusa in 2 ore per commercialisti, senza straordinari — da 29€/mese”. Se togliendo il prezzo l\u2019offerta non cambia, il prezzo è finto: rimettilo al centro.',
        points: ['Risultato + utente + tempo + prezzo', 'Una metrica di prova (trial, demo, beta)', 'Zero gergo (“soluzione innovativa”)'],
      },
      {
        title: 'Traffico di test in 7 giorni',
        body: '50 visite da community dove il problema si discute + 50 da outreach diretto. Non comprare traffico per testare: ti serve gente col problema, non click. Traccia la fonte di ogni iscritto con un campo nascosto o link diversi.',
        points: ['100 visite mirate, non generiche', 'Fonte tracciata per iscritto', '7 giorni, poi verdetto'],
      },
      {
        title: 'Leggere i numeri',
        body: 'Sopra 15% email/visite: offerta forte, costruisci. 5-15%: cambia headline e riprova una settimana. Sotto 5%: offerta o pubblico sbagliati, torna alle call. E scrivi a OGNI iscritto entro 24h chiedendo “cosa ti ha convinto?”: le risposte valgono più della percentuale.',
        points: ['>15% costruisci, 5-15% itera, <5% ripensa', 'Email a ogni iscritto entro 24h', 'Verdetto scritto con numeri'],
      },
    ],
    checklist: ['Offerta in formula completa', 'Landing con 1 sola CTA', '100 visite mirate tracciate', 'Conversione calcolata', 'Iscritti contattati entro 24h', 'Verdetto scritto'],
  },
  'prima-app-weekend': {
    slug: 'prima-app-weekend',
    intro: [
      'Un weekend per un\u2019app vera online con utenti veri (anche 3). Il segreto è tagliare senza pietà: sabato si costruisce, domenica si fa usare. Lunedì si decide con i dati.',
    ],
    sections: [
      {
        title: 'Venerdì sera — taglia (1 ora)',
        body: 'Una funzione. Un tipo di utente. Un flusso felice, niente casi limite. Scrivi su carta cosa NON farai (autenticazione social, dark mode, admin, email bellissime). Se la lista del “no” è corta, non hai tagliato abbastanza.',
        points: ['1 funzione, 1 utente, 1 flusso', 'Lista del “no” più lunga del “sì”', 'Criterio di successo: 3 persone la usano domenica'],
      },
      {
        title: 'Sabato — costruisci (8 ore)',
        body: 'Mattina: setup + database + auth (provider esterno). Pomeriggio: flusso core brutto ma funzionante. Sera: deploy e link condividibile. Timer visibile: quando suona, quello che c\u2019è va online. Bug tollerati, flusso rotto no.',
        points: ['Stack che conosci già, zero esperimenti', 'Deploy entro le 20:00', 'Link funzionante da telefono'],
      },
      {
        title: 'Domenica — fai usare (4 ore)',
        body: 'Manda il link a 10 persone con UN task da fare (“iscriviti e crea X”). Guarda (call o video) almeno 3 usarla senza spiegare. Annota dove si bloccano: quella è la roadmap, non le tue idee.',
        points: ['10 inviti con task preciso', '3 osservazioni senza aiutare', 'Lista blocchi = roadmap'],
      },
      {
        title: 'Lunedì — decidi (30 minuti)',
        body: 'Hanno completato il task? Tornerebbero? Pagherebbero? 2 sì su 3: continua. Altrimenti: cosa hai imparato in 1 riga, e pivota o archivia. Un weekend buttato non esiste se il verdetto è scritto.',
        points: ['3 domande, verdetto scritto', 'Prossimo passo in 1 riga', 'Codice su GitHub comunque vada'],
      },
    ],
    checklist: ['Scope da 1 funzione', 'Deploy sabato sera', '10 inviti domenica', '3 osservazioni', 'Verdetto lunedì'],
  },
  'playbook-distribuzione': {
    slug: 'playbook-distribuzione',
    intro: [
      'I primi 100 utenti senza budget: si prendono uno a uno, nei posti dove il problema si discute già. Questo playbook copre 90 giorni: 30 di semina, 30 di lancio, 30 di contenuti.',
    ],
    sections: [
      {
        title: 'Giorni 1-30 — semina',
        body: '10 minuti al giorno in 3 community: rispondi a domande sul problema (senza linkarti), prendi appunti sul linguaggio usato. Costruisci lista d\u2019attesa con landing + form. Obiettivo: 100 email prima di avere il prodotto finito.',
        points: ['3 community, valore prima del link', 'Linguaggio dei clienti annotato', '100 email in lista'],
      },
      {
        title: 'Giorni 31-60 — lancio e outreach',
        body: 'Lancio in 1 directory + post nelle community (dove permesso) + 10 outreach al giorno a persone specifiche. Rispondi a tutto entro 1 ora il giorno X. Obiettivo: 100 utenti o 10 paganti, quel che viene prima.',
        points: ['1 lancio preparato, non 5 improvvisati', '10 outreach/giorno tracciati', 'Risposta <1h il giorno X'],
      },
      {
        title: 'Giorni 61-90 — contenuti che restano',
        body: '2 articoli pilastro sul problema + 1 caso studio con numeri di un utente vero + template/checklist scaricabile in cambio email. I post muoiono, le pagine che rankano lavorano per anni.',
        points: ['2 guide >2000 parole', '1 caso studio con numeri', '1 lead magnet con form'],
      },
      {
        title: 'Script di outreach che funziona',
        body: '4 righe: chi sei in 5 parole, cosa hai notato DEL LORO lavoro (specifico), cosa offri gratis (risolvere un micro-problema o accesso beta), domanda facile da rispondere. Niente allegati, niente “vorrei fissare una call da 30 minuti” al primo messaggio.',
        points: ['<100 parole', '1 dettaglio specifico su di loro', '1 domanda facile in chiusura'],
      },
    ],
    checklist: ['3 community mappate', '100 email in lista', 'Data lancio + 30 avvisati', '10 outreach/giorno', '2 articoli pilastro', 'Funnel settimanale attivo'],
  },
  'foglio-pricing': {
    slug: 'foglio-pricing',
    intro: [
      'Il foglio che ti dice se il tuo prezzo regge. Quattro conti, 20 minuti: costo per utente, margine per tier, punto di pareggio, scenario pesante (power user). Se un numero non torna qui, non tornerà in produzione.',
    ],
    sections: [
      {
        title: 'Costo per utente',
        body: 'Somma i variabili mensili divisi per utenti: hosting/DB, email inviate, storage, e soprattutto API AI per utente medio E per utente pesante (prendi il tuo stesso uso intenso ×2). Se non hai dati, stima alto: sbagliare per eccesso qui ti salva.',
        points: ['Medio e pesante separati', 'AI: il pesante decide il prezzo', 'Stima alta se senza dati'],
      },
      {
        title: 'Margine per tier',
        body: 'Per ogni tier: (prezzo − costo pesante) / prezzo. Sotto 70%: alza il prezzo, taglia i costi (cache, modelli economici, limiti), o riduci cosa include il tier. Il Free ha budget mensile totale (es. max 5% dei costi): superato, si stringe.',
        points: ['Margine pesante >70% per tier', 'Budget totale per il Free', 'Regola di revisione trimestrale'],
      },
      {
        title: 'Punto di pareggio',
        body: 'Costi fissi mensili / margine medio per cliente = clienti per sopravvivere. Se il numero è 500 e hai 3 clienti dopo 6 mesi, il problema è distribuzione o prezzo, e lo sai con mesi di anticipo invece di scoprirlo a cassa vuota.',
        points: ['Break-even in clienti, scritto', 'Confronto mensile reale vs target', 'Piano B se a metà strada'],
      },
      {
        title: 'Leve quando non torna',
        body: 'In ordine di dolore crescente: limiti d\u2019uso più stretti, cache e modelli economici, prezzo +20% per nuovi clienti, funzioni costose spostate nel tier sopra, annuale spinto per cassa. Mai: sperare che “a scala costerà meno” senza un piano scritto di come.',
        points: ['Prima tecnica (cache/limiti), poi prezzo', 'Aumenti sui nuovi, poi esistenti con preavviso', 'Annuale per cassa subito'],
      },
    ],
    checklist: ['Costo medio e pesante calcolati', 'Margine >70% per tier', 'Budget Free definito', 'Break-even in clienti', 'Revisione trimestrale a calendario'],
  },
};

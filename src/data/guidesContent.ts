// Contenuti estesi delle guide: dettagliati, diretti, operativi per giovani founder.
// Stile: niente motivazione vuota. Solo cosa fare, come, con quali numeri, e cosa evitare.

export interface GuideStep {
  title: string;
  detail: string;
  action: string;
}

export interface GuideContent {
  slug: string;
  title: string;
  desc: string;
  intro: string[];
  steps: GuideStep[];
  mistakes: string[];
  checklist: string[];
}

export const GUIDES_CONTENT: Record<string, GuideContent> = {
  'validare-idea': {
    slug: 'validare-idea',
    title: "Validare un'idea",
    desc: 'Non serve l\u2019idea del secolo. Serve un problema reale che puoi risolvere.',
    intro: [
      'La validazione risponde a una domanda sola: esiste qualcuno con un problema abbastanza doloroso da pagare per eliminarlo? Tutto il resto — logo, stack, nome — viene dopo.',
      'Regola base: zero righe di codice finché non hai 5 conversazioni con potenziali utenti e almeno un segnale di pagamento (pre-ordine, lettera d\u2019intenti, carta per una trial).',
    ],
    steps: [
      {
        title: 'Scrivi il problema in una frase misurabile',
        detail: '“Aiuto [utente specifico] a [risultato] in [tempo], contro [alternativa attuale]”. Se non sai riempire le parentesi, il problema è troppo vago. Esempio buono: “Aiuto commercialisti con <10 dipendenti a chiudere la prima nota in 2 ore invece di 2 giorni”.',
        action: 'Scrivi 3 versioni della frase. Tieni quella che un utente ripeterebbe a un collega.',
      },
      {
        title: 'Trova 5 persone con quel problema in 48 ore',
        detail: 'Dove cercarle: community di settore, Reddit, gruppi Telegram/Discord, LinkedIn con messaggio diretto corto. Non chiedere “ti piace la mia idea?” — chiedi “come fai X oggi? quanto ti costa in tempo/soldi?”. La gente mente per gentilezza sulle idee, non sui propri costi.',
        action: 'Fissa 5 call da 20 minuti. Registra (chiedendo permesso) e trascrivi i costi citati.',
      },
      {
        title: 'Cerca il segnale di pagamento, non i complimenti',
        detail: 'Scala di evidenza, dal debole al forte: “bella idea” (zero) → “lo proverei” (debole) → “ti pago 20€ al mese se esiste” (medio) → carta per trial o pre-ordine (forte). Solo l\u2019ultimo conta. Se nessuno tira fuori il portafoglio, il dolore non è abbastanza.',
        action: 'Chiudi ogni call con: “se esistesse domani a X€/mese, lo compri? posso prenderti la carta per la trial?”.',
      },
      {
        title: 'Stima mercato con i conti della serva',
        detail: 'TAM/SAM/SOM su slide non servono. Calcola: [n. clienti raggiungibili] × [prezzo/mese] × 12. Se con 100 clienti a 30€/mese fai 36k€/anno, chiediti se ti basta come solo founder. Sì nella maggior parte dei casi: non devi conquistare il mondo.',
        action: 'Fai il conto su un foglio. Se il “caso realistico” non ti entusiasma, cambia idea ora: costa zero.',
      },
      {
        title: 'Riduci a un problema shippabile in 2-4 settimane',
        detail: 'Taglia tutto tranne il singolo job-to-be-done che elimina il dolore. Le funzioni “carine” si aggiungono dopo, sui feedback di chi paga. Un MVP è un prodotto imbarazzante che risolve un problema vero, non una demo bella che non serve.',
        action: 'Elenca 10 funzioni. Tienine 2. Le altre 8 vanno in una lista “dopo i primi 10 paganti”.',
      },
      {
        title: 'Decidi con una soglia, non con la pancia',
        detail: 'Prima di partire fissa la regola: “procedo solo se 3 persone su 5 danno segnale di pagamento”. Senza soglia, razionalizzerai qualsiasi risultato. La validazione serve a uccidere idee deboli in fretta, non a confermare quella che ti piace.',
        action: 'Scrivi la soglia su carta prima della prima call. Rispettala.',
      },
    ],
    mistakes: [
      'Chiedere pareri ad amici e parenti (dicono sempre che è bella).',
      'Costruire 3 mesi prima di parlare con un utente.',
      'Confondere “lo userei gratis” con “lo pagherei”.',
      'Validare la soluzione invece del problema (“ti piace questo bottone?”).',
      'Allargare il target (“serve a tutti”) invece di restringerlo.',
    ],
    checklist: [
      'Problema scritto in una frase misurabile',
      '5 conversazioni fatte in 48 ore',
      'Costi attuali degli utenti annotati (€ o ore)',
      'Almeno 3 segnali di pagamento su 5',
      'Conto realistico: clienti × prezzo × 12',
      'MVP ridotto a 2 funzioni, shippabile in 2-4 settimane',
    ],
  },
  'scegliere-stack': {
    slug: 'scegliere-stack',
    title: 'Scegliere lo stack',
    desc: 'Non serve un\u2019architettura enterprise. Scegli strumenti che ti permettano di shipvare veloce.',
    intro: [
      'Lo stack giusto per un solo founder è quello che conosci già + quello che ti fa deployare oggi. Ogni tecnologia nuova è una tassa pagata in settimane. La regola: noioso e collaudato batte moderno ed eccitante.',
      'Stack di default consigliato: Next.js (frontend + API), Supabase (database + auth + storage), Vercel (deploy), Stripe (pagamenti), Resend (email). Con questi shippi il 90% dei SaaS senza inventare nulla.',
    ],
    steps: [
      {
        title: 'Frontend + backend nello stesso progetto',
        detail: 'Next.js App Router con API routes: un repo, un deploy, niente CORS da configurare, niente sincronizzazione tra due codebase. Il backend separato (FastAPI, Express standalone) serve solo quando hai workload specifici: job pesanti, websocket, ML custom.',
        action: 'Inizia monolite Next.js. Estrai servizi solo quando un limite reale ti ci costringe.',
      },
      {
        title: 'Database: Postgres gestito, punto',
        detail: 'Supabase ti dà Postgres + auth + storage + realtime in 10 minuti. Alternative valide: Neon o PlanetScale. Evita Mongo “perché è facile”: quando servono relazioni e transazioni (sempre, nei SaaS a pagamento) paghi il conto. Backup automatici inclusi, non pensarci più.',
        action: 'Crea progetto Supabase, abilita backup giornalieri, usa migration SQL versionate fin dal giorno 1.',
      },
      {
        title: 'Auth: non scriverla mai da solo',
        detail: 'Password hashate, reset, sessioni, OAuth, rate limiting: ogni pezzo è una vulnerabilità potenziale. Supabase Auth o Clerk coprono tutto. Costo: un pomeriggio di integrazione contro settimane di bug di sicurezza.',
        action: 'Integra il provider, testa signup/login/logout/recupero password, abilita RLS sulle tabelle utente.',
      },
      {
        title: 'AI: un provider, un modello, con fallback di budget',
        detail: 'Scegli un gateway (diretto o via aggregatore) e UN modello di default. Metti subito: limite di spesa giornaliero, max_tokens basso (1024 basta per quasi tutto), timeout e messaggio d\u2019errore onesto. I costi API esplodono in silenzio: logga token per richiesta fin dal primo giorno.',
        action: 'Imposta alert di spesa e un kill-switch (feature flag) che disattiva le funzioni AI senza deploy.',
      },
      {
        title: 'Pagamenti: Stripe Checkout + webhook, niente altro',
        detail: 'Non costruire billing custom: Checkout gestisce carte, 3D Secure, fatture e SCA europea. Tu gestisci solo il webhook checkout.session.completed per sbloccare l\u2019accesso, con dedup sull\u2019ID sessione (Stripe ritenta i webhook). Prezzi e piani letti dal TUO database, mai dal client.',
        action: 'Testa in modalità test l\u2019intero giro: paga → webhook → accesso sbloccato → rimborso.',
      },
      {
        title: 'Deploy e domini: la strada più corta',
        detail: 'Frontend su Vercel (connesso a GitHub: push = deploy), dominio con DNS su Vercel o Cloudflare, HTTPS automatico. Monitoring minimo: Sentry per gli errori + uptime check gratuito. Niente Kubernetes, niente VPS da amministrare: il tuo tempo va sul prodotto.',
        action: 'Deploy di una pagina “coming soon” oggi stesso: così dominio, DNS e pipeline sono già risolti.',
      },
    ],
    mistakes: [
      'Scegliere tecnologie per il CV invece che per shippare (“imparo Rust facendo il SaaS”).',
      'Microservizi con un founder solo.',
      'Database diverso per ogni micro-esigenza dal giorno 1.',
      'Auth fatta in casa “tanto è semplice”.',
      'Nessun limite di spesa sulle API AI.',
    ],
    checklist: [
      'Monolite Next.js con API routes',
      'Postgres gestito + backup + migration versionate',
      'Auth esterna con RLS attiva',
      'Provider AI unico, limiti di spesa e kill-switch',
      'Stripe Checkout + webhook con dedup',
      'Deploy automatico da Git + dominio + HTTPS',
      'Sentry (o equivalente) attivo in produzione',
    ],
  },
  'pricing-gtm': {
    slug: 'pricing-gtm',
    title: 'Pricing & go-to-market',
    desc: 'Non regalare il tuo prodotto. Il prezzo giusto è quello che il mercato sostiene.',
    intro: [
      'Il pricing non è matematica, è posizionamento. Prezzi troppo bassi attirano utenti che non pagheranno mai abbastanza per sostenerti; il prezzo giusto filtra e finanzia lo sviluppo. Parti alto: abbassare è facile, alzare su clienti esistenti è doloroso.',
      'Formula di partenza per SaaS solo founder: tier Pro tra 19€ e 49€/mese, trial 14 giorni senza carta, annuale −20%. Poi aggiusti sui dati, non sulle sensazioni.',
    ],
    steps: [
      {
        title: 'Prezzo ancorato al valore, non ai costi',
        detail: 'Chiediti: “quanto vale il problema che elimino, al mese, per questo cliente?”. Se fai risparmiare 10 ore/mese a un freelance da 50€/ora, 29€/mese è un affare e lo sanno anche loro. Il costo delle tue API è un problema di margini, non il criterio del prezzo. Regola: il cliente deve percepire almeno 10× di ritorno.',
        action: 'Nelle call di validazione chiedi “quanto pagheresti per non avere più questo problema?” e annota il range.',
      },
      {
        title: 'Tre tier, uno è l\u2019esca',
        detail: 'Struttura classica che funziona: Free limitato (acquisizione), Pro (il 70-80% del revenue, reso ovvio), Enterprise/Business (ancora di prezzo alto che fa sembrare il Pro conveniente). Il Free deve far provare il valore core, non regalare tutto: limite su uso, non su tempo.',
        action: 'Disegna i 3 tier su carta: per ognuno, UNA frase sul “per chi è” e il limite che spinge all\u2019upgrade.',
      },
      {
        title: 'Trial senza carta, 14 giorni',
        detail: 'La carta in trial alza la barriera e attira contestazioni; senza carta converti di più all\u2019inizio, quando ti servono utenti e feedback. Aggiungi email automatiche ai giorni 3, 7, 12 che mostrano UNA cosa da fare nel prodotto. Misura: attivazione (ha completato il setup?) più che iscrizioni.',
        action: 'Scrivi le 3 email di trial prima di aprire le iscrizioni. Senza, la trial è tempo buttato.',
      },
      {
        title: 'Annuale con sconto per cassa prevedibile',
        detail: '−20% sull\u2019annuale: incassi subito 9-10 mesi di revenue e riduci il churn. Offrilo dopo che l\u2019utente ha provato valore (giorno 10-12 della trial), non al primo click. Per i primi clienti, l\u2019annuale con call di onboarding è anche il tuo miglior strumento anti-abbandono.',
        action: 'Aggiungi il toggle mensile/annuale nel checkout e l\u2019email “passa all\u2019annuale” al giorno 11.',
      },
      {
        title: 'Aumenta sui dati, con grandfathering',
        detail: 'Quando il churn è basso (<5%/mese) e la gente dice “costa poco”, è ora di alzare. Aumenta per i nuovi clienti prima, poi per gli esistenti con 60 giorni di preavviso tenendo i vecchi prezzi per 6-12 mesi (grandfathering). Chi urla per +5€/mese non era il tuo cliente ideale.',
        action: 'Ogni trimestre: rivedi churn, ticket “troppo caro” vs “costa poco”, e decidi un aggiustamento.',
      },
      {
        title: 'Margini AI sotto controllo',
        detail: 'Se il prodotto consuma API AI, il pricing deve reggere il caso peggiore (utente power). Calcola: costo per utente pesante × 3 = prezzo minimo del tier. Poi metti guardrail: limiti d\u2019uso per tier, cache delle risposte ripetute, modelli economici per task semplici. Un cliente non deve mai costarti più di quanto paga.',
        action: 'Foglio: per ogni tier, costo mensile stimato utente medio e utente pesante. Margine minimo 70%.',
      },
    ],
    mistakes: [
      'Prezzo “da amico” per i primi utenti e poi impossibilità ad alzarlo.',
      'Free troppo generoso che cannibalizza il Pro.',
      'Troppi tier (paralisi da scelta) invece di 3.',
      'Sconti a vita per chiunque chieda.',
      'Ignorare i costi variabili (API AI) nel prezzo.',
    ],
    checklist: [
      'Prezzo ancorato al valore (regola 10×)',
      '3 tier con Pro ovvio',
      'Trial 14 giorni senza carta + 3 email',
      'Annuale −20% offerto al giorno 11',
      'Margini: utente pesante coperto 3×',
      'Processo trimestrale di revisione prezzi',
    ],
  },
  'go-to-market': {
    slug: 'go-to-market',
    title: 'Go-to-market per solitari',
    desc: 'Non hai un team di marketing. Usa strategie che funzionano per founder solitari.',
    intro: [
      'Da solo non puoi fare tutto: scegli UN canale, lavoralo 30 giorni, misura, poi decidi se raddoppiare o cambiare. Il canale giusto è dove i tuoi utenti già parlano del problema, non dove “si fa marketing”.',
      'Ordine consigliato per i primi 100 utenti: community di nicchia (gratis) → build in public (gratis) → un lancio concentrato (Product Hunt / directory) → contenuti che rankano (lento ma cumulativo). Ads solo quando il funnel converte già.',
    ],
    steps: [
      {
        title: 'Mappa dove vive il tuo utente',
        detail: 'Elenca 10 posti (subreddit, gruppi, newsletter, YouTuber, podcast) dove il tuo utente parla già del problema. Per ognuno annota: dimensione, regole promozionali, 3 post recenti popolari. I posti con regole anti-spam rigide si conquistano dando valore per 2 settimane prima di menzionare il prodotto.',
        action: 'Tabella con 10 righe. Inizia dai 3 con più discussioni sul problema e regole tolleranti.',
      },
      {
        title: 'Build in public con numeri veri',
        detail: 'Posta 3-4 volte a settimana: cosa hai shippato, un numero (utenti, revenue, conversione), un errore e cosa hai imparato. I post “ho lanciato!” muoiono in un giorno; i post con numeri e lezioni girano per mesi. Formato che funziona: prima/dopo + screenshot.',
        action: 'Prepara 10 post dai tuoi ultimi 30 giorni di lavoro. Programma i primi 4.',
      },
      {
        title: 'Un lancio preparato, non improvvisato',
        detail: 'Product Hunt / BetaList / directory di nicchia funzionano se arrivi con: video demo <90 secondi, primi 20 utenti già attivi che commentano il giorno X, risposta a OGNI commento entro 1 ora. Il giorno del lancio non si lavora al prodotto: si sta nei commenti.',
        action: 'Scegli la data tra 3 settimane. Checklist: video, lista di 30 persone da avvisare, risposte pronte alle 10 obiezioni tipiche.',
      },
      {
        title: 'Contenuti che risolvono, non che vendono',
        detail: 'Scrivi la guida definitiva al problema (non al prodotto): “Come fare X in 2026”. In fondo, una riga: “l\u2019ho automatizzato con [prodotto]”. Un articolo che ranka vale 2 anni di post social. Punta su query con intento (“come”, “migliore”, “alternativa a”) e lunghezza >2000 parole con esempi veri.',
        action: 'Un articolo pilastro questo mese. Promuovilo nelle 10 community mappate (dove permesso).',
      },
      {
        title: 'Outreach diretto ai primi 50',
        detail: 'Messaggi personalizzati a 10 persone al giorno: riferimento specifico al loro lavoro + offerta di risolvere UN loro problema gratis in cambio di feedback. Tasso di risposta sano: >30%. Sotto il 10%, il messaggio è sbagliato (troppo lungo, troppo “io”, nessuna specificità).',
        action: 'Template da 4 righe max. Traccia risposte in un foglio e itera il testo ogni 20 invii.',
      },
      {
        title: 'Misura un funnel, non i like',
        detail: 'Le uniche metriche che contano all\u2019inizio: visite → signup (%) → attivazione, cioè ha completato il setup (%) → pagamento (%). Se l\u2019attivazione è sotto il 20%, il problema è il prodotto/onboarding, non il traffico. Non comprare traffico per riempire un secchio bucato.',
        action: 'Dashboard con questi 4 numeri, aggiornata ogni lunedì. Una sola azione a settimana sul punto più debole.',
      },
    ],
    mistakes: [
      'Essere ovunque (5 social) invece che in un canale solo.',
      'Lanciare senza audience né lista d\u2019attesa.',
      'Parlare del prodotto invece che del problema.',
      'Comprare ads prima che il funnel converta organicamente.',
      'Sparire dopo il lancio invece di rispondere a tutti.',
    ],
    checklist: [
      'Mappa di 10 community/canali con regole',
      'Calendario build-in-public (3-4 post/sett)',
      'Data lancio + lista 30 sostenitori + video 90s',
      '1 articolo pilastro >2000 parole',
      'Outreach 10/giorno con tracking risposte',
      'Funnel a 4 numeri rivisto ogni lunedì',
    ],
  },
  'ai-first-strategy': {
    slug: 'ai-first-strategy',
    title: 'AI-first product strategy',
    desc: 'Il prodotto non è un\u2019app con l\u2019AI aggiunta. L\u2019AI è il prodotto.',
    intro: [
      'AI-first significa: il valore core è generato dal modello, non da CRUD con un chatbot incollato. Se togli l\u2019AI e il prodotto funziona uguale, non è AI-first: è un costo in più senza motivo.',
      'Le tre decisioni che contano: quale task automatizzi (deve valere soldi), come gestisci gli errori del modello (sbaglierà sempre una %), come paghi i costi (margini per tier).',
    ],
    steps: [
      {
        title: 'Scegli task con valore economico chiaro',
        detail: 'Buoni candidati: task ripetitivi, costosi in ore umane, con output verificabile (riassunti, classificazioni, bozze, estrazioni dati). Cattivi candidati: decisioni ad alto rischio senza human-in-the-loop, task dove l\u2019utente non può verificare l\u2019output. Se l\u2019errore costa più del risparmio, serve revisione umana nel flusso.',
        action: 'Per il tuo task: scrivi chi lo fa oggi, quanto costa, come si accorge di un errore. Se non c\u2019è risposta, cambia task.',
      },
      {
        title: 'Un modello di default + regole di routing',
        detail: 'Non servono 5 modelli dal giorno 1. Default: un modello capace per tutto; routing verso modelli economici per task semplici e ripetitivi (classificazione, estrazione) quando i volumi crescono. Valuta con un set di 50-100 esempi reali: accuratezza, latenza p95, costo per 1000 richieste. Rivota ogni trimestre, non ogni settimana.',
        action: 'Crea il set di valutazione dai primi utenti reali. Senza, ogni cambio modello è un salto nel buio.',
      },
      {
        title: 'UX disegnata attorno all\u2019incertezza',
        detail: 'Mostra sempre: cosa ha capito l\u2019AI (input interpretato), confidenza o fonti quando possibile, e un modo facile per correggere. Pattern che funzionano: bozza modificabile invece di azione diretta, “applica” esplicito per azioni distruttive, cronologia per tornare indietro. L\u2019utente deve sentirsi il pilota, non il passeggero.',
        action: 'Per ogni feature AI: definisci cosa succede quando sbaglia. Se la risposta è “niente”, ridisegnala.',
      },
      {
        title: 'Feedback loop che migliora il prodotto',
        detail: 'Ogni interazione è dati: 👍/👎, correzioni dell\u2019utente, rigenerazioni. Usali in quest\u2019ordine: 1) fix immediati ai prompt/sistema, 2) esempi few-shot dai casi buoni, 3) RAG su knowledge base quando serve contesto, 4) fine-tuning solo con volumi e metriche che lo giustificano. Il 90% dei miglioramenti è prompt + contesto, non training.',
        action: 'Logga input anonimi, output e feedback. Rivedi i 20 peggiori ogni settimana e fixa il pattern.',
      },
      {
        title: 'Qualità misurata, non “sembra buono”',
        detail: 'Quattro numeri: accuratezza sul tuo eval set, latenza p95 (sotto 5s per interazioni, o streaming), tasso di errore lamentato dagli utenti, costo per richiesta per tier. Se il costo per richiesta supera il 30% del prezzo del tier, hai un problema di business, non di tecnica.',
        action: 'Dashboard con questi 4 numeri. Allarme automatico se costo/richiesta supera la soglia del tier.',
      },
      {
        title: 'RAG solo quando serve, e fatto bene',
        detail: 'RAG serve quando la risposta dipende dai DATI dell\u2019utente o da conoscenza che cambia. Altrimenti è complessità inutile. Se serve: chunk da 300-500 token con overlap, metadata (fonte, data), reranking sui top-k, e citazione delle fonti nella risposta. Valuta con domande reali, non con “sembra che funzioni”.',
        action: 'Test di necessità: il modello senza documenti sbaglia le risposte? No → niente RAG. Sì → costruiscilo con eval.',
      },
    ],
    mistakes: [
      'Chatbot generico senza task specifico (“parla coi tuoi dati” e basta).',
      'Azioni distruttive senza conferma umana.',
      'Nessun set di valutazione: cambi modello alla cieca.',
      'RAG su dati statici che basterebbero nel prompt.',
      'Costi per richiesta ignorati fino alla fattura.',
    ],
    checklist: [
      'Task con valore economico e verifica possibile',
      'Modello default + eval set da 50-100 esempi',
      'UX con correzione facile e azioni distruttive confermate',
      'Log input/output/feedback + review settimanale',
      '4 metriche qualità in dashboard',
      'Costo/richiesta < 30% del prezzo tier',
    ],
  },
  'tooling-automation': {
    slug: 'tooling-automation',
    title: 'Tooling & automazione',
    desc: 'Se lo fai più di due volte, automatizzalo.',
    intro: [
      'Da solo, ogni ora spesa in operazioni manuali è un\u2019ora rubata al prodotto. Ma attenzione all\u2019altro estremo: automatizzare troppo presto processi che cambiano ogni settimana. Regola: automatizza ciò che è stabile e ripetitivo, checklist per il resto.',
      'Stack minimo operativo: CI/CD su push, errori in Sentry, uptime monitor, backup automatici, email transazionali, deploy preview per ogni PR. Si monta in un pomeriggio e ti salva settimane.',
    ],
    steps: [
      {
        title: 'CI/CD: push su main = produzione',
        detail: 'GitHub Actions: lint + typecheck + test su ogni PR, deploy automatico su Vercel al merge. Branch protetto su main (niente push diretti). Deploy preview per ogni PR per testare senza toccare la produzione. Se il deploy richiede più di un comando, la pipeline è rotta.',
        action: 'Oggi: proteggi main, attiva i check obbligatori sulle PR, verifica che il deploy sia verde.',
      },
      {
        title: 'Errori e uptime sotto controllo',
        detail: 'Sentry (errori con stack trace e contesto utente), uptime monitor esterno che pinga ogni minuto (Better Stack, UptimeRobot free), log strutturati consultabili. Alert solo per ciò che richiede azione immediata: errore 500 in spike, sito down, webhook Stripe in errore. Tutto il resto va in review settimanale, non in notifica.',
        action: 'Simula un errore 500 in staging e verifica che l\u2019alert arrivi dove lo leggi davvero.',
      },
      {
        title: 'Email transazionali dal giorno 1',
        detail: 'OTP, ricevute, reset password, notifiche: Resend o Loops con template versionati nel repo. Mittente con dominio verificato (SPF/DKIM) o finisci in spam. Mai template scritti a mano nel codice: un file per template, con versione testuale e HTML.',
        action: 'Manda una email di test a Gmail/Outlook e controlla che non finisca in spam prima del lancio.',
      },
      {
        title: 'Billing blindato con i webhook',
        detail: 'Stripe: firma verificata su ogni webhook, dedup per ID evento (Stripe ritenta), coda di retry per i tuoi errori interni, log di ogni evento ricevuto. Testa i casi brutti: pagamento riuscito ma server tuo down, doppio invio, rimborso. Sono questi a generare gli utenti arrabbiati, non il bottone “paga”.',
        action: 'Stripe CLI in locale: triggera checkout.session.completed e refund e verifica gli stati nel DB.',
      },
      {
        title: 'Backup che hai già testato',
        detail: 'Backup automatico giornaliero del database + verifica mensile del restore (un backup mai ripristinato non esiste). Più export settimanale dei dati critici in uno storage separato. Documenta la procedura di restore in 10 righe: sotto stress non ragionerai lucidamente.',
        action: 'Questo mese: ripristina un backup su un progetto di test e cronometra quanto ci metti.',
      },
      {
        title: 'Job schedulati senza server da mantenere',
        detail: 'Promemoria, pulizie, report: Vercel Cron, Trigger.dev o GitHub Actions schedulate. Idempotenti (rieseguibili senza danni) e con log consultabile. Mai setTimeout in memoria o cron sul tuo laptop: muoiono con il processo.',
        action: 'Elenca i task ricorrenti e spostali su uno scheduler gestito, uno alla volta.',
      },
    ],
    mistakes: [
      'Push diretti su main senza check.',
      'Alert per tutto → alert ignorati per tutto.',
      'Email dal dominio non verificato (spam).',
      'Webhook senza verifica firma né dedup.',
      'Backup mai testati.',
    ],
    checklist: [
      'Main protetto, check su PR, deploy automatico',
      'Sentry + uptime monitor + alert testati',
      'Email transazionali con dominio verificato',
      'Webhook con firma, dedup e retry',
      'Backup giornalieri + restore testato',
      'Job su scheduler gestito, idempotenti',
    ],
  },
  'debugging-mentale': {
    slug: 'debugging-mentale',
    title: 'Debugging mentale',
    desc: 'Il founder solitario non combatte solo bug. Combatte anche la propria testa.',
    intro: [
      'Lavorare soli significa: nessun feedback quotidiano, decisioni prese nel vuoto, e la motivazione che oscilla con gli ultimi numeri. Non è un difetto caratteriale, è la condizione di default. Si gestisce con sistemi, non con forza di volontà.',
      'I tre sistemi che contano: ritmo visibile (streak, standup), confronto esterno regolare (accountability), e definizione di “abbastanza” per non rincorrere la perfezione.',
    ],
    steps: [
      {
        title: 'Rendi il progresso visibile ogni giorno',
        detail: 'Standup scritto di 3 righe (fatto, da fare, blocchi) + streak dei giorni shippati. Il cervello da solo non registra i progressi: devi vederli. La regola è umile: un commit, un task chiuso, un messaggio a un utente — qualcosa di concreto ogni giorno, anche piccolo.',
        action: 'Stasera: scrivi lo standup di oggi e il singolo task di domani mattina. Solo uno.',
      },
      {
        title: 'Spezza finché non è ovvio',
        detail: '“Lancio il prodotto” paralizza; “scrivo la headline della landing” si fa. Se un task richiede più di 2 ore o non sai da dove iniziare, è troppo grosso: dividilo finché il primo passo è imbarazzantemente piccolo. La procrastinazione è quasi sempre un problema di definizione, non di pigrizia.',
        action: 'Prendi il task che eviti da 3 giorni e dividilo in pezzi da 30 minuti. Fai solo il primo.',
      },
      {
        title: 'Time-boxing contro il perfezionismo',
        detail: 'Il perfezionismo da soli non ha arbitro: imposta timer 50/10 o Pomodoro 25/5 e shippabile-alla-scadenza. “Done is better than perfect” è misurabile: se hai speso più del 20% del tempo su rifiniture che nessun utente ha chiesto, stai procrastinando con stile.',
        action: 'Per il prossimo task scrivi prima il tempo massimo. Quando suona, shippa o taglia.',
      },
      {
        title: 'Accountability esterna settimanale',
        detail: 'Un founder, un amico, una community: ogni settimana, 15 minuti in cui dichiari cosa hai fatto e cosa farai. La vergogna sociale blanda è il miglior antiprocrastinazione esistente. Le community di founder (come questa Room) esistono anche per questo: streak e leaderboard sono accountability automatizzata.',
        action: 'Trova UNA persona e fissa la prima call di 15 minuti questa settimana. Ricorrente.',
      },
      {
        title: 'Separa identità e metriche',
        detail: 'Settimana piatta ≠ tu sei un fallito. Leggi i numeri come un meccanico, non come un giudice: “l\u2019attivazione è al 12%, ipotesi: onboarding confuso, test: semplifico step 2”. Chi personalizza i numeri smette di guardarli, e senza numeri si naviga alla cieca.',
        action: 'Prossimo numero brutto: scrivi 3 ipotesi tecniche e 1 test per ciascuna, prima di qualsiasi giudizio.',
      },
      {
        title: 'Ricarica programmata, non burnout e stop',
        detail: 'Da soli non c\u2019è nessuno che ti manda a casa: un giorno a settimana senza codice né metriche, sonno regolare, movimento. Il burnout del solo founder non si vede arrivare perché non ci sono colleghi che lo notano. Se per 2 settimane la voglia è zero, il problema è il sistema (riposo, scopo, confronto), non tu.',
        action: 'Blocca nel calendario il giorno off settimanale come fosse una call con un cliente.',
      },
    ],
    mistakes: [
      'Aspettare la motivazione invece di costruire il ritmo.',
      'Task vaghi da “8 ore” che non iniziano mai.',
      'Perfezionare in privato invece di shippare e misurare.',
      'Isolamento totale per mesi.',
      'Leggere i numeri come giudizi su di sé.',
    ],
    checklist: [
      'Standup quotidiano di 3 righe',
      'Streak visibile dei giorni shippati',
      'Nessun task sopra le 2 ore senza suddivisione',
      'Accountability settimanale fissata',
      'Giorno off settimanale a calendario',
      'Prossimo numero brutto → 3 ipotesi + test',
    ],
  },
};

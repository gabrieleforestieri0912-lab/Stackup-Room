import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Termini e Condizioni',
 description: 'Termini e Condizioni di Stackup Room',
};

export default function TermsPage() {
 return (
  <div className="min-h-screen bg-black pt-20 md:pt-24 pb-16">
   <div className="max-w-3xl mx-auto px-6">
    <h1 className="text-4xl font-jakarta font-black text-zinc-100 mb-8">Termini e Condizioni</h1>
    <p className="text-sm text-zinc-400 mb-8">Ultimo aggiornamento: 5 settembre 2026</p>
    <div className="prose prose-slate max-w-none space-y-6 text-zinc-400">
     <p>Benvenuto su Stackup Room. Utilizzando la piattaforma accetti i seguenti termini.</p>
     <h2 className="text-lg font-bold text-zinc-100">Titolare del servizio</h2>
     <p>Stackup Room — progetto di Gabriele Forestieri, Milano, Italia. Contatto: <span className="text-orange-400">gabriele.forestieri0912@gmail.com</span>.</p>
     <h2 className="text-lg font-bold text-zinc-100">Account</h2>
     <p>Sei responsabile della sicurezza delle credenziali. L&apos;account è personale e non cedibile.</p>
     <h2 className="text-lg font-bold text-zinc-100">Acquisti e accesso ai contenuti</h2>
     <p>I corsi acquistati restano accessibili finché l&apos;account è attivo e il servizio è erogato. I contenuti sono concessi in licenza d&apos;uso personale, non trasferibile. Il diritto di recesso per contenuti digitali è disciplinato dagli artt. 52 e 59 del Codice del Consumo (D.lgs. 206/2005): una volta iniziato l&apos;accesso ai contenuti, il recesso non è esercitabile; per gli abbonamenti puoi disdire il rinnovo in qualsiasi momento e l&apos;accesso resta attivo fino a scadenza del periodo pagato.</p>
     <h2 className="text-lg font-bold text-zinc-100">Mentoring e servizi</h2>
     <p>Le sessioni di mentoring, ove incluse nel piano, vanno prenotate con almeno 48 ore di anticipo. Disdette entro 24 ore non danno diritto a recupero automatico.</p>
     <h2 className="text-lg font-bold text-zinc-100">Proprietà intellettuale</h2>
     <p>Tutti i materiali didattici sono di proprietà di Stackup Room. È vietata la redistribuzione o riproduzione non autorizzata.</p>
     <h2 className="text-lg font-bold text-zinc-100">Limitazioni</h2>
     <p>I risultati dipendono da impegno, prerequisiti e contesto personale: non garantiamo esiti occupazionali specifici.</p>
     <h2 className="text-lg font-bold text-zinc-100">Contatti</h2>
     <p>Per questioni legali o di supporto: <span className="text-orange-400">gabriele.forestieri0912@gmail.com</span>.</p>
    </div>
   </div>
  </div>
 );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Privacy Policy',
 description: 'Privacy Policy di Stackup Room',
};

export default function PrivacyPage() {
 return (
  <div className="min-h-screen bg-black pt-20 md:pt-24 pb-16">
   <div className="max-w-3xl mx-auto px-6">
    <h1 className="text-4xl font-jakarta font-black text-zinc-100 mb-8">Privacy Policy</h1>
    <p className="text-sm text-zinc-400 mb-8">Ultimo aggiornamento: 5 settembre 2026</p>
    <div className="prose prose-slate max-w-none space-y-6 text-zinc-400">
     <p>Stackup Room rispetta la tua privacy. Questa informativa descrive, ai sensi del Reg. UE 2016/679 (GDPR), come raccogliamo e trattiamo i dati personali.</p>
     <h2 className="text-lg font-bold text-zinc-100">Titolare del trattamento</h2>
     <p>Gabriele Forestieri — Stackup Room, Milano, Italia. Contatto privacy: <span className="text-orange-400">gabriele.forestieri0912@gmail.com</span>.</p>
     <h2 className="text-lg font-bold text-zinc-100">Dati raccolti</h2>
     <p>Account: nome, email, avatar (se usi Google/GitHub OAuth). Uso della piattaforma: corsi acquistati, progressi esercizi, ordini, preferenze.</p>
     <h2 className="text-lg font-bold text-zinc-100">Base giuridica e finalità</h2>
     <p>Esecuzione del contratto (erogazione corsi e gestione account), adempimenti legali (fatturazione) e legittimo interesse (miglioramento del servizio, sicurezza). Le comunicazioni di marketing solo con consenso.</p>
     <h2 className="text-lg font-bold text-zinc-100">Conservazione</h2>
     <p>Conserviamo i dati per la durata dell&apos;account e per gli obblighi di legge. Puoi chiedere la cancellazione in qualsiasi momento.</p>
     <h2 className="text-lg font-bold text-zinc-100">Cookie</h2>
     <p>Usiamo cookie tecnici necessari all&apos;autenticazione e, se acconsenti, cookie analytics per statistiche aggregate. Nessun cookie di profilazione senza consenso.</p>
     <h2 className="text-lg font-bold text-zinc-100">Terze parti</h2>
     <p>Pagamenti: Stripe. Autenticazione OAuth: Google/GitHub (gestiti dai rispettivi provider). Hosting e database: Supabase/Vercel in UE. Nessuna vendita di dati a terzi.</p>
     <h2 className="text-lg font-bold text-zinc-100">I tuoi diritti</h2>
     <p>Puoi esercitare i diritti di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione scrivendo a <span className="text-orange-400">gabriele.forestieri0912@gmail.com</span>. Hai diritto di reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).</p>
    </div>
   </div>
  </div>
 );
}

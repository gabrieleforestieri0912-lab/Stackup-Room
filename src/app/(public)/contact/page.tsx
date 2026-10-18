'use client';

import React, { useState } from'react';
import Link from'next/link';
import { motion } from'framer-motion';
import {
 Mail,
 MapPin,
 Send,
 Linkedin,
 Github,
 Twitter,
 MessageSquare,
 Globe,
 CheckCircle2,
 ChevronDown
} from'lucide-react';
import toast from'react-hot-toast';

interface FormData {
 name: string;
 email: string;
 subject: string;
 message: string;
}

const Contact: React.FC = () => {
 const [formData, setFormData] = useState<FormData>({ name:'', email:'', subject:'Informazioni Corsi', message:'' });
 const [sending, setSending] = useState<boolean>(false);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 setSending(true);
 try {
 const res = await fetch('/api/contact', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify(formData),
 });
 const data = await res.json();
 if (res.ok) {
 toast.success(data.message);
 setFormData({ name:'', email:'', subject:'Informazioni Corsi', message:'' });
 } else {
 toast.error(data.message ||'Errore nell\'invio');
 }
 } catch {
 toast.error('Errore di connessione. Riprova più tardi.');
 } finally {
 setSending(false);
 }
 };

 return (
 <div className="min-h-screen bg-black/50 pt-24 lg:pt-28 pb-16 overflow-hidden relative">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/5 blur-[200px] -z-10"></div>
 <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/5 blur-[150px] -z-10"></div>

 <div className="max-w-7xl mx-auto px-6">
 <div className="grid lg:grid-cols-12 gap-12 items-start">

 <div className="lg:col-span-5">
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 >
 <span className="text-orange-400 font-mono text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Contattaci</span>
 <h1 className="text-4xl sm:text-4xl font-jakarta font-black text-zinc-100 tracking-tight leading-[1.1] mb-8">
 Parliamo del tuo <span className="text-orange-400 italic">Futuro.</span>
 </h1>
 <p className="text-lg text-zinc-400 font-medium leading-relaxed mb-8">
 Siamo pronti ad ascoltare le tue idee e aiutarti a trasformarle in realtà digitale. Che tu sia uno studente, un&apos;azienda o un curioso, scrivici.
 </p>

  <div className="space-y-8">
  {[
  { i: <Mail className="text-orange-400" />, t:"Scrivici", v:"gabriele.forestieri0912@gmail.com", s:"Rispondiamo in genere entro 24 ore lavorative" },
  { i: <MessageSquare className="text-orange-400" />, t:"Community", v:"Discord Server", s:"Confronto e supporto dalla community" },
  { i: <MapPin className="text-orange-400" />, t:"Sede", v:"Milano, Italia", s:"Operiamo da remoto con base a Milano" }
  ].map((item, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 * i }}
 className="flex gap-6 group"
 >
 <div className="w-14 h-14 bg-black border border-zinc-800 shadow-sm flex items-center justify-center group-hover:border-orange-200 group-hover:shadow-lg group-hover:shadow-orange-500/5 transition-all duration-300 shrink-0 rounded-xl">
 {item.i}
 </div>
 <div>
 <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{item.t}</p>
 <p className="text-lg font-bold text-zinc-100 mb-1">{item.v}</p>
 <p className="text-sm text-zinc-400 font-medium">{item.s}</p>
 </div>
 </motion.div>
 ))}
 </div>

 <div className="mt-16 pt-10 border-t border-zinc-800">
 <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Seguici</p>
 <div className="flex gap-4">
 {[
 { i: <Github size={20} />, h:"hover:bg-black", l:"GitHub" },
 { i: <Linkedin size={20} />, h:"hover:bg-blue-600", l:"LinkedIn" },
 { i: <Twitter size={20} />, h:"hover:bg-sky-500", l:"Twitter" },
 { i: <Globe size={20} />, h:"hover:bg-orange-600", l:"Sito" }
 ].map((soc, i) => (
  <Link
  key={i}
  href="#"
  aria-label={soc.l}
  className={`w-12 h-12 bg-black border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white ${soc.h} transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-xl`}
  >
  {soc.i}
  </Link>
 ))}
 </div>
 </div>
 </motion.div>
 </div>

 <div className="lg:col-span-7">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="bg-black p-6 sm:p-10 border border-zinc-800 shadow-2xl shadow-black/50 relative rounded-2xl"
 >
<div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 blur-3xl -z-10"></div>
  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/5 blur-3xl -z-10"></div>

 <form className="space-y-6" onSubmit={handleSubmit}>
 <div className="grid sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
 <input
 type="text"
 name="name"
 value={formData.name}
 onChange={handleChange}
 required
placeholder="Mario Rossi"
  className="w-full px-5 py-3 bg-black border border-zinc-800 focus:bg-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none text-zinc-100 font-medium placeholder:text-zinc-500 rounded-xl"
  />
  </div>
  <div className="space-y-2">
  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Email</label>
 <input
 type="email"
 name="email"
 value={formData.email}
 onChange={handleChange}
 required
placeholder="mario@email.it"
  className="w-full px-5 py-3 bg-black border border-zinc-800 focus:bg-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none text-zinc-100 font-medium placeholder:text-zinc-500 rounded-xl"
  />
  </div>
  </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Oggetto</label>
 <div className="relative">
 <select name="subject" value={formData.subject} onChange={handleChange} className="w-full px-5 py-3 bg-black border border-zinc-800 focus:bg-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none text-zinc-100 font-medium appearance-none rounded-xl">
 <option>Informazioni Corsi</option>
 <option>Collaborazione Aziendale</option>
 <option>Mentoring Privato</option>
 <option>Altro</option>
 </select>
 <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Messaggio</label>
 <textarea
 name="message"
 value={formData.message}
 onChange={handleChange}
 required
 rows={5}
placeholder="Come possiamo aiutarti?"
  className="w-full px-5 py-3 bg-black border border-zinc-800 focus:bg-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none text-zinc-100 font-medium resize-none placeholder:text-zinc-500 rounded-xl"
  ></textarea>
 </div>

 <button
 type="submit"
 disabled={sending}
 className="w-full py-5 bg-black text-white font-jakarta font-black hover:bg-orange-600 active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
 >
 {sending ?'INVIO IN CORSO...' :'INVIA MESSAGGIO'}
 {sending ? (
 <CheckCircle2 size={18} className="animate-spin" />
 ) : (
 <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
 )}
 </button>

 <p className="text-[10px] text-center text-zinc-400 font-medium">
 Cliccando su invia, accetti la nostra Privacy Policy e il trattamento dei dati personali.
 </p>
 </form>
 </motion.div>
 </div>

 </div>
 </div>
 </div>
 );
};

export default Contact;


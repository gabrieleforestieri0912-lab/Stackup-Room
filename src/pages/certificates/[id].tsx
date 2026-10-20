import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken } from '../../lib/auth-token';
import SEO from '../../components/ui/SEO';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface User {
 _id?: string;
 name: string;
 email: string;
 [key: string]: any;
}

interface AuthContextType {
 user: User | null;
 loading: boolean;
}

interface CertificateCourse {
 title?: string;
 slug?: string;
 duration?: number;
 [key: string]: any;
}

interface Certificate {
 _id: string;
 certificateId: string;
 completedAt: string;
 courseId?: CertificateCourse;
 [key: string]: any;
}

const CertificateView: React.FC = () => {
 const router = useRouter();
 const { id } = router.query;
 const { user, loading: authLoading } = useAuth() as AuthContextType;
 const [cert, setCert] = useState<Certificate | null>(null);
 const [loading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const certRef = useRef<HTMLDivElement | null>(null);

 useEffect(() => {
 if (!authLoading && !user) {
 router.push('/login');
 }
 }, [user, authLoading, router]);

 useEffect(() => {
 if (!user || !id) return;

 const fetchCert = async (): Promise<void> => {
 try {
 const token = await getAccessToken();
 const res = await fetch('/api/certificates', {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (!data.success) throw new Error('Errore nel caricamento');

 const found = data.data.find((c: Certificate) => c.certificateId === id);
 if (!found) throw new Error('Certificato non trovato');
 setCert(found);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 fetchCert();
 }, [user, id]);

 const handlePrint = (): void => {
 window.print();
 };

 if (authLoading || loading) {
 return (
 <>
 <SEO title="Certificato - Stackup" description="Certificato di completamento Stackup." />
 <div className="min-h-screen flex items-center justify-center bg-black">
 <div className="flex flex-col items-center gap-4">
 <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
 <p className="text-sm font-bold text-zinc-400">Caricamento certificato...</p>
 </div>
 </div>
 </>
 );
 }

 if (error || !cert) {
 return (
 <>
 <SEO title="Certificato - Stackup" description="Certificato di completamento Stackup." />
 <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6">
 <p className="text-red-500 font-bold">{error || 'Certificato non trovato'}</p>
 <Link href="/room/you?tab=profile" className="px-6 py-3 bg-black text-white font-bold hover:bg-orange-600 transition-all">
 Torna al profilo
 </Link>
 </div>
 </>
 );
 }

 const course = cert.courseId || {};
 const completedDate = new Date(cert.completedAt).toLocaleDateString('it-IT', {
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 });
 const certIdShort = cert.certificateId ? cert.certificateId.slice(0, 8).toUpperCase() : '------';

 return (
 <>
 <SEO
 title={`Certificato - ${course.title || 'Stackup'}`}
 description={`Certificato di completamento per il corso ${course.title || ''} su Stackup.`}
 />

 <div className="no-print bg-black border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
 <Link href="/room/you?tab=profile" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-colors">
 <ArrowLeft size={16} />
 <span>Torna al profilo</span>
 </Link>
 <button
 onClick={handlePrint}
 className="flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold text-sm hover:bg-orange-600 transition-all"
 >
 <Printer size={16} />
 <span>Stampa / Salva PDF</span>
 </button>
 </div>

 <div className="min-h-screen bg-black flex items-center justify-center p-6 sm:p-12 no-print">
 <div
 ref={certRef}
 className="max-w-[900px] w-full bg-black shadow-2xl overflow-hidden print:shadow-none"
 >
 <div className="m-3 border-2 border-orange-600/20 overflow-hidden">
 <div className="h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>

 <div className="p-6 sm:p-10 text-center">
 <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-600/30">
 <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
 </svg>
 </div>

 <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-orange-600 mb-4">
 Stackup &mdash; Certificate of Completion
 </p>

 <h1 className="text-4xl sm:text-4xl font-jakarta font-black text-zinc-100 mb-4 leading-tight">
 Certificato di Completamento
 </h1>

 <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto mb-6">
 Questo certificato viene conferito a
 </p>

 <h2 className="text-xl sm:text-2xl font-jakarta font-black text-zinc-100 mb-6 pb-6 border-b-2 border-dashed border-zinc-800 inline-block px-8">
 {user!.name}
 </h2>

 <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto mb-6">
 per aver completato con successo il corso
 </p>

 <h3 className="text-xl sm:text-2xl font-jakarta font-bold text-orange-600 mb-6">
 {course.title || 'Corso Stackup'}
 </h3>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mb-6">
 <div className="text-center">
 <p className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1">Data</p>
 <p className="font-bold text-zinc-100">{completedDate}</p>
 </div>
 <div className="hidden sm:block w-px h-10 bg-black"></div>
 <div className="text-center">
 <p className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1">Durata</p>
 <p className="font-bold text-zinc-100">{course.duration || 'N/A'} ore</p>
 </div>
 <div className="hidden sm:block w-px h-10 bg-black"></div>
 <div className="text-center">
 <p className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1">ID Certificato</p>
 <p className="font-bold text-zinc-100 font-mono text-xs">{certIdShort}</p>
 </div>
 </div>

 <div className="border-t border-zinc-800 pt-8 mt-6">
 <div className="flex items-center justify-center gap-3 mb-2">
 <div className="w-5 h-5 rounded bg-black flex items-center justify-center">
 <span className="text-white text-[10px] font-black">S</span>
 </div>
 <span className="text-sm font-bold text-zinc-300">Stackup</span>
 </div>
 <p className="text-[10px] text-zinc-400 font-medium">
 stackup.it &mdash; Formazione tecnica di eccellenza
 </p>
 </div>
 </div>

 <div className="h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"></div>
 </div>
 </div>
 </div>
 </>
 );
};

export default CertificateView;


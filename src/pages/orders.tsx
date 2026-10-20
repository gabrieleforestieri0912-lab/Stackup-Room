import React, { useState, useEffect } from 'react';
import SEO from '../components/ui/SEO';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShoppingBag, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../lib/auth-token';

interface OrderItem {
 title: string;
 slug: string;
}

interface Order {
 _id: string;
 items: OrderItem[];
 totalAmount: number;
 status: string;
 createdAt: string;
}

interface User {
 [key: string]: any;
}

interface AuthContextType {
 user: User | null;
}

const OrdersPage: React.FC = () => {
 const [orders, setOrders] = useState<Order[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);
 const { user } = useAuth() as AuthContextType;
 const router = useRouter();

 useEffect(() => {
 if (!user) {
 router.push('/login');
 return;
 }

 const fetchOrders = async (): Promise<void> => {
 setLoading(true);
 setError(null);
 try {
 const token = await getAccessToken();
 const response = await fetch('/api/orders', {
 headers: { Authorization: `Bearer ${token}` },
 });
 if (!response.ok) throw new Error('Errore nel caricamento degli ordini');
 const data = await response.json();
 setOrders(data.data || []);
 } catch (err: any) {
 setError(err.message);
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 fetchOrders();
 }, [user, router]);

 if (loading) {
 return (
 <>
 <SEO title="I tuoi Ordini" description="Visualizza la cronologia dei tuoi acquisti su Stackup." url="/orders" />
 <div className="min-h-screen flex items-center justify-center bg-black">
 <div className="flex flex-col items-center gap-4">
 <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent animate-spin" />
 <p className="text-sm font-bold text-zinc-400">Caricamento ordini...</p>
 </div>
 </div>
 </>
 );
 }

 if (error) {
 return (
 <>
 <SEO title="I tuoi Ordini" description="Visualizza la cronologia dei tuoi acquisti su Stackup." url="/orders" />
 <div className="min-h-screen flex items-center justify-center bg-black">
 <div className="text-center">
 <p className="text-red-500 font-bold mb-4">{error}</p>
 <button onClick={() => window.location.reload()} className="px-6 py-3 bg-black text-white font-bold hover:bg-orange-600 transition-all">
 Riprova
 </button>
 </div>
 </div>
 </>
 );
 }

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="max-w-7xl mx-auto px-6 pt-20 md:pt-24 pb-16 flex flex-col gap-10 min-h-screen"
 >
 <SEO title="I tuoi Ordini" description="Visualizza la cronologia dei tuoi acquisti su Stackup." url="/orders" />

 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-4xl font-jakarta font-extrabold text-zinc-100 mb-2">I tuoi Ordini</h1>
 <p className="text-sm text-zinc-400 font-medium">Cronologia dei tuoi acquisti su Stackup.</p>
 </div>
 <Link href="/courses" className="hidden sm:flex items-center gap-2 px-5 py-3 bg-black text-white text-sm font-bold hover:bg-orange-600 transition-all shadow-lg">
 Esplora corsi <ArrowRight size={16} />
 </Link>
 </div>

 {orders.length === 0 ? (
 <div className="bg-black border border-zinc-800 p-12 text-center shadow-sm">
 <div className="w-20 h-20 bg-black flex items-center justify-center mx-auto mb-6">
 <ShoppingBag size={36} className="text-zinc-300" />
 </div>
 <h2 className="text-2xl font-bold text-zinc-100 mb-3">Nessun ordine ancora</h2>
 <p className="text-zinc-400 font-medium mb-8 max-w-md mx-auto">
 Non hai ancora effettuato acquisti. I tuoi ordini appariranno qui dopo il primo pagamento.
 </p>
 <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-orange-600 transition-all shadow-lg group">
 <span>Vedi i corsi</span>
 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
 </Link>
 </div>
 ) : (
 <div className="space-y-5">
 {orders.map(order => (
 <div key={order._id} className="bg-black border border-zinc-800 p-6 shadow-sm hover:border-orange-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
 <Clock size={22} />
 </div>
 <div>
 <p className="font-bold text-zinc-100 mb-1">
 {order.items && order.items.length > 0 ? order.items[0].title : 'Acquisto generico'}
 </p>
 <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
 <span>Data: {new Date(order.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-4 sm:text-right">
 <div>
 <p className="font-black text-xl text-zinc-100">€{order.totalAmount.toFixed(2)}</p>
 <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 ${
 order.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400' :
 order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
 'bg-red-100 text-red-700'
 }`}>
 {order.status === 'completed' ? 'Completato' : order.status === 'pending' ? 'In attesa' : 'Fallito'}
 </span>
 </div>
 {order.items && order.items.length > 0 && (
 <Link href={`/courses/${order.items[0].slug}`} className="px-4 py-2.5 bg-black border border-zinc-800 text-zinc-300 text-sm font-bold hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all whitespace-nowrap">
 Vai al corso
 </Link>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </motion.div>
 );
};

export default OrdersPage;


"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, where } from 'firebase/firestore';
import { auth, clientDb } from '@/lib/firebaseClient'; // Added auth
import { signOut } from 'firebase/auth'; // Added signOut
import { useRouter } from 'next/navigation'; // Added useRouter
import PlanSelector from '../../components/PlanSelector';
import { PlanType } from '../../src/config/plans';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, Users, DollarSign, CreditCard,
    ArrowUpRight, ArrowDownRight, Search, Bell, Zap, LogOut // Added LogOut
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
    const router = useRouter(); // Init router
    const [transactions, setTransactions] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState({
        totalVolume: 0,
        activeUsers: 142, // Simulated
        successRate: 98.4,
        avgLatency: 45
    });
    const [loading, setLoading] = useState(true);
    const [showPlans, setShowPlans] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<PlanType>('FREE');

    // Use real merchant ID if available, else fallback safely (layout protects this view anyway)
    const merchantId = auth.currentUser?.uid || 'demo_merchant_1';

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    useEffect(() => {
        if (!auth.currentUser) return; // Wait for auth

        // Fetch/Init Merchant Profile
        const fetchProfile = async () => {
            const ref = doc(clientDb, 'merchants', merchantId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setCurrentPlan(snap.data().currentPlan as PlanType || 'FREE');
            } else {
                // Should be created at register, but fallback just in case
                console.warn("Merchant profile not found, init default");
            }
        };
        fetchProfile();
    }, [merchantId]);

    useEffect(() => {
        if (!merchantId) return;

        // 1. Live Feed (Recent 20)
        const qRecent = query(
            collection(clientDb, 'transactions'),
            where('merchantId', '==', merchantId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubRecent = onSnapshot(qRecent, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as any)
            }));
            setTransactions(txs);
        });

        // 2. Analytics Data (Last 1000 completed for stats/charts)
        // In a real app, use Server-Side Aggregation
        const qStats = query(
            collection(clientDb, 'transactions'),
            where('merchantId', '==', merchantId),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(1000)
        );

        const unsubStats = onSnapshot(qStats, (snapshot) => {
            const docs = snapshot.docs.map(d => d.data());

            // Calc Totals
            const totalVol = docs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            const successCount = docs.length;

            // Calc Chart Data (Group by Hour)
            const grouped = docs.reduce((acc: any, curr: any) => {
                try {
                    const date = curr.createdAt?.toDate ? curr.createdAt.toDate() : new Date(curr.createdAt);
                    const key = date.getHours() + ':00';
                    acc[key] = (acc[key] || 0) + (curr.amount || 0);
                } catch (e) { console.warn(e); }
                return acc;
            }, {});

            const newChartData = Object.keys(grouped).map(k => ({
                name: k,
                value: grouped[k]
            })).sort((a, b) => parseInt(a.name) - parseInt(b.name));

            // Fill missing hours if needed, or just show what we have
            // For demo, let's keep it simple

            setStats(prev => ({
                ...prev,
                totalVolume: totalVol,
                activeUsers: successCount, // Using sales count as proxy for now
                successRate: 100 // Since we filter by completed
            }));

            // Update chart if we have data, else keep default empty or specific empty state
            if (newChartData.length > 0) {
                setChartData(newChartData);
            }
        });

        return () => {
            unsubRecent();
            unsubStats();
        };
    }, [merchantId]);

    const [chartData, setChartData] = useState([
        { name: '00:00', value: 0 },
        { name: '06:00', value: 0 },
        { name: '12:00', value: 0 },
        { name: '18:00', value: 0 },
    ]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 hidden md:block">
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">TrainAdmin</span>
                </div>

                <nav className="space-y-2">
                    {['Overview', 'Transactions', 'Customers', 'Developers', 'Settings'].map((item, i) => (
                        <button
                            key={item}
                            onClick={() => item === 'Settings' ? router.push('/settings') : null}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${i === 0
                                ? 'bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {item}
                        </button>
                    ))}

                    {/* Sidebar Sign Out */}
                    <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 rounded-xl transition-all text-slate-400 hover:text-red-400 hover:bg-white/5 mt-10 flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <p className="text-slate-500 text-sm">Real-time platform overview</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowPlans(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                        >
                            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold">Upgrade Plan</span>
                        </button>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none w-64"
                            />
                        </div>
                        <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 relative">
                            <Bell className="w-5 h-5 text-slate-500" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Header Avatar / Sign Out */}
                        <button onClick={handleSignOut} title="Sign Out" className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full hover:ring-2 hover:ring-slate-200 transition-all" />
                    </div>
                </header>

                {showPlans && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                        <PlanSelector
                            currentPlanId={currentPlan}
                            merchantId={merchantId}
                            onClose={() => setShowPlans(false)}
                        />
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Volume', value: `$${stats.totalVolume.toLocaleString()}`, icon: DollarSign, trend: '+12.5%', good: true },
                        { label: 'Active Users', value: stats.activeUsers, icon: Users, trend: '+4.2%', good: true },
                        { label: 'Success Rate', value: `${stats.successRate}%`, icon: Activity, trend: '-0.1%', good: false },
                        { label: 'Avg Latency', value: `${stats.avgLatency}ms`, icon: CreditCard, trend: '-2ms', good: true },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <stat.icon className="w-5 h-5 text-slate-900" />
                                </div>
                                <span className={`flex items-center text-xs font-bold ${stat.good ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-full`}>
                                    {stat.good ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {stat.trend}
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-1">{stat.value}</h3>
                            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-lg mb-6">Transaction Volume</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 transform translate-x-10 -translate-y-10" />

                        <div>
                            <h3 className="font-bold text-lg mb-2">System Status</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="text-emerald-400 text-sm font-semibold">All Systems Operational</span>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: 'API Latency', val: '45ms', status: 'optimal' },
                                    { name: 'Database', val: 'Connected', status: 'optimal' },
                                    { name: 'Webhook Success', val: '99.9%', status: 'optimal' }
                                ].map((sys, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                        <span className="text-sm text-slate-300">{sys.name}</span>
                                        <span className="text-sm font-mono font-bold">{sys.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                {/* Real-time Transactions Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Live Transactions</h3>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            <Activity className="w-3 h-3" /> Live Feed
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                                ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                    tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            ${tx.amount?.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {tx.description || 'Payment'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                            {(() => {
                                                try {
                                                    const dateVal = tx.createdAt;
                                                    let dateObj = new Date();
                                                    if (dateVal) {
                                                        // Handle Firestore Timestamp
                                                        if (typeof dateVal.toDate === 'function') {
                                                            dateObj = dateVal.toDate();
                                                        }
                                                        // Handle ISO String
                                                        else if (typeof dateVal === 'string') {
                                                            dateObj = new Date(dateVal);
                                                        }
                                                        // Handle Date Object
                                                        else if (dateVal instanceof Date) {
                                                            dateObj = dateVal;
                                                        }
                                                    }

                                                    if (isNaN(dateObj.getTime())) return 'N/A';
                                                    return formatDistanceToNow(dateObj, { addSuffix: true });
                                                } catch {
                                                    return 'N/A';
                                                }
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            {tx.id.slice(0, 8)}...
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            Waiting for transactions...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

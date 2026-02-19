"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, clientDb } from '@/lib/firebaseClient';
import { Loader2, Store, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign In
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Security Check: Is this a merchant?
            const merchantRef = doc(clientDb, 'merchants', user.uid);
            const merchantSnap = await getDoc(merchantRef);

            if (!merchantSnap.exists()) {
                await signOut(auth);
                throw new Error("Access Denied: This account is not a registered Merchant.");
            }

            // 3. Success
            toast.success("Welcome back!");
            router.push('/dashboard');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Login Failed");
            if (error.message.includes("Access Denied")) {
                // Clear auth state ensures they aren't stuck logged in as a user
                await signOut(auth);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-8 bg-slate-900 text-white border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">TrainCredit</span>
                    </div>
                    <h1 className="text-2xl font-bold mt-4">Merchant Login</h1>
                    <p className="text-slate-400 text-sm mt-1">Access your business dashboard.</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                required
                                placeholder="merchant@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1 ml-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                            <a href="#" className="text-xs text-emerald-600 font-bold hover:underline">Forgot?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                required
                                placeholder="••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                        New to TrainCredit?{' '}
                        <a href="/register" className="text-emerald-600 font-bold hover:underline">Create Account</a>
                    </p>
                </form>
            </div>
        </div>
    );
}

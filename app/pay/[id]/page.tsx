"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { clientDb } from '@/lib/firebaseClient';
import { Loader2, CheckCircle, XCircle, ShieldCheck, Clock } from 'lucide-react';

export default function PaymentPage() {
    const { id } = useParams() as { id: string };
    const [transaction, setTransaction] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'expired'>('pending');

    useEffect(() => {
        if (!id) return;
        const unsub = onSnapshot(doc(clientDb, 'transactions', id), (docFn) => {
            if (docFn.exists()) {
                const data = docFn.data();
                setTransaction(data);
                setStatus(data.status);
                setLoading(false);
            } else {
                setStatus('failed');
                setLoading(false);
            }
        });
        return () => unsub();
    }, [id]);

    useEffect(() => {
        if (status !== 'pending') return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const handleExpire = async () => {
        setStatus('expired');
        try {
            await updateDoc(doc(clientDb, 'transactions', id), { status: 'expired' });
        } catch (e) { console.error(e); }
    };

    const handlePayment = async (success: boolean) => {
        setProcessing(true);
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await updateDoc(doc(clientDb, 'transactions', id), {
                status: success ? 'completed' : 'failed',
                processedAt: new Date().toISOString()
            });
            // The onSnapshot listener will update the local state automatically
        } catch (error) {
            console.error('Payment failed', error);
            alert('Payment processing error');
        } finally {
            setProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    );

    if (status === 'completed') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h1>
                <p className="text-slate-500 mb-6">Your transaction has been processed securely.</p>
                <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500">Amount Paid</span>
                        <span className="font-bold text-slate-900">${transaction?.amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID</span>
                        <span className="font-mono text-xs text-slate-700">{id.slice(0, 8)}...</span>
                    </div>
                </div>
                <button
                    onClick={() => window.close()}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                    Close Window
                </button>
            </div>
        </div>
    );

    if (status === 'expired' || status === 'failed') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">
                    {status === 'expired' ? 'Session Expired' : 'Payment Failed'}
                </h1>
                <p className="text-slate-500 mb-6">
                    {status === 'expired'
                        ? 'This payment session has timed out due to inactivity.'
                        : 'The transaction could not be processed.'}
                </p>
                <button
                    onClick={() => window.close()}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl"
                >
                    Close Window
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        <span className="font-bold tracking-wide">TrainCredit Secure</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-mono">
                        <Clock className="w-3 h-3" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="p-8">
                    {/* Amount */}
                    <div className="text-center mb-8">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
                        <h1 className="text-4xl font-black text-slate-900">${transaction?.amount?.toFixed(2)}</h1>
                        <p className="text-sm text-slate-500 mt-2">{transaction?.description}</p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3 mb-8">
                        <button
                            disabled={processing}
                            onClick={() => handlePayment(true)}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Payment'}
                        </button>
                        <button
                            disabled={processing}
                            onClick={() => handlePayment(false)}
                            className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel Transaction
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            256-bit SSL Encrypted Payment
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-100 w-full">
                    <div
                        className="h-full bg-slate-900 transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / 300) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

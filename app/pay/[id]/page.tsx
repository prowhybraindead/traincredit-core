"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebaseClient';
import { Loader2, CheckCircle, XCircle, ShieldCheck, Clock, QrCode } from 'lucide-react';
import Image from 'next/image';
import { Transaction } from '@/types'; // Use new shared types

export default function PaymentPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    // UI State - No more Tabs/Card Input
    const [status, setStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'>('PENDING');

    useEffect(() => {
        if (!id) return;

        // PASSIVE LISTENER: Wait for Wallet to complete transaction
        const unsub = onSnapshot(doc(clientDb, 'transactions', id), (docFn) => {
            if (docFn.exists()) {
                const data = docFn.data() as Transaction;
                setTransaction(data);
                setStatus(data.status);
                setLoading(false);

                // Auto-Redirect on Success
                if (data.status === 'COMPLETED') {
                    // small delay for UI feedback
                    setTimeout(() => router.push('/dashboard'), 2000);
                }
            } else {
                setStatus('FAILED');
                setLoading(false);
            }
        });
        return () => unsub();
    }, [id, router]);

    useEffect(() => {
        if (status !== 'PENDING') return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status]);

    // STRICT QR GENERATION
    const qrPayload = transaction ? JSON.stringify({
        type: 'PAYMENT',
        trId: id,
        merchantName: transaction.merchantName || 'Merchant'
    }) : '';

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

    if (status === 'COMPLETED') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h1>
                <p className="text-slate-500 mb-6">Redirecting you to dashboard...</p>
            </div>
        </div>
    );

    if (status === 'FAILED' || status === 'EXPIRED') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50/50 p-6">
            <div className="text-center">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Payment Failed</h1>
                <p className="text-slate-500 mt-2">The transaction could not be completed.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        <span className="font-bold tracking-wide">TrainPay</span>
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

                    {/* Passive QR Display */}
                    <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm mb-4">
                            <Image
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`}
                                alt="Payment QR"
                                width={240}
                                height={240}
                                className="w-60 h-60 opacity-90"
                                unoptimized
                            />
                        </div>
                        <p className="text-sm text-center text-slate-500 max-w-[200px] mb-2">
                            Scan with <span className="font-bold text-slate-900">Straight Wallet</span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
                            <QrCode className="w-3 h-3" />
                            Waiting for scan...
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Secure Firestore-Driven Transaction
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

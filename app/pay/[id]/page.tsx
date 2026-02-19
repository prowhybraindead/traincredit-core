"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebaseClient';
import { Loader2, CheckCircle, XCircle, ShieldCheck, Clock, QrCode, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function PaymentPage() {
    const { id } = useParams() as { id: string };
    const [transaction, setTransaction] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'expired'>('pending');

    // Payment UI State
    const [activeTab, setActiveTab] = useState<'QR' | 'CARD'>('QR');
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
    const [processing, setProcessing] = useState(false);

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
                if (prev <= 1) return 0; // Handle expiry logic elsewhere if needed
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status]);

    const handleCardPayment = async () => {
        if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
            toast.error("Please fill in all card details");
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch('/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionId: id,
                    cardNumber: cardDetails.number.replace(/\s/g, ''),
                    expiry: cardDetails.expiry,
                    cvv: cardDetails.cvv
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Payment Failed');

            toast.success("Payment Successful!");
            // Status will update via Firestore listener
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    const qrPayload = transaction ? JSON.stringify({
        type: 'PAYMENT',
        trId: id,
        amount: transaction.amount,
        merchantName: transaction.type === 'SUBSCRIPTION_FEE' ? 'TrainCredit Inc.' : 'Merchant'
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
                    onClick={() => window.close()} // Ideally redirect back to dashboard
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    if (status === 'failed' || status === 'expired') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50/50 p-6">
            <div className="text-center">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Payment Failed</h1>
                <p className="text-slate-500 mt-2">The transaction could not be completed.</p>
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

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                        <button
                            onClick={() => setActiveTab('QR')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'QR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <QrCode className="w-4 h-4" /> Scan QR
                        </button>
                        <button
                            onClick={() => setActiveTab('CARD')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'CARD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <CreditCard className="w-4 h-4" /> Pay with Card
                        </button>
                    </div>

                    {/* QR Code Tab */}
                    {activeTab === 'QR' && (
                        <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm mb-4">
                                <Image
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`}
                                    alt="Payment QR"
                                    width={192}
                                    height={192}
                                    className="w-48 h-48 opacity-90"
                                    unoptimized
                                />
                            </div>
                            <p className="text-xs text-center text-slate-400 max-w-[200px]">
                                Open your <span className="font-bold text-slate-900">Straight Wallet</span> app and scan this code to pay instantly.
                            </p>
                        </div>
                    )}

                    {/* Card Tab */}
                    {activeTab === 'CARD' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Card Number</label>
                                <div className="relative mt-1">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={19}
                                        value={cardDetails.number}
                                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Expiry</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        value={cardDetails.expiry}
                                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                        className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">CVV</label>
                                    <div className="relative mt-1">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="123"
                                            maxLength={4}
                                            value={cardDetails.cvv}
                                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCardPayment}
                                disabled={processing}
                                className="w-full py-4 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                            >
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay $${transaction?.amount?.toFixed(2)}`}
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-8">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Use your Straight Wallet for 1% cashback
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

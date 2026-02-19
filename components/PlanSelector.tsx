"use client";

import { useState } from 'react';
import { PLANS, PlanType, PlanConfig } from '../src/config/plans';
import { Check, Loader2 } from 'lucide-react';
import { clientDb } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface PlanSelectorProps {
    currentPlanId?: PlanType;
    merchantId: string; // The logged-in merchant's UID
    onClose: () => void;
}

export default function PlanSelector({ currentPlanId = 'FREE', merchantId, onClose }: PlanSelectorProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const handleUpgrade = async (planId: PlanType) => {
        if (planId === currentPlanId) return;
        setLoading(planId);

        try {
            const plan = PLANS[planId];

            // 1. Create Subscription Fee Transaction
            const txRef = await addDoc(collection(clientDb, 'transactions'), {
                type: 'SUBSCRIPTION_FEE',
                amount: plan.price,
                merchantId: merchantId,
                description: `Upgrade to ${plan.name}`,
                status: 'pending',
                planId: planId,
                createdAt: serverTimestamp(),
                currency: 'USD'
            });

            // 2. Redirect to Internal Gateway
            router.push(`/pay/${txRef.id}`);
        } catch (error) {
            console.error("Upgrade failed:", error);
            setLoading(null);
            alert("Failed to initiate upgrade. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-5xl p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"
                >
                    ✕
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Upgrade your Plan</h2>
                    <p className="text-slate-500">Scale your business with higher limits and premium features.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.values(PLANS).map((plan: PlanConfig) => {
                        const isCurrent = plan.id === currentPlanId;
                        const isFree = plan.price === 0;

                        return (
                            <div
                                key={plan.id}
                                className={`relative p-6 rounded-2xl border-2 flex flex-col ${isCurrent
                                    ? 'border-emerald-500 bg-emerald-50/50'
                                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-xl'
                                    } transition-all`}
                            >
                                {isCurrent && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Current Plan
                                    </span>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-3xl font-black text-slate-900">${plan.price}</span>
                                        <span className="text-slate-400 text-sm font-medium">/mo</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 min-h-[40px]">
                                        {plan.txnLimit === -1 ? 'Unlimited' : `${plan.txnLimit.toLocaleString()} monthly`} transactions
                                    </p>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                    <li className="flex items-start gap-2 text-sm text-slate-600">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Fee: {(plan.fee.percentage * 100).toFixed(1)}% + ${plan.fee.fixed}</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loading !== null || isCurrent}
                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isCurrent
                                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                        : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] shadow-lg shadow-slate-900/20'
                                        }`}
                                >
                                    {loading === plan.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isCurrent ? (
                                        'Active'
                                    ) : (
                                        `Upgrade to ${plan.name}`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

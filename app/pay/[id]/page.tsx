'use client';

import React, { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';

export default function PaymentGateway({ params }: { params: { id: string } }) {
    const [status, setStatus] = useState('pending');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    useEffect(() => {
        if (status !== 'pending') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Here we would setup a listener for the transaction ID (params.id)
        // For simulation, we'll just wait.

        return () => clearInterval(timer);
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💳</span>
                    </div>
                </div>

                <div>
                    <h1 className="text-xl font-bold">Complete Payment</h1>
                    <p className="text-slate-500 text-sm mt-1">Transaction ID: {params.id}</p>
                </div>

                <div className="text-4xl font-mono font-bold text-indigo-600">
                    $24.99
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Time Remaining</p>
                    <p className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-slate-800'}`}>
                        {formatTime(timeLeft)}
                    </p>
                </div>

                <button
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition"
                    onClick={() => setStatus('completed')}
                >
                    Simulate Pay with Wallet
                </button>

                {status === 'completed' && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg">
                        Payment Successful! Redirecting...
                    </div>
                )}
                {status === 'expired' && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                        Session Expired.
                    </div>
                )}
            </div>
        </div>
    );
}

import { NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebaseAdmin';

// Note: CORS is now handled globally in next.config.mjs

export async function POST(request: Request) {
    try {
        const { transactionId, cardNumber, pin } = await request.json();

        // 1. Validate Input
        if (!transactionId || !cardNumber) {
            return NextResponse.json(
                { error: 'Invalid Payment Data' },
                { status: 400 }
            );
        }
        if (!pin || pin.length !== 6) {
            return NextResponse.json(
                { error: '6-digit PIN is required' },
                { status: 400 }
            );
        }

        // 2. Fetch Transaction
        const txRef = adminDb.collection('transactions').doc(transactionId);
        const txSnap = await txRef.get();

        if (!txSnap.exists) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        const txData = txSnap.data();
        if (txData?.status === 'completed') {
            return NextResponse.json(
                { error: 'Transaction already completed' },
                { status: 400 }
            );
        }

        const amount = txData?.amount || 0;

        // 3. Find Payer User (Scan Users Collection via Admin SDK)
        const usersSnap = await adminDb.collection('users').get();
        let payerRef = null;
        let payerData = null;

        for (const doc of usersSnap.docs) {
            const data = doc.data();
            if (data.cards && Array.isArray(data.cards)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const card = data.cards.find((c: any) => c.number === cardNumber);
                if (card) {
                    payerRef = doc.ref;
                    payerData = data;
                    break;
                }
            }
        }

        if (!payerRef || !payerData) {
            return NextResponse.json(
                { error: 'Invalid Card Number' },
                { status: 400 }
            );
        }

        // 4. Verify PIN
        if (payerData.pin !== pin) {
            return NextResponse.json(
                { error: 'Invalid Security PIN' },
                { status: 403 }
            );
        }

        // 5. Run Transaction (ACID)
        await adminDb.runTransaction(async (t) => {
            const currentPayerDoc = await t.get(payerRef!);
            if (!currentPayerDoc.exists) throw new Error("Payer not found");

            const currentBalance = currentPayerDoc.data()?.balance || 0;
            if (currentBalance < amount) {
                throw new Error("Insufficient Funds");
            }

            // Deduct
            t.update(payerRef!, {
                balance: currentBalance - amount
            });

            // Mark Transaction
            t.update(txRef, {
                status: 'completed',
                paymentMethod: 'CARD',
                processedAt: new Date().toISOString()
            });

            // Handle Subscription Logic if needed
            if (txData?.type === 'SUBSCRIPTION_FEE' && txData.merchantId) {
                const merchantRef = adminDb.collection('merchants').doc(txData.merchantId);
                t.update(merchantRef, {
                    currentPlan: txData.planId,
                    subscriptionStatus: 'ACTIVE',
                    billingCycle: 'MONTHLY',
                    lastBillingDate: new Date().toISOString()
                });
            }
        });

        return NextResponse.json(
            { success: true, message: 'Payment Processed' },
            { status: 200 }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Payment processing error:', error);
        return NextResponse.json(
            { error: error.message || 'Payment Failed' },
            { status: 500 }
        );
    }
}

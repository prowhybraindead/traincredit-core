import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const getCorsHeaders = () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
});

export async function OPTIONS() {
    return NextResponse.json({}, { headers: getCorsHeaders() });
}

export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get('x-api-key');

        if (apiKey !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401, headers: getCorsHeaders() });
        }

        const body = await req.json();
        const { amount, currency = 'USD', description = 'Payment' } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400, headers: getCorsHeaders() });
        }

        const transactionRef = db.collection('transactions').doc();
        const transactionData = {
            id: transactionRef.id,
            amount: parseFloat(amount),
            currency,
            description,
            status: 'pending',
            createdAt: new Date().toISOString(),
            type: 'PAYMENT_GATEWAY',
        };

        await transactionRef.set(transactionData);

        const checkoutUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/pay/${transactionRef.id}`;

        return NextResponse.json({
            status: 'success',
            checkoutUrl,
            transactionId: transactionRef.id,
        }, { headers: getCorsHeaders() });

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Transaction API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500, headers: getCorsHeaders() });
    }
}

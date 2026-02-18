import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');

    // 1. Secure API Key Check
    if (apiKey !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { amount, description, merchantId } = body;

        // 2. Create Payment Intent / Transaction Record
        const docRef = await db.collection('transactions').add({
            type: 'PAYMENT',
            amount,
            description,
            merchantId,
            status: 'pending',
            timestamp: new Date(),
            participants: [merchantId] // Later add payer
        });

        return NextResponse.json({
            success: true,
            transactionId: docRef.id,
            // Netlify provides 'URL' env var. Fallback to localhost.
            checkoutUrl: `${process.env.NEXT_PUBLIC_URL || process.env.URL || 'http://localhost:3000'}/pay/${docRef.id}`
        });

    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { processPayment } from '@/app/pay/actions';

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { transactionId, cardNumber, pin } = body;

        if (!transactionId || !cardNumber || !pin) {
            return NextResponse.json({ success: false, error: "Missing payload data from Wallet" }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        // Pass "BYPASS" for expiry and cvv since Wallet QR flow uses PIN for auth
        const result = await processPayment(transactionId, cardNumber, "BYPASS", "BYPASS", pin);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }
        return NextResponse.json(result, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}

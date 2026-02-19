"use server";

import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Helper: Find user by card number.
 * Note: In a real/scaled app, we would query a specific 'cards' collection or have an index.
 * For this demo, we iterate users (inefficient but functional for small inputs).
 */
async function findUserByCard(cardNumber: string) {
    const usersSnap = await db.collection('users').get();
    let foundUser: any = null;
    let cardIndex = -1;

    usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.cards && Array.isArray(data.cards)) {
            const idx = data.cards.findIndex((c: any) => c.number === cardNumber);
            if (idx !== -1) {
                foundUser = { id: doc.id, ...data };
                cardIndex = idx;
            }
        }
    });

    return { foundUser, cardIndex };
}

export async function processPayment(
    transactionId: string,
    cardNumber: string,
    expiry: string,
    cvv: string,
    pin: string
) {
    if (!transactionId || !cardNumber || !pin || !cvv || !expiry) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        // 1. Locate User (Pre-Transaction)
        const { foundUser, cardIndex } = await findUserByCard(cardNumber);
        if (!foundUser || cardIndex === -1) {
            throw new Error("Card invalid or not found");
        }

        const userId = foundUser.id;
        const userRef = db.collection('users').doc(userId);
        const txRef = db.collection('transactions').doc(transactionId);

        // 2. Start ACID Transaction
        await db.runTransaction(async (t) => {
            // A. Idempotency & Transaction Validation
            const txDoc = await t.get(txRef);
            if (!txDoc.exists) throw new Error("Transaction ID invalid");

            const txData = txDoc.data();
            if (txData?.status === 'COMPLETED') {
                throw new Error("Double-Spend Error: Transaction already completed");
            }
            if (txData?.status === 'FAILED') {
                throw new Error("Transaction marked as FAILED");
            }

            const amount = txData?.amount || 0;
            const merchantId = txData?.merchantId;

            // B. Validate User & Balance
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error("User record missing");

            const userData = userDoc.data();
            if (!userData) throw new Error("User data empty");

            // Verify PIN
            if (userData.pin !== pin) {
                // In production, use bcrypt.compare(pin, userData.pinHash)
                throw new Error("Invalid Security PIN");
            }

            const card = userData.cards[cardIndex];

            // Validate CVV & Expiry
            if (card.cvv !== cvv) throw new Error("Invalid CVV");
            if (card.expiry !== expiry) throw new Error("Invalid Expiry Date");

            const cardBalance = card.balance || 0;

            if (cardBalance < amount) {
                throw new Error(`Insufficient Funds. Available: $${cardBalance}`);
            }

            // C. Atomic Logic (Deduct & Credit)

            // 1. Update User (Deduct from specific card)
            const newCards = [...userData.cards];
            newCards[cardIndex] = {
                ...newCards[cardIndex],
                balance: Number((cardBalance - amount).toFixed(2))
            };

            t.update(userRef, { cards: newCards });

            // 2. Update Merchant (Credit)
            if (merchantId) {
                const merchantRef = db.collection('merchants').doc(merchantId);
                t.update(merchantRef, {
                    balance: FieldValue.increment(amount)
                });
            }

            // 3. Mark Transaction Completed
            t.update(txRef, {
                status: 'COMPLETED',
                method: 'CARD',
                processedAt: FieldValue.serverTimestamp(),
                payerId: userId
            });
        });

        return { success: true };

    } catch (error: any) {
        console.error("Payment Error:", error);
        return { success: false, error: error.message || "Payment Process Failed" };
    }
}

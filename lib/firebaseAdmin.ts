import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    if (process.env.FIREBASE_PRIVATE_KEY) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } else {
        // Fallback for dev without admin creds (mock or partial)
        // Or throw error
        console.warn("Firebase Admin Certs missing!");
    }
}

export const db = getFirestore();

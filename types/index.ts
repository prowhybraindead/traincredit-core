export interface Card {
    number: string;
    cvv: string;
    expiry: string;
    provider: 'VISA' | 'MASTERCARD' | 'AMEX';
    // NO BALANCE HERE - Virtual Cards depend on Main User Balance
}

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;

    // Financials
    accountNumber: string; // 14-digit unique ID
    pinHash?: string;      // For transaction auth
    mainBalance: number;   // SINGLE SOURCE OF TRUTH

    // Virtual Cards (Pointers to Main Balance)
    cards: Card[];

    // Meta
    createdAt: string;
    status: 'ACTIVE' | 'FROZEN';
}

export interface Merchant {
    uid: string;
    businessName: string;
    email: string;

    // Financials
    balance: number;

    // Config
    apiKeys: {
        publicKey: string;
        secretKey: string;
    }[];

    // SaaS
    currentPlan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
    subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    billingCycle: 'MONTHLY' | 'YEARLY';
}

export interface Transaction {
    id?: string;
    amount: number;
    description: string;
    merchantId?: string;
    merchantName?: string;
    payerId?: string;

    type: 'PAYMENT' | 'P2P_SEND' | 'P2P_RECEIVE' | 'SUBSCRIPTION_FEE' | 'DEPOSIT';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

    method: 'QR_SCAN' | 'CARD_ENTRY' | 'P2P';
    createdAt: string; // ISO String
    processedAt?: string;

    // P2P Specific
    senderId?: string;
    receiverId?: string;
    message?: string;
}

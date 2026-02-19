export type PlanType = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export interface PlanConfig {
    id: PlanType;
    name: string;
    price: number; // Monthly price in USD
    txnLimit: number; // Monthly transaction limit
    fee: {
        percentage: number; // e.g., 0.029 for 2.9%
        fixed: number; // e.g., 0.30 for $0.30
    };
    features: string[];
    supportLevel: 'Standard' | 'Email' | 'Priority' | '24/7 Dedicated';
}

export const PLANS: Record<PlanType, PlanConfig> = {
    FREE: {
        id: 'FREE',
        name: 'Free Tier',
        price: 0,
        txnLimit: 100,
        fee: { percentage: 0.029, fixed: 0.30 },
        features: ['Standard Dashboard', 'Test API Keys', 'Basic Reporting'],
        supportLevel: 'Standard'
    },
    BASIC: {
        id: 'BASIC',
        name: 'Basic',
        price: 29,
        txnLimit: 1000,
        fee: { percentage: 0.020, fixed: 0.20 },
        features: ['Live API Keys', 'Email Support', 'Standard Analytics'],
        supportLevel: 'Email'
    },
    PREMIUM: {
        id: 'PREMIUM',
        name: 'Premium',
        price: 99,
        txnLimit: 10000,
        fee: { percentage: 0.015, fixed: 0.0 }, // 1.5% flat
        features: ['Priority Support', 'Advanced Analytics (Charts)', 'Bulk Operations'],
        supportLevel: 'Priority'
    },
    ENTERPRISE: {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        price: 299,
        txnLimit: -1, // Unlimited
        fee: { percentage: 0.010, fixed: 0.0 }, // 1.0% flat
        features: ['Dedicated Account Manager', '24/7 Support', 'Custom Integrations', 'SLA'],
        supportLevel: '24/7 Dedicated'
    }
};

export const getPlan = (id: string): PlanConfig => {
    return PLANS[id as PlanType] || PLANS.FREE;
};

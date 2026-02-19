"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, clientDb } from '@/lib/firebaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Key, Globe, Store, User } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [merchantName, setMerchantName] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [apiKey, setApiKey] = useState('sk_live_...'); // Mock or real

    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchProfile = async () => {
            const ref = doc(clientDb, 'merchants', user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                setMerchantName(data.name || 'My Store');
                setWebhookUrl(data.webhookUrl || '');
                setApiKey(data.apiKey || `sk_live_${user.uid.slice(0, 8)}...`);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user, router]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const ref = doc(clientDb, 'merchants', user.uid);
            await updateDoc(ref, {
                name: merchantName,
                webhookUrl: webhookUrl
            });
            toast.success("Settings Saved!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <h1 className="text-3xl font-black text-slate-900 mb-2">Merchant Settings</h1>
                <p className="text-slate-500 mb-8">Manage your store profile and API configurations.</p>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Store className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h2 className="text-lg font-bold">Store Profile</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Merchant Name</label>
                            <input
                                type="text"
                                value={merchantName}
                                onChange={(e) => setMerchantName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                    </div>

                    {/* Developer Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Key className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-lg font-bold">Developer Settings</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Secret API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={apiKey}
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(apiKey);
                                            toast.success("Copied to clipboard");
                                        }}
                                        className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Do not share this key with anyone.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Webhook URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                        placeholder="https://your-api.com/webhook"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

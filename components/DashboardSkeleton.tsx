export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 p-8 animate-pulse">
            <div className="h-10 w-48 bg-slate-200 rounded-lg mb-10" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 h-64 bg-slate-200 rounded-2xl" />
                <div className="h-64 bg-slate-800 rounded-2xl opacity-50" />
            </div>

            <div className="h-96 bg-white rounded-2xl border border-slate-100 p-6">
                <div className="h-8 w-32 bg-slate-200 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-slate-50 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

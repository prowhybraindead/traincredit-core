import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Globe, Lock } from 'lucide-react';

export default function Home() {
  const features = [
    { icon: ShieldCheck, title: 'Bank-Grade Security', desc: 'PCI-DSS compliant infrastructure with 256-bit encryption' },
    { icon: Zap, title: 'Instant Settlement', desc: 'Real-time transaction processing with <100ms latency' },
    { icon: Globe, title: 'Global Reach', desc: 'Accept payments from anywhere in the world' },
    { icon: Lock, title: 'Fraud Protection', desc: 'AI-driven fraud detection system built-in' },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50" style={{ transform: 'translateZ(0)', willChange: 'filter' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">TrainCredit</span>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link href="https://github.com/train-app" target="_blank" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
            Infrastructure for the Future
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Payments infrastructure <br /> for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">internet</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Millions of businesses of all sizes—from startups to large enterprises—use TrainCredit&apos;s software and APIs to accept payments, send payouts, and manage their businesses online.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20 flex items-center gap-2">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center">
              <Zap className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="font-bold text-white tracking-tight">TrainCredit</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} TrainCredit Ecosystem. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

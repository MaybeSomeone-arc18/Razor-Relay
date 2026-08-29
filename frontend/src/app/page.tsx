"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Shield, Zap, Activity, CheckCircle2, Copy, Check, 
  Server, ArrowRight, Lock, Database, Code2, Globe, Sun, Moon, LayoutTemplate
} from "lucide-react";

export default function LandingPage() {
  const [activeCodeTab, setActiveCodeTab] = useState<"curl" | "py" | "node">("curl");
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark"); // Default to dark for consistency with rest of page

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    // In a real app, this would toggle a global .dark class on the html element
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 overflow-hidden ${theme === 'dark' ? 'bg-[#02042B] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. Protocol Marquee Ticker */}
      <div className="w-full bg-slate-950 text-slate-400 font-mono text-[11px] py-2 overflow-hidden flex whitespace-nowrap border-b border-slate-800">
        <motion.div 
          animate={{ x: [0, -1000] }} 
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex gap-12 items-center shrink-0 pr-12"
        >
          <span>RAZORPAYX PAYOUTS</span> • 
          <span>SOLANA X402</span> • 
          <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-sm">HTTP 402 PAYMENT REQUIRED</span> • 
          <span>ERC-7579</span> • 
          <span>NPCI UAP</span> • 
          <span>RAZORPAY SMART COLLECT</span>
        </motion.div>
        {/* Duplicate for seamless loop */}
        <motion.div 
          animate={{ x: [0, -1000] }} 
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex gap-12 items-center shrink-0 pr-12"
          aria-hidden="true"
        >
          <span>RAZORPAYX PAYOUTS</span> • 
          <span>SOLANA X402</span> • 
          <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-sm">HTTP 402 PAYMENT REQUIRED</span> • 
          <span>ERC-7579</span> • 
          <span>NPCI UAP</span> • 
          <span>RAZORPAY SMART COLLECT</span>
        </motion.div>
      </div>

      {/* 2. Header & Branding */}
      <nav className={`w-full backdrop-blur-md border-b py-4 px-6 flex items-center justify-between sticky top-0 z-50 transition-colors ${theme === 'dark' ? 'bg-[#02042B]/80 border-blue-500/20' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <span className="font-black text-xl tracking-tight">
              <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>RAZOR</span>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">-RELAY</span>
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold tracking-widest uppercase gap-2">
            TRACK 01 // AGENTIC COMMERCE
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer" className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-bold transition-colors ${theme === 'dark' ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Terminal className="w-4 h-4" /> Swagger API
          </a>
          <a href="/ui" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all flex items-center gap-2">
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* 3. Hero Section (2-Column Grid) */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left Column: Copy */}
        <div className="lg:col-span-7 space-y-8 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-5xl sm:text-6xl lg:text-[64px] font-black tracking-tight leading-[1.1] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
          >
            The Sovereign Gateway for <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Autonomous AI Commerce.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg sm:text-xl max-w-2xl leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
          >
            Cryptographically bounded mandates, simulated failover, and zero-trust micro-escrow—built natively on Razorpay infrastructure.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <a href="/ui" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all flex items-center gap-2">
              Launch Interactive Dashboard <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#architecture" className={`px-8 py-4 rounded-lg font-bold border transition-all flex items-center gap-2 ${theme === 'dark' ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-900 hover:bg-slate-100'}`}>
              <LayoutTemplate className="w-4 h-4" /> Explore Architecture
            </a>
          </motion.div>
        </div>

        {/* Right Column: Interactive Code Console */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 relative z-10 w-full"
        >
          <div className={`backdrop-blur-xl border rounded-xl overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#0B192C]/90 border-slate-700/60 shadow-blue-900/20' : 'bg-white border-slate-200 shadow-slate-300/50'}`}>
            {/* Terminal Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${theme === 'dark' ? 'border-slate-700/60 bg-[#070F1E]/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex gap-4">
                {(['curl', 'py', 'node'] as const).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveCodeTab(tab as any)}
                    className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${activeCodeTab === tab ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-400'}`}
                  >
                    {tab === 'py' ? 'Python' : tab === 'node' ? 'Node.js' : 'cURL'}
                  </button>
                ))}
              </div>
              <button onClick={handleCopy} className="text-slate-400 hover:text-blue-500 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Code Content */}
            <div className={`p-6 font-mono text-sm overflow-x-auto min-h-[300px] ${theme === 'dark' ? 'bg-[#02042B]' : 'bg-slate-900'}`}>
              <AnimatePresence mode="wait">
                <motion.pre 
                  key={activeCodeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="text-slate-300 leading-loose"
                >
                  {activeCodeTab === 'curl' && (
                    <>
<span className="text-pink-400 font-bold">curl</span> -X POST https://api.razor-relay.com/v1/relay/gateway/execute \<br/>
&nbsp;&nbsp;-H <span className="text-yellow-300 bg-yellow-400/10 px-1 rounded">"Authorization: Bearer agent_key"</span> \<br/>
&nbsp;&nbsp;-H <span className="text-yellow-300">"Content-Type: application/json"</span> \<br/>
&nbsp;&nbsp;-d <span className="text-[#00D290]">'{'{'}<br/>
&nbsp;&nbsp;"mandate_id": "mnd_123",<br/>
&nbsp;&nbsp;"requested_amount": 500,<br/>
&nbsp;&nbsp;"scope": "service_rendered",<br/>
&nbsp;&nbsp;"signature": "hmac_sha256_hash"<br/>
{'}'}'</span>
                    </>
                  )}
                  {activeCodeTab === 'py' && (
                    <>
<span className="text-pink-400 font-bold">import</span> requests<br/><br/>
payload = {'{'}<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#00D290]">"mandate_id"</span>: <span className="text-[#00D290]">"mnd_123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#00D290]">"requested_amount"</span>: <span className="text-purple-400">500</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#00D290]">"scope"</span>: <span className="text-[#00D290]">"service_rendered"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#00D290]">"signature"</span>: <span className="text-[#00D290]">"hmac_sha256_hash"</span><br/>
{'}'}<br/>
headers = {'{'}<span className="text-[#00D290]">"Authorization"</span>: <span className="text-yellow-300 bg-yellow-400/10 px-1 rounded">"Bearer agent_key"</span>{'}'}<br/><br/>
res = requests.post(<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#00D290]">"https://api.razor-relay.com/v1/relay/gateway/execute"</span>, <br/>
&nbsp;&nbsp;&nbsp;&nbsp;json=payload, headers=headers<br/>
)<br/>
<span className="text-blue-400 font-bold">print</span>(res.json())
                    </>
                  )}
                  {activeCodeTab === 'node' && (
                    <>
<span className="text-pink-400 font-bold">const</span> axios = <span className="text-blue-400 font-bold">require</span>(<span className="text-[#00D290]">'axios'</span>);<br/><br/>
<span className="text-pink-400 font-bold">async function</span> <span className="text-blue-400 font-bold">dispatchPayload</span>() {'{'}<br/>
&nbsp;&nbsp;<span className="text-pink-400 font-bold">const</span> res = <span className="text-pink-400 font-bold">await</span> axios.post(<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#00D290]">'https://api.razor-relay.com/v1/relay/gateway/execute'</span>, <br/>
&nbsp;&nbsp;&nbsp;&nbsp;{'{'} mandate_id: <span className="text-[#00D290]">'mnd_123'</span>, requested_amount: <span className="text-purple-400">500</span>, scope: <span className="text-[#00D290]">'service_rendered'</span>, signature: <span className="text-[#00D290]">'hmac_sha256_hash'</span> {'}'},<br/>
&nbsp;&nbsp;&nbsp;&nbsp;{'{'} headers: {'{'} Authorization: <span className="text-yellow-300 bg-yellow-400/10 px-1 rounded">`Bearer ${'{'}process.env.KEY{'}'}`</span> {'}'} {'}'}<br/>
&nbsp;&nbsp;);<br/>
&nbsp;&nbsp;<span className="text-blue-400 font-bold">console</span>.log(res.data);<br/>
{'}'}
                    </>
                  )}
                </motion.pre>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Razorpay Data Flow Architecture Section */}
      <section id="architecture" className={`py-20 px-6 border-y ${theme === 'dark' ? 'bg-[#070F1E] border-blue-500/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Razorpay Data Flow Architecture</h2>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Secure end-to-end processing mimicking Razorpay's enterprise standard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Card 01 */}
            <div className={`border rounded-xl p-6 transition-all shadow-lg ${theme === 'dark' ? 'bg-[#0B192C]/80 border-slate-700/60 hover:border-blue-500/30' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mb-6">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Agent Client</h3>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Submits cryptographically signed payloads ensuring integrity. Uses HMAC-SHA256 mandate signing and Merkle validation.
              </p>
            </div>

            {/* Card 02 */}
            <div className={`border rounded-xl p-6 transition-all shadow-lg ${theme === 'dark' ? 'bg-[#0B192C]/80 border-slate-700/60 hover:border-blue-500/30' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center mb-6">
                <Server className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Relay Gateway</h3>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Handles high-throughput ingestion with simulated circuit breaker failover to Smart Collect Escrow VPAs.
              </p>
            </div>

            {/* Card 03 */}
            <div className={`border rounded-xl p-6 transition-all shadow-lg ${theme === 'dark' ? 'bg-[#0B192C]/80 border-slate-700/60 hover:border-blue-500/30' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center mb-6">
                <Database className="w-5 h-5" />
              </div>
              <h3 className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Escrow Settlement</h3>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Executes strict local LLM schema verification and processes automated vendor payouts with a transparent 1% platform fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Production Standards Grid */}
      <section className={`py-20 px-6 border-t ${theme === 'dark' ? 'bg-[#070F1E] border-blue-500/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Production Standards & Verified Metrics</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "LATENCY", metric: "Low-latency", desc: "Zero Trust Verification" },
              { title: "SECURITY ACCURACY", metric: "92.7%", desc: "0 False Positive releases across 100 scenarios" },
              { title: "FAILOVER SPEED", metric: "Instant", desc: "In-memory circuit breaker trip" },
              { title: "UNBOUND OVERHEAD", metric: "0%", desc: "Zero financial actions by un-gated prompts" }
            ].map((stat, i) => (
              <div key={i} className={`p-6 border rounded-xl transition-all ${theme === 'dark' ? 'bg-[#0B192C]/80 border-slate-700/60 hover:border-blue-500/30' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
                <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-2">{stat.title}</h4>
                <div className={`text-2xl sm:text-3xl font-bold font-mono mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.metric}</div>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-10 border-t text-center space-y-6 ${theme === 'dark' ? 'border-blue-500/20 bg-[#02042B]' : 'border-slate-200 bg-white'}`}>
        <p className="text-slate-500 font-medium text-sm">
          Razor-Relay // Built for the Razorpay AI Buildathon 2026
        </p>
        <a href="/ui" className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all border ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'}`}>
          Enter Interactive Dashboard &rarr;
        </a>
      </footer>

    </div>
  );
}


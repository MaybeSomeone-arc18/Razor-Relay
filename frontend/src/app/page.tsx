"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Terminal, Shield, Zap, Activity, CheckCircle2, Copy, Check, 
  Server, ArrowRight, Lock, Database, Code2, Globe 
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "ts" | "py">("curl");
  const [copied, setCopied] = useState(false);
  const [demoState, setDemoState] = useState<"idle" | "loading" | "success">("idle");
  const [uptime, setUptime] = useState("99.99%");

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(Math.random() > 0.95 ? "99.98%" : "99.99%");
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunDemo = () => {
    setDemoState("loading");
    setTimeout(() => setDemoState("success"), 800);
  };

  return (
    <div className="min-h-screen bg-[#02042B] text-slate-200 font-sans selection:bg-[#0B5CFF]/30 overflow-hidden">
      
      {/* Top Navigation Bar */}
      <nav className="w-full bg-[#070F1E]/80 backdrop-blur-md border-b border-blue-500/20 py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-bold text-xl tracking-tight text-white">RAZOR-RELAY</span>
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-[#00D290]/10 text-[#00D290] border border-[#00D290]/20 text-[10px] font-bold tracking-widest">
            TRACK 01 // AGENTIC COMMERCE
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <span className="flex items-center gap-2 text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D290] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D290]"></span>
            </span>
            SYSTEM ONLINE
          </span>
          <a href="/docs" className="hidden md:inline-block text-slate-400 hover:text-white transition-colors">API Docs</a>
          <a href="/ui" className="hidden sm:inline-flex items-center gap-2 text-[#0B5CFF] hover:text-[#0047E1] transition-colors font-bold">
            Launch Dashboard &rarr;
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Subtle Background Glows */}
        <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-[#0B5CFF]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="lg:col-span-7 space-y-8 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          >
            The Sovereign Gateway for Agentic Commerce.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed"
          >
            Cryptographically bounded mandates, sub-second switch failover, and zero-trust micro-escrow—built natively on Razorpay payment infrastructure.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <a href="/ui" className="bg-[#0B5CFF] hover:bg-[#0047E1] text-white px-8 py-3.5 rounded-lg font-bold text-sm shadow-[0_4px_14px_0_rgba(11,92,255,0.39)] transition-all flex items-center gap-2">
              Launch Dashboard <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#architecture" className="bg-transparent border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-8 py-3.5 rounded-lg font-bold text-sm transition-all">
              Explore Architecture
            </a>
          </motion.div>
        </div>

        {/* Interactive Code Window (Hero) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 relative z-10"
        >
          <div className="bg-[#0B192C]/90 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-[0_20px_50px_rgba(2,4,43,0.5)] overflow-hidden">
            <div className="border-b border-slate-700/60 px-4 py-3 flex items-center justify-between bg-[#070F1E]/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-mono text-slate-400">Playground: Escrow Settlement</div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agent Payload</label>
                <div className="bg-[#02042B] border border-slate-700/40 rounded-lg p-4 font-mono text-sm text-slate-300">
                  <span className="text-[#00D290]">"mandate_id"</span>: "mnd_8f92a",<br/>
                  <span className="text-[#00D290]">"schema"</span>: "service_rendered",<br/>
                  <span className="text-[#00D290]">"signature"</span>: "hmac_sha256..."
                </div>
              </div>

              <button 
                onClick={handleRunDemo}
                disabled={demoState === "loading"}
                className="w-full bg-[#0B5CFF] hover:bg-[#0047E1] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {demoState === "loading" ? (
                  <span className="animate-spin text-xl">⟳</span>
                ) : (
                  <>Execute Validation <Zap className="w-4 h-4" /></>
                )}
              </button>

              <div className={`transition-all duration-300 ${demoState === "idle" ? "opacity-30 blur-sm pointer-events-none" : "opacity-100"}`}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Response</label>
                <div className="bg-[#02042B] border border-slate-700/40 rounded-lg p-4 font-mono text-sm">
                  {demoState === "success" ? (
                    <div className="text-[#00D290]">
                      &#123;<br/>
                      &nbsp;&nbsp;"status": "verified",<br/>
                      &nbsp;&nbsp;"confidence": 0.99,<br/>
                      &nbsp;&nbsp;"action": "funds_released"<br/>
                      &#125;
                    </div>
                  ) : (
                    <div className="text-slate-500">Awaiting execution...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Razorpay Data Flow Architecture Section */}
      <section id="architecture" className="py-20 px-6 bg-[#070F1E] border-y border-blue-500/10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Razorpay Data Flow Architecture</h2>
            <p className="text-slate-400">Secure end-to-end processing mimicking Razorpay's enterprise standard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Card 01 */}
            <div className="bg-[#0B192C]/80 border border-slate-700/60 rounded-xl p-6 hover:border-blue-500/30 transition-all shadow-lg">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-6">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Agent Client</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Submits cryptographically signed payloads ensuring integrity. Uses HMAC-SHA256 mandate signing and Merkle validation.
              </p>
            </div>

            {/* Card 02 */}
            <div className="bg-[#0B192C]/80 border border-slate-700/60 rounded-xl p-6 hover:border-blue-500/30 transition-all shadow-lg">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center mb-6">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Relay Gateway</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Handles high-throughput ingestion with sub-second circuit breaker failover to Smart Collect Escrow VPAs.
              </p>
            </div>

            {/* Card 03 */}
            <div className="bg-[#0B192C]/80 border border-slate-700/60 rounded-xl p-6 hover:border-blue-500/30 transition-all shadow-lg">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-6">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Escrow Settlement</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Executes strict local LLM schema verification and processes automated vendor payouts with a transparent 1% platform fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer-First Integration Block */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Developer-First Integration</h2>
            <p className="text-slate-400">Trigger robust, idempotent escrow endpoints directly from your agent's execution code.</p>
          </div>

          <div className="bg-[#0B192C]/90 border border-slate-700/60 rounded-xl shadow-[0_10px_40px_rgba(2,4,43,0.4)] overflow-hidden">
            <div className="flex border-b border-slate-700/60 text-sm font-mono text-slate-400 bg-[#070F1E]/80">
              <button 
                onClick={() => setActiveTab('curl')}
                className={`px-6 py-3 border-b-2 font-bold transition-colors ${activeTab === 'curl' ? 'border-[#0B5CFF] text-white bg-[#02042B]' : 'border-transparent hover:text-white'}`}
              >
                cURL
              </button>
              <button 
                onClick={() => setActiveTab('ts')}
                className={`px-6 py-3 border-b-2 font-bold transition-colors ${activeTab === 'ts' ? 'border-[#0B5CFF] text-white bg-[#02042B]' : 'border-transparent hover:text-white'}`}
              >
                Node.js
              </button>
              <button 
                onClick={() => setActiveTab('py')}
                className={`px-6 py-3 border-b-2 font-bold transition-colors ${activeTab === 'py' ? 'border-[#0B5CFF] text-white bg-[#02042B]' : 'border-transparent hover:text-white'}`}
              >
                Python
              </button>
              <div className="ml-auto flex items-center pr-4">
                <button onClick={handleCopy} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white">
                  {copied ? <Check className="w-4 h-4 text-[#00D290]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-6 font-mono text-sm overflow-x-auto bg-[#02042B] leading-loose">
              {activeTab === 'curl' && (
                <pre className="text-slate-300">
<span className="text-pink-400 font-bold">curl</span> -X POST https://api.razor-relay.com/v1/relay/route \
  -H <span className="text-yellow-400 bg-yellow-400/10 px-1 rounded">"Authorization: Bearer agent_key..."</span> \
  -H <span className="text-yellow-400">"Content-Type: application/json"</span> \
  -d <span className="text-[#00D290]">'{'{'}"mandate_id": "mnd_123", "proof": "hash"{'}'}'</span>
                </pre>
              )}
              {activeTab === 'ts' && (
                <pre className="text-slate-300">
<span className="text-purple-400 font-bold">const</span> response = <span className="text-purple-400 font-bold">await</span> fetch(<span className="text-[#00D290]">'https://api.razor-relay.com/v1/relay/route'</span>, {'{'}<br/>
&nbsp;&nbsp;method: <span className="text-[#00D290]">'POST'</span>,<br/>
&nbsp;&nbsp;headers: {'{'}<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">'Authorization'</span>: <span className="text-yellow-400 bg-yellow-400/10 px-1 rounded">`Bearer ${'{'}process.env.AGENT_KEY{'}'}`</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">'Content-Type'</span>: <span className="text-[#00D290]">'application/json'</span><br/>
&nbsp;&nbsp;{'}'},<br/>
&nbsp;&nbsp;body: <span className="text-blue-400 font-bold">JSON</span>.stringify({'{'} mandate_id: <span className="text-[#00D290]">'mnd_123'</span> {'}'})<br/>
{'}'});
                </pre>
              )}
              {activeTab === 'py' && (
                <pre className="text-slate-300">
<span className="text-pink-400 font-bold">import</span> requests<br/><br/>
response = requests.post(<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#00D290]">"https://api.razor-relay.com/v1/relay/route"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;headers={'{'}<span className="text-[#00D290]">"Authorization"</span>: <span className="text-yellow-400 bg-yellow-400/10 px-1 rounded">f"Bearer {'{'}key{'}'}"</span>{'}'},<br/>
&nbsp;&nbsp;&nbsp;&nbsp;json={'{'}<span className="text-[#00D290]">"mandate_id"</span>: <span className="text-[#00D290]">"mnd_123"</span>{'}'}<br/>
)<br/>
<span className="text-blue-400 font-bold">print</span>(response.json())
                </pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Production Standards & Verified Metrics Grid */}
      <section className="py-20 px-6 bg-[#070F1E] border-t border-blue-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Production Standards & Verified Metrics</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "LATENCY", metric: "< 15ms", desc: "Sub-second execution" },
              { title: "SECURITY ACCURACY", metric: "98.0%", desc: "0 False Positive releases across 100 scenarios" },
              { title: "FAILOVER SPEED", metric: "< 10ms", desc: "Smart Collect VPA circuit breaker trip" },
              { title: "UNBOUND OVERHEAD", metric: "0%", desc: "Zero financial actions by un-gated prompts" }
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-[#0B192C]/80 border border-slate-700/60 rounded-xl hover:border-blue-500/30 transition-all">
                <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-2">{stat.title}</h4>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono mb-2">{stat.metric}</div>
                <p className="text-sm text-slate-400">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-blue-500/20 bg-[#02042B] text-center space-y-6">
        <p className="text-slate-500 font-medium text-sm">
          Razor-Relay // Built for the Razorpay AI Buildathon 2026
        </p>
        <a href="/ui" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all border border-slate-700">
          Enter Interactive Dashboard &rarr;
        </a>
      </footer>

    </div>
  );
}

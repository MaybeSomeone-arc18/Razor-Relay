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

  // Fake telemetry updates
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
    <div className="min-h-screen bg-[#0B0D12] text-neutral-200 font-sans selection:bg-[#00FF88]/30 overflow-hidden">
      
      {/* Telemetry Bar */}
      <div className="w-full bg-[#131620] border-b border-neutral-800/50 py-2 px-6 flex items-center justify-between text-xs font-mono tracking-widest sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-neutral-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]"></span>
            </span>
            SYSTEM ONLINE
          </span>
          <span className="text-neutral-500 hidden sm:inline-block">| UPTIME: {uptime}</span>
          <span className="text-neutral-500 hidden md:inline-block">| LATENCY: 12ms</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/ui" className="text-neutral-400 hover:text-white transition-colors">DASHBOARD &rarr;</a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00FF88]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="lg:col-span-7 space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-900/50 rounded-full px-4 py-1.5 text-xs font-mono text-neutral-300 backdrop-blur-md"
          >
            <Shield className="w-4 h-4 text-[#00FF88]" />
            ZERO-TRUST ESCROW GATEWAY
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-medium tracking-tight text-white leading-[1.05]"
          >
            Sovereign Agentic <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">Commerce.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-neutral-400 max-w-xl font-light leading-relaxed"
          >
            Cryptographically bounded mandates, deterministic Python verifiers, and zero-trust micro-escrow—built natively on Razorpay infrastructure.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <a href="/ui" className="bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm hover:bg-neutral-200 transition-colors flex items-center gap-2">
              Launch Dashboard <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#architecture" className="border border-neutral-800 bg-neutral-900/30 backdrop-blur-md px-8 py-3.5 rounded-full font-medium text-sm text-white hover:bg-neutral-800 transition-colors">
              Explore Architecture
            </a>
          </motion.div>
        </div>

        {/* Live Demo Playground */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 relative z-10"
        >
          <div className="bg-[#131620]/80 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="border-b border-neutral-800 p-4 flex items-center justify-between bg-neutral-900/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-mono text-neutral-300">Live Escrow Settlement</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-500 uppercase">Agent Payload</label>
                <div className="bg-black/50 border border-neutral-800 rounded-lg p-3 font-mono text-sm text-neutral-300">
                  <span className="text-blue-400">"mandate_id"</span>: "mnd_8f92a",<br/>
                  <span className="text-blue-400">"schema"</span>: "service_rendered",<br/>
                  <span className="text-blue-400">"signature"</span>: "hmac_sha256..."
                </div>
              </div>

              <button 
                onClick={handleRunDemo}
                disabled={demoState === "loading"}
                className="w-full bg-[#00FF88] hover:bg-[#00E077] text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {demoState === "loading" ? (
                  <span className="animate-spin text-xl">⟳</span>
                ) : (
                  <>Execute Validation <Zap className="w-4 h-4" /></>
                )}
              </button>

              <div className={`transition-all duration-300 ${demoState === "idle" ? "opacity-30 blur-sm pointer-events-none" : "opacity-100"}`}>
                <label className="text-xs font-mono text-neutral-500 uppercase mb-2 block">Response</label>
                <div className="bg-black/50 border border-neutral-800 rounded-lg p-4 font-mono text-sm">
                  {demoState === "success" ? (
                    <div className="text-green-400">
                      &#123;<br/>
                      &nbsp;&nbsp;"status": "verified",<br/>
                      &nbsp;&nbsp;"confidence": 0.99,<br/>
                      &nbsp;&nbsp;"action": "funds_released"<br/>
                      &#125;
                    </div>
                  ) : (
                    <div className="text-neutral-500">Awaiting execution...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Interactive Architecture Map */}
      <section id="architecture" className="py-24 px-6 border-t border-neutral-800/50 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-medium tracking-tight text-white">Zero-Trust Data Flow</h2>
            <p className="text-neutral-400">Hover over system nodes to view execution latency and security protocols.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-4xl mx-auto">
            {/* Node 1 */}
            <div className="group relative bg-[#131620] border border-neutral-800 rounded-2xl p-6 hover:border-neutral-600 transition-colors cursor-crosshair">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Agent Client</h3>
              <p className="text-sm text-neutral-400">Submits cryptographically signed payloads.</p>
              
              {/* Hover Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
                HMAC-SHA256 Auth &middot; 24h Nonce
              </div>
            </div>

            {/* Node 2 */}
            <div className="group relative bg-[#131620] border border-neutral-800 rounded-2xl p-6 hover:border-neutral-600 transition-colors cursor-crosshair shadow-[0_0_30px_rgba(0,255,136,0.05)] border-t-[#00FF88]/20">
              <div className="w-12 h-12 rounded-xl bg-[#00FF88]/10 flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-[#00FF88]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Relay Core</h3>
              <p className="text-sm text-neutral-400">Validates HMAC constraints and triggers LLM routing.</p>
              
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
                Latency: &lt;15ms
              </div>
            </div>

            {/* Node 3 */}
            <div className="group relative bg-[#131620] border border-neutral-800 rounded-2xl p-6 hover:border-neutral-600 transition-colors cursor-crosshair">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Escrow State</h3>
              <p className="text-sm text-neutral-400">Deterministic payouts via Razorpay API & Redis WAL.</p>
              
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
                Redis WAL (Write-Ahead Log)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code / API Console */}
      <section className="py-24 px-6 bg-[#090A0F]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-medium tracking-tight text-white">Developer First.</h2>
            <p className="text-neutral-400 text-lg">Integrate the escrow gateway into your agent's execution loop with a single API call.</p>
            <ul className="space-y-3 pt-4">
              {['Idempotent execution', 'Pre-flight injection shield', 'Strict schema validation'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF88]" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#131620] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex border-b border-neutral-800 text-sm font-mono text-neutral-400 bg-neutral-900/50">
              <button 
                onClick={() => setActiveTab('curl')}
                className={`px-4 py-3 border-b-2 transition-colors ${activeTab === 'curl' ? 'border-[#00FF88] text-white bg-black/20' : 'border-transparent hover:text-white'}`}
              >
                cURL
              </button>
              <button 
                onClick={() => setActiveTab('ts')}
                className={`px-4 py-3 border-b-2 transition-colors ${activeTab === 'ts' ? 'border-[#00FF88] text-white bg-black/20' : 'border-transparent hover:text-white'}`}
              >
                TypeScript
              </button>
              <button 
                onClick={() => setActiveTab('py')}
                className={`px-4 py-3 border-b-2 transition-colors ${activeTab === 'py' ? 'border-[#00FF88] text-white bg-black/20' : 'border-transparent hover:text-white'}`}
              >
                Python
              </button>
              <div className="ml-auto flex items-center pr-2">
                <button onClick={handleCopy} className="p-2 hover:bg-neutral-800 rounded-md transition-colors">
                  {copied ? <Check className="w-4 h-4 text-[#00FF88]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-6 font-mono text-sm overflow-x-auto">
              {activeTab === 'curl' && (
                <pre className="text-neutral-300">
<span className="text-pink-400">curl</span> -X POST https://api.razor-relay.com/v1/settle \<br/>
  -H <span className="text-yellow-300">"Authorization: Bearer agent_key..."</span> \<br/>
  -H <span className="text-yellow-300">"Content-Type: application/json"</span> \<br/>
  -d <span className="text-green-300">'{'{'}"mandate_id": "mnd_123", "proof": "hash"{'}'}'</span>
                </pre>
              )}
              {activeTab === 'ts' && (
                <pre className="text-neutral-300">
<span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> fetch(<span className="text-green-300">'https://api.razor-relay.com/v1/settle'</span>, {'{'}<br/>
&nbsp;&nbsp;method: <span className="text-green-300">'POST'</span>,<br/>
&nbsp;&nbsp;headers: {'{'}<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">'Authorization'</span>: <span className="text-green-300">`Bearer ${'{'}process.env.AGENT_KEY{'}'}`</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">'Content-Type'</span>: <span className="text-green-300">'application/json'</span><br/>
&nbsp;&nbsp;{'}'},<br/>
&nbsp;&nbsp;body: <span className="text-blue-400">JSON</span>.stringify({'{'} mandate_id: <span className="text-green-300">'mnd_123'</span> {'}'})<br/>
{'}'});
                </pre>
              )}
              {activeTab === 'py' && (
                <pre className="text-neutral-300">
<span className="text-pink-400">import</span> requests<br/><br/>
response = requests.post(<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-green-300">"https://api.razor-relay.com/v1/settle"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;headers={'{'}<span className="text-green-300">"Authorization"</span>: <span className="text-green-300">f"Bearer {'{'}key{'}'}"</span>{'}'},<br/>
&nbsp;&nbsp;&nbsp;&nbsp;json={'{'}<span className="text-green-300">"mandate_id"</span>: <span className="text-green-300">"mnd_123"</span>{'}'}<br/>
)<br/>
<span className="text-blue-400">print</span>(response.json())
                </pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Security Grid */}
      <section className="py-24 px-6 border-t border-neutral-800/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-medium tracking-tight text-white mb-4">Production Standards</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">Built for enterprise compliance, ensuring every autonomous action is bounded, authenticated, and logged.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "HMAC-SHA256 Auth", desc: "Cryptographically verifiable agent identity.", icon: <Lock className="w-5 h-5" /> },
              { title: "Upstash Redis WAL", desc: "Immutable state tracking and nonce replay protection.", icon: <Database className="w-5 h-5" /> },
              { title: "Concurrency Locks", desc: "SETNX Redis locks prevent settlement race conditions.", icon: <Activity className="w-5 h-5" /> },
              { title: "Injection Shield", desc: "Pre-flight Regex layer catches LLM bypass attempts.", icon: <Shield className="w-5 h-5" /> }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-[#131620] border border-neutral-800 rounded-2xl hover:bg-neutral-900 transition-colors">
                <div className="text-[#00FF88] mb-4">{feature.icon}</div>
                <h4 className="text-white font-medium mb-2">{feature.title}</h4>
                <p className="text-sm text-neutral-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

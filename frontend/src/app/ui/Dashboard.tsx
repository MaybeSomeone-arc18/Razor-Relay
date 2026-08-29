"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, Search, Zap, Shield, ArrowUpRight, 
  Settings, User, FileText, Code2, Server, Sun, Moon
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'logs' | 'policies' | 'keys' | 'profile' | 'settings'>('telemetry');
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const [apiKey, setApiKey] = useState('rzp_live_super_secret_key_12345');

  const generateApiKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomKey = Array.from({ length: 24 }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    setApiKey(`rzp_live_${randomKey}`);
    setActiveTab('keys');
    setOpen(false);
  };

  const exportLogsCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,TIMESTAMP,MANDATE ID,AGENT IP,STATUS,FEE\nJust now,mnd_9f82b,192.168.1.104,SETTLED,5.00\n2s ago,mnd_4a11c,10.0.0.45,AUTHORIZED,12.00\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "escrow_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveTab('logs');
    setOpen(false);
  };

  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const testWebhook = () => {
    setWebhookStatus("Testing connection...");
    setTimeout(() => {
      setWebhookStatus("200 OK - Test payload delivered successfully.");
      setTimeout(() => setWebhookStatus(null), 3000);
    }, 800);
  };

  const [activeRequests, setActiveRequests] = useState(142);
  const [volume, setVolume] = useState(12500);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem('razorpay_theme');
    if (saved === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'razorpay_theme') {
        const newTheme = e.newValue || 'dark';
        setTheme(newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('razorpay_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Command Palette listener
  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        if (e.repeat) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const [metrics, setMetrics] = useState({
    total_gmv_processed: 0,
    fraud_attacks_blocked: 0,
    merchant_uptime_percent: 100
  });

  // Real telemetry updates from backend
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("http://localhost:8000/v1/relay/metrics", {
          headers: { "X-Admin-Key": "demo_admin_key" }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
          setVolume(data.total_gmv_processed);
          setActiveRequests(Math.floor(Math.random() * 20) + 120); // Simulated active requests based on load
        }
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#02042B] text-slate-900 dark:text-neutral-200 font-sans selection:bg-emerald-500/30 dark:selection:bg-[#00FF88]/30">
      
      {/* Top Navbar */}
      <nav className="h-16 bg-white dark:bg-[#0B192C]/80 backdrop-blur-md border-b border-slate-200 dark:border-blue-500/20 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <a href="/" className="font-serif text-xl tracking-wide text-slate-900 dark:text-white hover:text-emerald-600 dark:text-[#00FF88] transition-colors">
            RAZOR-RELAY
          </a>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-blue-500/20 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            DASHBOARD
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-blue-500/20 rounded-md text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:border-slate-300 dark:border-blue-500/30 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 rounded bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              {isMac ? <><span className="text-xs">⌘</span>K</> : <><span className="text-xs">Ctrl</span> + K</>}
            </kbd>
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-[#00FF88] opacity-80 cursor-pointer hover:opacity-100 transition-opacity" />
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-mono text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider mb-2">Overview</h3>
            <button 
              onClick={() => setActiveTab('telemetry')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'telemetry' ? 'bg-slate-100 dark:bg-[#0F172A] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/50 dark:bg-[#0F172A]/50'}`}
            >
              <Activity className={`w-4 h-4 ${activeTab === 'telemetry' ? 'text-emerald-600 dark:text-[#00FF88]' : ''}`} />
              Live Telemetry
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'logs' ? 'bg-slate-100 dark:bg-[#0F172A] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/50 dark:bg-[#0F172A]/50'}`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'logs' ? 'text-emerald-600 dark:text-[#00FF88]' : ''}`} />
              Escrow Logs
            </button>
            <button 
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'policies' ? 'bg-slate-100 dark:bg-[#0F172A] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/50 dark:bg-[#0F172A]/50'}`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'policies' ? 'text-emerald-600 dark:text-[#00FF88]' : ''}`} />
              Security Policies
            </button>
          </div>
          
          <div className="space-y-1 pt-4 border-t border-slate-200 dark:border-blue-500/20/50">
            <h3 className="text-xs font-mono text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider mb-2">Settings</h3>
            <button 
              onClick={() => setActiveTab('keys')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'keys' ? 'bg-slate-100 dark:bg-[#0F172A] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/50 dark:bg-[#0F172A]/50'}`}
            >
              <Code2 className={`w-4 h-4 ${activeTab === 'keys' ? 'text-emerald-600 dark:text-[#00FF88]' : ''}`} />
              API Keys
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-slate-100 dark:bg-[#0F172A] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/50 dark:bg-[#0F172A]/50'}`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-emerald-600 dark:text-[#00FF88]' : ''}`} />
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-slate-100 dark:bg-[#0F172A] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/50 dark:bg-[#0F172A]/50'}`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-emerald-600 dark:text-[#00FF88]' : ''}`} />
              System Config
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-8">
          
          {activeTab === 'telemetry' && (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF88]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Volume</span>
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-[#00FF88] bg-emerald-100 dark:bg-[#00FF88]/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" /> +12%
                    </span>
                  </div>
                  <div className="text-3xl font-mono text-slate-900 dark:text-white relative z-10">
                    ₹{volume.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Requests</span>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                  </div>
                  <div className="text-3xl font-mono text-slate-900 dark:text-white relative z-10">
                    {activeRequests} <span className="text-sm text-slate-400 dark:text-slate-500">/sec</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Security Score</span>
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-[#00FF88]" />
                  </div>
                  <div className="text-3xl font-mono text-slate-900 dark:text-white relative z-10">
                    {metrics.merchant_uptime_percent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">{metrics.fraud_attacks_blocked} ATTACKS BLOCKED</div>
                </div>

              </div>

              {/* Real-time Data Table */}
              <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-slate-200 dark:border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    Live Escrow Logs
                  </h3>
                  <button className="text-xs font-mono bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 px-3 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors">
                    FILTER
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-[#0F172A]/50 text-xs font-mono text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-blue-500/20">
                        <th className="p-4 font-normal">TIMESTAMP</th>
                        <th className="p-4 font-normal">MANDATE ID</th>
                        <th className="p-4 font-normal">SCHEMA</th>
                        <th className="p-4 font-normal">STATUS</th>
                        <th className="p-4 font-normal text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { id: "mnd_9f82b", schema: "service_rendered", status: "VERIFIED", amt: 500, time: "Just now", color: "text-emerald-600 dark:text-[#00FF88]" },
                        { id: "mnd_4a11c", schema: "payment_confirmed", status: "PENDING", amt: 1200, time: "2s ago", color: "text-blue-400" },
                        { id: "mnd_7x99d", schema: "data_delivery", status: "BLOCKED", amt: 350, time: "12s ago", color: "text-red-400" },
                        { id: "mnd_2q88a", schema: "service_rendered", status: "VERIFIED", amt: 890, time: "45s ago", color: "text-emerald-600 dark:text-[#00FF88]" },
                      ].map((row, i) => (
                        <motion.tr 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="border-b border-slate-200 dark:border-blue-500/20/50 hover:bg-slate-50 dark:bg-[#0F172A]/30 transition-colors"
                        >
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{row.time}</td>
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{row.id}</td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">{row.schema}</td>
                          <td className="p-4">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded border border-current ${row.color} bg-current/[0.05]`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-900 dark:text-white">₹{row.amt}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl overflow-hidden shadow-lg min-h-[500px]">
              <div className="p-5 border-b border-slate-200 dark:border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-[#0F172A]/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-[#00FF88]" />
                    Audit Logs
                  </h3>
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search mandates..." className="bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#00FF88] text-slate-900 dark:text-white w-full sm:w-64" />
                  </div>
                </div>
                <button onClick={exportLogsCSV} className="text-xs font-mono bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 px-3 py-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors">
                  EXPORT CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-[#0F172A]/50 text-xs font-mono text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-blue-500/20">
                      <th className="p-4 font-normal">TIMESTAMP</th>
                      <th className="p-4 font-normal">MANDATE ID</th>
                      <th className="p-4 font-normal">AGENT IP</th>
                      <th className="p-4 font-normal">STATUS</th>
                      <th className="p-4 font-normal text-right">FEE</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { id: "mnd_9f82b", ip: "192.168.1.104", status: "SETTLED", fee: "₹5.00", time: "Just now", color: "text-emerald-600 dark:text-[#00FF88]" },
                      { id: "mnd_4a11c", ip: "10.0.0.45", status: "AUTHORIZED", fee: "₹12.00", time: "2s ago", color: "text-blue-400" },
                      { id: "mnd_7x99d", ip: "172.16.254.1", status: "SIGNATURE_INVALID", fee: "₹0.00", time: "12s ago", color: "text-red-400" },
                      { id: "mnd_2q88a", ip: "192.168.1.104", status: "SETTLED", fee: "₹8.90", time: "45s ago", color: "text-emerald-600 dark:text-[#00FF88]" },
                      { id: "mnd_8b22x", ip: "10.0.0.12", status: "SETTLED", fee: "₹1.50", time: "1m ago", color: "text-emerald-600 dark:text-[#00FF88]" },
                      { id: "mnd_3p11z", ip: "172.16.254.3", status: "PROMPT_INJECTION", fee: "₹0.00", time: "3m ago", color: "text-red-400" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-200 dark:border-blue-500/20/50 hover:bg-slate-50 dark:bg-[#0F172A]/30 transition-colors">
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{row.time}</td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{row.id}</td>
                        <td className="p-4 font-mono text-slate-400 dark:text-slate-500 text-xs">{row.ip}</td>
                        <td className="p-4">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded border border-current ${row.color} bg-current/[0.05]`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-900 dark:text-white">{row.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-6">Active Security Modules</h2>
              
              <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-[#00FF88]" />
                    Zero-Vibe Verification
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                    Strict deterministic execution. AI agents are restricted to schema routing only. All cryptographic proofs and logic boundaries are verified purely in Python to eliminate Prompt Injection exploits.
                  </p>
                </div>
                <div className="bg-emerald-100 dark:bg-[#00FF88]/10 text-emerald-600 dark:text-[#00FF88] border border-emerald-200 dark:border-[#00FF88]/20 px-3 py-1 rounded-full text-xs font-mono font-medium">
                  ENFORCED
                </div>
              </div>

              <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mb-1">
                    <Code2 className="w-4 h-4 text-emerald-600 dark:text-[#00FF88]" />
                    HMAC Canonical Signatures
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                    All mandate payloads are recursively serialized into cross-language canonical JSON before signing. This prevents float-to-integer deserialization attacks and cryptographically binds the exact spending limits.
                  </p>
                </div>
                <div className="bg-emerald-100 dark:bg-[#00FF88]/10 text-emerald-600 dark:text-[#00FF88] border border-emerald-200 dark:border-[#00FF88]/20 px-3 py-1 rounded-full text-xs font-mono font-medium">
                  ENFORCED
                </div>
              </div>

              <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-[#00FF88]" />
                    Live Telemetry Circuit Breaker
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                    Actively monitors Razorpay API health via Redis. Automatically fails over to Smart Collect Virtual Accounts if the primary UPI Direct gateway latency spikes or errors exceed 5%.
                  </p>
                </div>
                <div className="bg-emerald-100 dark:bg-[#00FF88]/10 text-emerald-600 dark:text-[#00FF88] border border-emerald-200 dark:border-[#00FF88]/20 px-3 py-1 rounded-full text-xs font-mono font-medium">
                  ACTIVE
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-8 shadow-lg max-w-2xl">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">API Keys</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Manage your Razor-Relay symmetric keys. These keys are used to authenticate your agent fleet when submitting signed mandates.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Production Admin Key</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="password" 
                      value={apiKey} 
                      disabled
                      className="flex-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 rounded-lg px-4 py-2 text-slate-900 dark:text-white font-mono text-sm opacity-50"
                    />
                    <button className="px-4 py-2 bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Never commit this key to GitHub. Use it to instantiate the RelayClient in your agent's environment.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-blue-500/20/50">
                  <button onClick={generateApiKey} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium transition-colors">
                    Rotate Keys
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-8 shadow-lg max-w-2xl">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-6">User Profile</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Name</label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Email</label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">admin@razor-relay.com</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Role</label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-3 py-1 rounded-full inline-block">Super Administrator</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl p-8 shadow-lg max-w-2xl">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-6">System Configuration</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Environment</label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Production (Live)</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Webhook URL</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" defaultValue="https://api.razor-relay.com/webhook" className="flex-1 bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500/60" />
                    <button onClick={testWebhook} className="px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                      Test Link
                    </button>
                  </div>
                  {webhookStatus && (
                    <p className={`text-xs mt-2 font-mono ${webhookStatus.includes('200') ? 'text-emerald-500 dark:text-[#00FF88]' : 'text-slate-500 dark:text-slate-400'}`}>
                      {webhookStatus}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Failover Threshold</label>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={5} className="w-24 bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500/60" />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </main>
      </div>

      {/* Command Palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setActiveTab('telemetry'); setOpen(false); }}><Activity className="mr-2 h-4 w-4" /> View Live Telemetry</CommandItem>
            <CommandItem onSelect={exportLogsCSV}><FileText className="mr-2 h-4 w-4" /> Export Escrow Logs</CommandItem>
            <CommandItem onSelect={generateApiKey}><Code2 className="mr-2 h-4 w-4" /> Generate API Key</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => { setActiveTab('profile'); setOpen(false); }}><User className="mr-2 h-4 w-4" /> Profile</CommandItem>
            <CommandItem onSelect={() => { setActiveTab('settings'); setOpen(false); }}><Settings className="mr-2 h-4 w-4" /> System Configuration</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

    </div>
  );
}

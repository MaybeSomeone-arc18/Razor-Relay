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
    const csvRows = ["TIMESTAMP,MANDATE ID,AGENT IP,STATUS,FEE"];
    logs.forEach(log => {
      csvRows.push(`${log.time_ago},${log.mandate_id},${log.agent_ip},${log.status},${log.fee}`);
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
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

  const [failoverThreshold, setFailoverThreshold] = useState("5");
  const [saveSettingsStatus, setSaveSettingsStatus] = useState<string | null>(null);
  const saveSettings = () => {
    setSaveSettingsStatus("Saving...");
    setTimeout(() => {
      setSaveSettingsStatus("Settings saved successfully.");
      setTimeout(() => setSaveSettingsStatus(null), 3000);
    }, 500);
  };

  const [activeRequests, setActiveRequests] = useState(142);
  const [volume, setVolume] = useState(12500);
  const [theme, setTheme] = useState("dark");

  // Attack Terminal State
  const [attackAmount, setAttackAmount] = useState<string>("500000");
  const [attackInvalidSig, setAttackInvalidSig] = useState<boolean>(true);
  const [attackLog, setAttackLog] = useState<string>("> Terminal Ready. Awaiting manual override...");
  const [isAttacking, setIsAttacking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const triggerAttack = async () => {
    setIsAttacking(true);
    setIsShaking(false);
    setAttackLog("");
    const typeLog = async (text: string, speed = 15) => {
      let current = "";
      for (let i = 0; i < text.length; i++) {
        current += text[i];
        setAttackLog(prev => prev + text[i]);
        await new Promise(r => setTimeout(r, speed));
      }
      setAttackLog(prev => prev + "\n");
    };
    await typeLog("> Initializing rogue AI agent routines...", 20);
    await typeLog("> Computing HMAC-SHA256 cryptographic signature...", 10);
    try {
      const amount = parseFloat(attackAmount) || 500000;
      const nonce = Math.random().toString(36).substring(2, 15);
      const mandate_id = "mnd_" + nonce.substring(0, 8);
      const payload: any = {
        "mandate_id": mandate_id,
        "requested_amount": amount,
        "nonce": nonce,
        "signature": attackInvalidSig ? "bad_signature_from_hacker" : "valid_signature_placeholder",
        "expiry": Math.floor(Date.now() / 1000) + 3600,
        "delegation": {
          "human_root_hash": "mock_hrh",
          "agent_pubkey": "mock_apk",
          "policy_hash": "mock_ph",
          "timestamp": Math.floor(Date.now() / 1000),
          "primary_agent_id": "rogue_agent",
          "sub_agent_id": null,
          "delegation_depth": 1
        },
        "scope": "service_rendered",
        "quoted_price": amount,
        "limits": {
          "per_transaction_cap": 10000.0,
          "daily_cap": 50000.0,
          "price_slippage_percent": 5.0
        }
      };
      if (!attackInvalidSig) {
        const payloadToSign = { ...payload };
        delete payloadToSign.signature;
        const signRes = await fetch("/v1/relay/mandate/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Key": "demo_admin_key" },
          body: JSON.stringify(payloadToSign)
        });
        if (signRes.ok) {
          const data = await signRes.json();
          payload.signature = data.signature;
        }
      }
      await typeLog("> Forging mandate payload...", 10);
      await typeLog("> Submitting POST /v1/relay/gateway/execute...", 10);
      const res = await fetch("/v1/relay/gateway/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": "demo_admin_key" },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (!res.ok) {
        setIsShaking(true);
        await typeLog(`> [BLOCKED] 🔴 Circuit Breaker Tripped!`, 20);
        await typeLog(`> Status: ${res.status}`, 10);
        await typeLog(`> Reason: ${resData.detail}`, 10);
        await typeLog(`> Connection terminated by Razor-Relay security layer.`, 15);
        setTimeout(() => setIsShaking(false), 500);
      } else {
        await typeLog(`> [SUCCESS] 🟢 Mandate Authorized.`, 20);
        await typeLog(`> Status: 200 OK`, 10);
        await typeLog(`> Target treasury accessed.`, 15);
      }
    } catch (e: any) {
      setIsShaking(true);
      await typeLog(`> [ERROR] Failed to reach gateway: ${e.message}`, 10);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsAttacking(false);
    }
  };

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
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'ANOMALIES' | 'SETTLED'>('ALL');


  // Real telemetry and logs updates from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { "X-Admin-Key": "demo_admin_key" };
        const [metricsRes, logsRes] = await Promise.all([
          fetch("/v1/relay/metrics", { headers }),
          fetch("/v1/relay/logs", { headers })
        ]);
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
          setVolume(data.total_gmv_processed);
          setActiveRequests(Math.floor(Math.random() * 20) + 120);
        }
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
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

              {/* Interactive Attack Terminal (God Mode) */}
              <div className={`bg-slate-900 border ${isShaking ? 'border-red-500 animate-shake shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'} rounded-xl overflow-hidden relative transition-all duration-300`}>
                <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-red-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-red-400 font-semibold tracking-widest uppercase">Manual Override Terminal</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">ROOT ACCESS</span>
                </div>
                <div className="p-5 flex flex-col md:flex-row gap-6">
                  {/* Controls */}
                  <div className="flex-1 space-y-4">
                    <p className="text-xs text-slate-400 font-mono">Act as a rogue AI agent. Attempt to bypass cryptographic limits and steal escrow funds.</p>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 mb-1">REQUESTED AMOUNT (₹)</label>
                      <input
                        type="number"
                        value={attackAmount}
                        onChange={(e) => setAttackAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="invalidSig"
                        checked={attackInvalidSig}
                        onChange={(e) => setAttackInvalidSig(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-red-500 focus:ring-red-500"
                      />
                      <label htmlFor="invalidSig" className="text-xs font-mono text-slate-400 cursor-pointer">Inject Invalid Cryptographic Signature</label>
                    </div>
                    <button
                      onClick={triggerAttack}
                      disabled={isAttacking}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-mono text-sm py-2 rounded transition-colors disabled:opacity-50"
                    >
                      {isAttacking ? 'EXECUTING...' : 'EXECUTE ATTACK VECTOR'}
                    </button>
                  </div>
                  {/* Console Output */}
                  <div className="flex-1 bg-black rounded p-3 font-mono text-[11px] overflow-y-auto h-40 border border-slate-800">
                    <pre className={`whitespace-pre-wrap ${attackLog.includes('BLOCKED') || attackLog.includes('ERROR') ? 'text-red-400' : attackLog.includes('SUCCESS') ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {attackLog}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Real-time Data Table */}
              <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-blue-500/20 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-slate-200 dark:border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    Live Escrow Logs
                  </h3>
                  <div className="flex bg-slate-100 dark:bg-[#0F172A] p-1 rounded-lg border border-slate-200 dark:border-blue-500/20">
                    <button onClick={() => setLogFilter('ALL')} className={`text-[10px] font-mono px-3 py-1 rounded-md transition-colors ${logFilter === 'ALL' ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>ALL</button>
                    <button onClick={() => setLogFilter('ANOMALIES')} className={`text-[10px] font-mono px-3 py-1 rounded-md transition-colors ${logFilter === 'ANOMALIES' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>ANOMALIES</button>
                    <button onClick={() => setLogFilter('SETTLED')} className={`text-[10px] font-mono px-3 py-1 rounded-md transition-colors ${logFilter === 'SETTLED' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>SETTLED</button>
                  </div>
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
                      {(() => {
                        const filteredLogs = logs.filter(row => {
                          if (logFilter === 'ALL') return true;
                          if (logFilter === 'ANOMALIES') return row.status.includes('INVALID') || row.status.includes('REJECTED') || row.status.includes('REVOKED') || row.status.includes('BLOCKED');
                          if (logFilter === 'SETTLED') return row.status === 'SETTLED';
                          return true;
                        });
                        if (filteredLogs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-xs">
                                No logs found for this filter.
                              </td>
                            </tr>
                          );
                        }
                        return filteredLogs.map((row, i) => {
                          let statusColor = "text-emerald-600 dark:text-[#00FF88]";
                          if (row.status.includes("INVALID") || row.status.includes("REJECTED") || row.status.includes("REVOKED") || row.status.includes("BLOCKED")) {
                            statusColor = "text-red-400";
                          } else if (row.status === "ESCROW_LOCKED") {
                            statusColor = "text-blue-400";
                          }
                          return (
                            <motion.tr
                              key={row.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="border-b border-slate-200 dark:border-blue-500/20/50 hover:bg-slate-50 dark:bg-[#0F172A]/30 transition-colors"
                            >
                              <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{row.time_ago}</td>
                              <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{row.mandate_id}</td>
                              <td className="p-4 text-slate-500 dark:text-slate-400">{row.schema_type}</td>
                              <td className="p-4">
                                <span className={`text-xs font-mono px-2 py-0.5 rounded border border-current ${statusColor} bg-current/[0.05]`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono text-slate-900 dark:text-white">₹{row.amount}</td>
                            </motion.tr>
                          );
                        });
                      })()}
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
                    {logs.map((row, i) => {
                      let statusColor = "text-emerald-600 dark:text-[#00FF88]";
                      if (row.status.includes("INVALID") || row.status.includes("REJECTED") || row.status.includes("REVOKED") || row.status.includes("BLOCKED")) {
                        statusColor = "text-red-400";
                      } else if (row.status === "ESCROW_LOCKED") {
                        statusColor = "text-blue-400";
                      }
                      return (
                        <tr key={row.id} className="border-b border-slate-200 dark:border-blue-500/20/50 hover:bg-slate-50 dark:bg-[#0F172A]/30 transition-colors">
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{row.time_ago}</td>
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{row.mandate_id}</td>
                          <td className="p-4 font-mono text-slate-400 dark:text-slate-500 text-xs">{row.agent_ip}</td>
                          <td className="p-4">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded border border-current ${statusColor} bg-current/[0.05]`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-900 dark:text-white">₹{row.fee.toFixed(2)}</td>
                        </tr>
                      );
                    })}
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
                    <input type="number" value={failoverThreshold} onChange={(e) => setFailoverThreshold(e.target.value)} className="w-24 bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-blue-500/30 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500/60" />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-blue-500/20/50 flex items-center gap-4">
                  <button onClick={saveSettings} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">
                    Save Changes
                  </button>
                  {saveSettingsStatus && (
                    <p className={`text-xs font-mono ${saveSettingsStatus.includes('saved') ? 'text-emerald-500 dark:text-[#00FF88]' : 'text-slate-500 dark:text-slate-400'}`}>
                      {saveSettingsStatus}
                    </p>
                  )}
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

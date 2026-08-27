"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, Search, Zap, Shield, ArrowUpRight, 
  Settings, User, FileText, Code2, Server
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
  const [open, setOpen] = useState(false);
  const [activeRequests, setActiveRequests] = useState(142);
  const [volume, setVolume] = useState(12500);

  // Command Palette listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fake telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRequests(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      if (Math.random() > 0.8) setVolume(prev => prev + Math.floor(Math.random() * 500));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0D12] text-neutral-200 font-sans selection:bg-[#00FF88]/30">
      
      {/* Top Navbar */}
      <nav className="h-16 bg-[#131620]/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <a href="/" className="font-serif text-xl tracking-wide text-white hover:text-[#00FF88] transition-colors">
            RAZOR-RELAY
          </a>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
            DASHBOARD
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 rounded bg-neutral-800 font-mono text-[10px]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-[#00FF88] opacity-80 cursor-pointer hover:opacity-100 transition-opacity" />
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-mono text-neutral-500 px-3 uppercase tracking-wider mb-2">Overview</h3>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-900 text-white font-medium border border-neutral-800">
              <Activity className="w-4 h-4 text-[#00FF88]" />
              Live Telemetry
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition-colors">
              <FileText className="w-4 h-4" />
              Escrow Logs
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition-colors">
              <Shield className="w-4 h-4" />
              Security Policies
            </button>
          </div>
          
          <div className="space-y-1 pt-4 border-t border-neutral-800/50">
            <h3 className="text-xs font-mono text-neutral-500 px-3 uppercase tracking-wider mb-2">Settings</h3>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition-colors">
              <Code2 className="w-4 h-4" />
              API Keys
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition-colors">
              <Settings className="w-4 h-4" />
              Configuration
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-9 space-y-8">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-[#131620] border border-neutral-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF88]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-sm font-medium text-neutral-400">Total Volume</span>
                <span className="flex items-center gap-1 text-xs text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" /> +12%
                </span>
              </div>
              <div className="text-3xl font-mono text-white relative z-10">
                ₹{volume.toLocaleString()}
              </div>
            </div>

            <div className="bg-[#131620] border border-neutral-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-sm font-medium text-neutral-400">Active Requests</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
              </div>
              <div className="text-3xl font-mono text-white relative z-10">
                {activeRequests} <span className="text-sm text-neutral-500">/sec</span>
              </div>
            </div>

            <div className="bg-[#131620] border border-neutral-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-sm font-medium text-neutral-400">Security Score</span>
                <Shield className="w-4 h-4 text-[#00FF88]" />
              </div>
              <div className="text-3xl font-mono text-white relative z-10">
                98.0%
              </div>
              <div className="text-xs text-neutral-500 mt-2 font-mono">0 FALSE POSITIVES</div>
            </div>

          </div>

          {/* Real-time Data Table */}
          <div className="bg-[#131620] border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                Live Escrow Logs
              </h3>
              <button className="text-xs font-mono bg-neutral-900 border border-neutral-700 px-3 py-1 rounded text-neutral-300 hover:text-white transition-colors">
                FILTER
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/50 text-xs font-mono text-neutral-500 border-b border-neutral-800">
                    <th className="p-4 font-normal">TIMESTAMP</th>
                    <th className="p-4 font-normal">MANDATE ID</th>
                    <th className="p-4 font-normal">SCHEMA</th>
                    <th className="p-4 font-normal">STATUS</th>
                    <th className="p-4 font-normal text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { id: "mnd_9f82b", schema: "service_rendered", status: "VERIFIED", amt: 500, time: "Just now", color: "text-[#00FF88]" },
                    { id: "mnd_4a11c", schema: "payment_confirmed", status: "PENDING", amt: 1200, time: "2s ago", color: "text-blue-400" },
                    { id: "mnd_7x99d", schema: "data_delivery", status: "BLOCKED", amt: 350, time: "12s ago", color: "text-red-400" },
                    { id: "mnd_2q88a", schema: "service_rendered", status: "VERIFIED", amt: 890, time: "45s ago", color: "text-[#00FF88]" },
                  ].map((row, i) => (
                    <motion.tr 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border-b border-neutral-800/50 hover:bg-neutral-900/30 transition-colors"
                    >
                      <td className="p-4 text-neutral-400 font-mono text-xs">{row.time}</td>
                      <td className="p-4 font-mono text-neutral-300">{row.id}</td>
                      <td className="p-4 text-neutral-400">{row.schema}</td>
                      <td className="p-4">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border border-current ${row.color} bg-current/[0.05]`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-white">₹{row.amt}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </main>
      </div>

      {/* Command Palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem><Activity className="mr-2 h-4 w-4" /> View Live Telemetry</CommandItem>
            <CommandItem><FileText className="mr-2 h-4 w-4" /> Export Escrow Logs</CommandItem>
            <CommandItem><Code2 className="mr-2 h-4 w-4" /> Generate API Key</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem><User className="mr-2 h-4 w-4" /> Profile</CommandItem>
            <CommandItem><Settings className="mr-2 h-4 w-4" /> System Configuration</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

    </div>
  );
}

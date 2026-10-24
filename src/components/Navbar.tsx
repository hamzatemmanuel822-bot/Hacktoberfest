import React from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  BarChart3, 
  Sparkles, 
  Cpu, 
  Shield, 
  CheckCircle2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { DeviceTwin } from '../types';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  deviceTwin: DeviceTwin | null;
  gemmaVariant: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, deviceTwin, gemmaVariant }) => {
  const isOnline = deviceTwin?.status === 'online';

  const tabs = [
    { id: 'kiosk', label: 'Entrance Kiosk', icon: Building2 },
    { id: 'staff', label: 'Staff Registry', icon: Users },
    { id: 'visitors', label: 'Visitor Passes', icon: UserCheck },
    { id: 'attendance', label: 'Attendance Log', icon: BarChart3 },
    { id: 'gemma', label: 'Gemma 4 Hub', icon: Sparkles },
    { id: 'hardware', label: 'Arduino UNO Q', icon: Cpu },
    { id: 'admin', label: 'Settings & Security', icon: Shield },
    { id: 'tests', label: 'Test Suite', icon: CheckCircle2 }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-950/40">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 tracking-tight text-base">SmartWelcome AI</span>
                <span className="text-[11px] font-mono text-cyan-400 font-medium">Gemma 4</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Qualcomm & STM32 Dual-Core Architecture
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    active
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Real-time Hardware & Model Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Arduino UNO Q Link */}
            <button
              onClick={() => setTab('hardware')}
              className="flex items-center gap-2 px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-colors text-left"
              title="Click to inspect Arduino UNO Q telemetry and hardware twin"
            >
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-rose-400" />
              )}
              <div className="flex flex-col text-[11px] leading-tight">
                <span className="text-slate-400 font-mono">UNO Q</span>
                <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {isOnline ? 'Wi-Fi Linked' : 'Offline'}
                </span>
              </div>
            </button>

            {/* Gemma 4 Model Badge */}
            <button
              onClick={() => setTab('gemma')}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-colors"
              title="Gemma 4 Neural Inference Active"
            >
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="flex flex-col text-[11px] leading-tight text-left">
                <span className="text-slate-400 font-mono">Inference</span>
                <span className="text-cyan-300 font-medium truncate max-w-[90px]">{gemmaVariant}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Scroller */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-3 py-2 border-t border-slate-800 bg-slate-950">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs whitespace-nowrap rounded-md ${
                active ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

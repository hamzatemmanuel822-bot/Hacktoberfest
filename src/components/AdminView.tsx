import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Sliders, 
  Database, 
  RotateCcw, 
  Download, 
  Lock, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Save,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { SystemSettings, AuditLog } from '../types';

interface AdminViewProps {
  onRefreshAll: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onRefreshAll }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
      const health = await api.getHealth();
      // audit logs can be retrieved from health or dedicated endpoint
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefreshAll();
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database to verified demo seed data? All custom check-ins will be restored to default demo records.')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetData();
      onRefreshAll();
      loadSettings();
      alert('Database successfully restored to verified seed state.');
    } catch (err) {
      console.error('Error resetting database:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleDownloadBackup = () => {
    // Generate snapshot download
    window.location.href = '/api/attendance/export-csv';
  };

  if (!settings) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading configuration...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">System Settings & Governance</h2>
          <p className="text-xs text-slate-400">
            Configure detection parameters, Gemma 4 inference endpoints, token expiry rules, and database persistence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-xl border border-rose-900/50 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Operational Configuration</h3>
            </div>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Settings saved successfully
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Detection & Cooldown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Absence Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={settings.absenceTimeoutSeconds}
                  onChange={(e) =>
                    setSettings({ ...settings, absenceTimeoutSeconds: Number(e.target.value) })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Time person must be out of view before resetting presence
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Detection Cooldown (Seconds)
                </label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={settings.cooldownSeconds}
                  onChange={(e) =>
                    setSettings({ ...settings, cooldownSeconds: Number(e.target.value) })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Prevents re-triggering welcome while attendee is in view
                </span>
              </div>
            </div>

            {/* Duplicate Suppression */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-slate-300 font-medium">
                Duplicate Check-in Window (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.duplicateWindowHours}
                onChange={(e) =>
                  setSettings({ ...settings, duplicateWindowHours: Number(e.target.value) })
                }
                className="w-48 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 block">
                Attempts by the same person within this window are logged as duplicate warnings rather than redundant admissions.
              </span>
            </div>

            {/* Gemma 4 Model Configuration */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Google Gemma 4 Model Variant</span>
                <span className="text-[11px] font-mono text-cyan-400">Section 4 Compliance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Model Variant</label>
                  <select
                    value={settings.gemmaModelVariant}
                    onChange={(e) =>
                      setSettings({ ...settings, gemmaModelVariant: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="gemma-4-e2b">gemma-4-e2b (Active on Laptop - Lightweight 2B)</option>
                    <option value="gemma-4-e4b-it">gemma-4-e4b-it (Edge / Workstation 4B)</option>
                    <option value="gemma-4-12b-it">gemma-4-12b-it (Balanced General Intelligence 12B)</option>
                    <option value="gemma-4-26b-a4b">gemma-4-26b-a4b (MoE Active 4B)</option>
                    <option value="gemma-4-31b">gemma-4-31b (Dense Flagship 31B)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Local Inference Endpoint (Ollama/vLLM)</label>
                  <input
                    type="text"
                    value={settings.gemmaInferenceEndpoint}
                    onChange={(e) =>
                      setSettings({ ...settings, gemmaInferenceEndpoint: e.target.value })
                    }
                    placeholder="http://localhost:11434"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* UNO Q Wi-Fi Credentials */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Arduino UNO Q Device Secret</span>
                <span className="text-[11px] font-mono text-emerald-400">Authenticated WebSocket</span>
              </div>
              <input
                type="password"
                value={settings.deviceAuthSecret}
                onChange={(e) =>
                  setSettings({ ...settings, deviceAuthSecret: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 block">
                Must match <code className="text-cyan-400 font-mono">UNO_Q_AUTH_TOKEN</code> in <code className="text-slate-300">hardware/uno_q_agent.py</code>.
              </span>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-lg"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security Architecture & Database Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Security Rules Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-xl text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Shield className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-100">Security Architecture</h3>
            </div>
            <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Separation of Concerns:</strong> Human detection triggers welcome flow only; never creates unverified attendance.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cryptographic Tokens:</strong> High-entropy tokens (<code className="text-cyan-300">SWK-...</code>) hashed with SHA-256 in backend.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Biometrics:</strong> No facial recognition or facial templates stored or transmitted.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Atomic ACID Persistence:</strong> Transactional JSON writes with atomic rename protection.
                </span>
              </li>
            </ul>
          </div>

          {/* Database Persistence Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-xl text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Database className="h-4 w-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-100">Database Storage</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              File: <code className="text-cyan-300 font-mono">data/smartwelcome.json</code>
              <br />
              All staff, visitors, tokens, and attendance events are preserved across application restarts.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Database CSV Snapshot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

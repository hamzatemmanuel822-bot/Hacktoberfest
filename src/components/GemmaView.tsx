import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Terminal, 
  BookOpen, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { GemmaInferenceResult } from '../types';

export const GemmaView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'summary' | 'tools' | 'knowledge'>('chat');
  
  // Model status
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Chat Sandbox
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; meta?: any }>>([
    {
      role: 'assistant',
      text: 'Greetings. I am the SmartWelcome facility assistant powered by Google Gemma 4. How may I direct you today?'
    }
  ]);
  const [isInferencing, setIsInferencing] = useState(false);

  // Administrative Summary
  const [summaryResult, setSummaryResult] = useState<GemmaInferenceResult | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Tool Testing
  const [selectedTool, setSelectedTool] = useState('get_aggregate_attendance_summary');
  const [toolArgs, setToolArgs] = useState('{}');
  const [toolResult, setToolResult] = useState<any>(null);
  const [loadingTool, setLoadingTool] = useState(false);

  // Knowledge Base
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await api.getGemmaStatus();
      setModelStatus(status);
    } catch (err) {
      console.error('Error fetching Gemma status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isInferencing) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsInferencing(true);

    try {
      const res = await api.gemmaChat(userMsg);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.text,
          meta: {
            model: res.model,
            runtime: res.runtime,
            latencyMs: res.latencyMs,
            fallbackEngaged: res.fallbackEngaged
          }
        }
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: 'Error contacting Gemma 4 inference service.' }
      ]);
    } finally {
      setIsInferencing(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.gemmaSummary();
      setSummaryResult(res);
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExecuteTool = async () => {
    setLoadingTool(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(toolArgs);
      } catch (e) {
        // invalid JSON fallback
      }
      const res = await api.gemmaExecuteTool(selectedTool, parsed);
      setToolResult(res);
    } catch (err) {
      console.error('Tool execution error:', err);
    } finally {
      setLoadingTool(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Model Architecture Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Google Gemma 4 AI Hub</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              {modelStatus?.variant || 'gemma-4-e2b'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real inference integration, approved organizational knowledge grounding, and controlled tool execution
          </p>
        </div>

        <button
          onClick={refreshStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
          <span>Refresh Runtime Status</span>
        </button>
      </div>

      {/* Model Runtime Diagnostics Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Active Model Variant</div>
          <div className="text-base font-bold font-mono text-cyan-400 truncate">
            {modelStatus?.variant || 'gemma-4-e2b'}
          </div>
          <div className="text-[11px] text-slate-500">Google Gemma 4 Architecture (Laptop Edition)</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Inference Runtime</div>
          <div className="text-base font-bold text-slate-100">
            {modelStatus?.googleGenAiActive ? 'Google GenAI SDK' : 'Local / Fallback'}
          </div>
          <div className="text-[11px] text-slate-500">
            Endpoint: {modelStatus?.configuredEndpoint || 'Localhost:11434'}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Approved Knowledge Items</div>
          <div className="text-base font-bold text-slate-100">
            {modelStatus?.approvedKnowledgeItems || 8} Articles
          </div>
          <div className="text-[11px] text-slate-500">Strict RAG Grounding</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Tool Execution Authority</div>
          <div className="text-base font-bold text-emerald-400">Controlled / Sandboxed</div>
          <div className="text-[11px] text-slate-500">Zero Arbitrary Writes</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'chat'
              ? 'bg-cyan-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interactive Assistant (A/B/C)</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('summary');
            if (!summaryResult) handleGenerateSummary();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'summary'
              ? 'bg-cyan-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Admin Summary (Feature D)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('tools')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'tools'
              ? 'bg-cyan-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Controlled AI Tools (Feature E)</span>
        </button>
      </div>

      {/* SUBTAB 1: Chat Sandbox */}
      {activeSubTab === 'chat' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-xl">
          <div className="text-xs text-slate-400 flex items-center justify-between pb-2 border-b border-slate-800">
            <span>Test Gemma 4 with visitor questions, directions, and edge cases</span>
            <span className="font-mono text-cyan-400">Grounding: Strict Approved Knowledge</span>
          </div>

          <div className="space-y-3 min-h-[260px] max-h-[380px] overflow-y-auto p-2">
            {chatHistory.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-xl rounded-xl p-3.5 text-xs leading-relaxed ${
                    item.role === 'user'
                      ? 'bg-cyan-500 text-slate-950 font-medium'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  {item.text}
                </div>
                {item.meta && (
                  <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-2">
                    <span>{item.meta.model}</span>
                    <span>·</span>
                    <span>{item.meta.runtime}</span>
                    <span>·</span>
                    <span>{item.meta.latencyMs}ms</span>
                    {item.meta.fallbackEngaged && (
                      <span className="text-amber-400">· Deterministic Fallback</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isInferencing && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Gemma 4 is performing inference...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. 'What is the procedure for registering a visitor?' or 'Where is Floor 2?'"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isInferencing || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 2: Admin Summary */}
      {activeSubTab === 'summary' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Gemma 4 Natural Language Attendance & Hardware Briefing
              </h3>
              <p className="text-xs text-slate-400">
                Authoritative numbers calculated directly from database; explained cleanly by Gemma 4
              </p>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={loadingSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingSummary ? 'animate-spin' : ''}`} />
              <span>Regenerate Briefing</span>
            </button>
          </div>

          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center py-12 text-xs text-cyan-400 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Gemma 4 is synthesizing authoritative database logs...</span>
            </div>
          ) : summaryResult ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 whitespace-pre-line text-xs text-slate-200 leading-relaxed font-normal">
                {summaryResult.text}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-3">
                  <span>Model: <strong className="text-cyan-400">{summaryResult.model}</strong></span>
                  <span>Runtime: <strong className="text-slate-300">{summaryResult.runtime}</strong></span>
                  <span>Latency: <strong className="text-slate-300">{summaryResult.latencyMs}ms</strong></span>
                </div>
                {summaryResult.toolsUsed && (
                  <div className="text-emerald-400">
                    Tools Executed: {summaryResult.toolsUsed.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SUBTAB 3: Controlled Tools */}
      {activeSubTab === 'tools' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Controlled AI Tools Sandbox (Feature E)
            </h3>
            <p className="text-xs text-slate-400">
              Verify that the model can only call explicitly authorized, read-only tools with strictly validated arguments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Tool Function</label>
                <select
                  value={selectedTool}
                  onChange={(e) => {
                    setSelectedTool(e.target.value);
                    if (e.target.value === 'get_department_information') {
                      setToolArgs('{"departmentName": "Robotics"}');
                    } else if (e.target.value === 'get_aggregate_attendance_summary') {
                      setToolArgs('{}');
                    } else {
                      setToolArgs('{}');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="get_aggregate_attendance_summary">get_aggregate_attendance_summary()</option>
                  <option value="get_department_information">get_department_information()</option>
                  <option value="get_public_checkin_instructions">get_public_checkin_instructions()</option>
                  <option value="get_device_health_status">get_device_health_status()</option>
                  <option value="unauthorized_bypass_test">unauthorized_bypass_test() [Blocked]</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">JSON Arguments</label>
                <textarea
                  rows={3}
                  value={toolArgs}
                  onChange={(e) => setToolArgs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleExecuteTool}
                disabled={loadingTool}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >
                {loadingTool ? 'Executing Tool...' : 'Execute Authorized Tool'}
              </button>
            </div>

            {/* Output Inspector */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-400 mb-2 pb-1 border-b border-slate-800">
                  Execution Output (Validated Server-Side)
                </div>
                <pre className="text-xs font-mono text-slate-200 overflow-x-auto max-h-56">
                  {toolResult
                    ? JSON.stringify(toolResult, null, 2)
                    : '// Select a tool and click execute to inspect response'}
                </pre>
              </div>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                Rule: Tools cannot modify attendance records or grant physical access.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

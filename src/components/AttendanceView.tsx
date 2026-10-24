import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  UserCheck, 
  Cpu,
  Info
} from 'lucide-react';
import { AttendanceRecord } from '../types';

interface AttendanceViewProps {
  records: AttendanceRecord[];
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [onlyDuplicates, setOnlyDuplicates] = useState(false);

  // Compute Today's Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.timestamp.startsWith(todayStr));
  const staffCount = todayRecords.filter((r) => r.personType === 'staff' && !r.duplicateAttempt).length;
  const visitorCount = todayRecords.filter((r) => r.personType === 'visitor' && !r.duplicateAttempt).length;
  const duplicateCount = todayRecords.filter((r) => r.duplicateAttempt).length;
  const totalValid = staffCount + visitorCount;

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tokenUsed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || r.personType === filterType;
    const matchesDuplicate = !onlyDuplicates || r.duplicateAttempt;
    return matchesSearch && matchesType && matchesDuplicate;
  });

  const handleExportCsv = () => {
    window.location.href = '/api/attendance/export-csv';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Attendance Records & Analytics</h2>
          <p className="text-xs text-slate-400">
            Immutable entrance transactions, cryptographic verification history, and hardware audit logs
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-950/20"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Critical Presence vs Check-in Distinction Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-blue-900/40 bg-blue-950/30 text-xs text-blue-300">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">System Clarification:</strong> Check-in records represent verified point-in-time entrance events authenticated through attendance stickers. They reflect authorized admission transactions and do not claim continuous real-time physical room tracking.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Today's Total Check-ins</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">{totalValid}</div>
          <div className="text-[11px] text-slate-500">Verified unique arrivals</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Staff Present</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">{staffCount}</div>
          <div className="text-[11px] text-slate-500">Facility personnel</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Visitors On-Site</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">{visitorCount}</div>
          <div className="text-[11px] text-slate-500">Temporary guest passes</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Duplicate Interceptions</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">{duplicateCount}</div>
          <div className="text-[11px] text-slate-500">Flagged duplicate scans</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search attendee, department, or token..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Category:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              <option value="staff">Staff Only</option>
              <option value="visitor">Visitors Only</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyDuplicates}
              onChange={(e) => setOnlyDuplicates(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
            />
            <span>Duplicates Only</span>
          </label>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Attendee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Department / Org</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Verification & Token</th>
                <th className="px-4 py-3">Hardware Sync</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-100">
                    {rec.personName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`uppercase text-[10px] font-mono font-medium ${
                        rec.personType === 'staff' ? 'text-blue-400' : 'text-emerald-400'
                      }`}
                    >
                      {rec.personType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{rec.department}</div>
                    {rec.organization && (
                      <div className="text-[11px] text-slate-400">{rec.organization}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {new Date(rec.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="text-cyan-400 text-[11px]">{rec.tokenUsed}</div>
                    <div className="text-[10px] text-slate-500">via {rec.verificationType}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                      <span>ACK (UNO Q)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {rec.duplicateAttempt ? (
                      <span className="text-amber-400 text-[11px] flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Duplicate Flagged
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Valid Admission
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No attendance records match the search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

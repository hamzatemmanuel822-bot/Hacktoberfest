import React, { useState } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Search, 
  Printer, 
  LogOut, 
  Clock, 
  Building2, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Visitor, StickerToken } from '../types';
import { api } from '../services/api';
import { StickerModal } from './StickerModal';

interface VisitorsViewProps {
  visitorsList: Visitor[];
  tokensList: StickerToken[];
  onRefresh: () => void;
}

export const VisitorsView: React.FC<VisitorsViewProps> = ({ visitorsList, tokensList, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTokenForPrint, setSelectedTokenForPrint] = useState<{
    token: StickerToken;
    visitor: Visitor;
  } | null>(null);

  // New visitor form
  const [formData, setFormData] = useState({
    fullName: '',
    organization: '',
    purpose: '',
    hostPerson: 'Dr. Elena Vance',
    hostDepartment: 'Robotics & Hardware Lab'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredVisitors = visitorsList.filter((v) => {
    const matchesSearch =
      v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.hostPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.createVisitor(formData);
      onRefresh();
      setShowAddModal(false);
      setFormData({
        fullName: '',
        organization: '',
        purpose: '',
        hostPerson: 'Dr. Elena Vance',
        hostDepartment: 'Robotics & Hardware Lab'
      });
      if (res.token && res.visitor) {
        setSelectedTokenForPrint({ token: res.token, visitor: res.visitor });
      }
    } catch (err) {
      console.error('Error creating visitor pass:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async (visitor: Visitor) => {
    try {
      await api.checkoutVisitor(visitor.id);
      onRefresh();
    } catch (err) {
      console.error('Error checking out visitor:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Visitor Management</h2>
          <p className="text-xs text-slate-400">
            Issue temporary guest badges, monitor on-site visitors, and record departures
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-950/20"
        >
          <UserPlus className="h-4 w-4" />
          <span>Issue Visitor Pass</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search visitor, organization, or host..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="expected">Expected</option>
            <option value="checked_in">Checked In (On-Site)</option>
            <option value="checked_out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Visitor Name & Org</th>
                <th className="px-4 py-3">Visit Purpose</th>
                <th className="px-4 py-3">Internal Host</th>
                <th className="px-4 py-3">Sticker Token</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVisitors.map((visitor) => {
                const tokenObj = tokensList.find((t) => t.id === visitor.stickerTokenId || t.assignedToId === visitor.id);
                return (
                  <tr key={visitor.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{visitor.fullName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        <span>{visitor.organization || 'Independent'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                      {visitor.purpose || 'General meeting'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-medium">{visitor.hostPerson}</div>
                      <div className="text-[11px] text-slate-400">{visitor.hostDepartment}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400">
                      {tokenObj ? (
                        <div className="flex items-center gap-2">
                          <span>{tokenObj.token}</span>
                          {tokenObj.status === 'expired' && (
                            <span className="text-[10px] text-slate-500 uppercase">(Expired)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            visitor.status === 'checked_in'
                              ? 'bg-emerald-400'
                              : visitor.status === 'expected'
                              ? 'bg-amber-400'
                              : 'bg-slate-600'
                          }`}
                        />
                        <span className="capitalize text-slate-300">
                          {visitor.status === 'checked_in'
                            ? 'On-Site'
                            : visitor.status === 'expected'
                            ? 'Expected'
                            : 'Departed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {tokenObj && (
                          <button
                            onClick={() => setSelectedTokenForPrint({ token: tokenObj, visitor })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Pass</span>
                          </button>
                        )}
                        {visitor.status === 'checked_in' && (
                          <button
                            onClick={() => handleCheckout(visitor)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800/80 text-rose-300 hover:bg-rose-950/40 hover:border-rose-700 transition-colors"
                          >
                            <LogOut className="h-3 w-3" />
                            <span>Check-out</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVisitors.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No visitor records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Pass Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">Issue Visitor Sticker Pass</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisitor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Nordic Sensor Dynamics"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g. Hardware Audit & Sensor Calibration"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Host Staff Member</label>
                  <input
                    type="text"
                    value={formData.hostPerson}
                    onChange={(e) => setFormData({ ...formData, hostPerson: e.target.value })}
                    placeholder="Dr. Elena Vance"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Host Department</label>
                  <input
                    type="text"
                    value={formData.hostDepartment}
                    onChange={(e) => setFormData({ ...formData, hostDepartment: e.target.value })}
                    placeholder="Robotics & Hardware Lab"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                Visitor pass tokens expire automatically after 24 hours. The sticker badge will be immediately printable upon submission.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  Issue Pass & Print
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Badge Print Modal */}
      {selectedTokenForPrint && (
        <StickerModal
          token={selectedTokenForPrint.token}
          person={selectedTokenForPrint.visitor}
          onClose={() => setSelectedTokenForPrint(null)}
        />
      )}
    </div>
  );
};

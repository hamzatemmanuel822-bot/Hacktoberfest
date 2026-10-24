import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  QrCode, 
  Printer, 
  ShieldAlert, 
  Check, 
  X,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { Staff, StickerToken } from '../types';
import { api } from '../services/api';
import { StickerModal } from './StickerModal';

interface StaffViewProps {
  staffList: Staff[];
  tokensList: StickerToken[];
  onRefresh: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ staffList, tokensList, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTokenForPrint, setSelectedTokenForPrint] = useState<{
    token: StickerToken;
    staff: Staff;
  } | null>(null);

  // New staff form state
  const [formData, setFormData] = useState({
    fullName: '',
    staffNumber: '',
    department: 'Robotics & Hardware Lab',
    email: '',
    phone: '',
    role: 'Staff Engineer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique departments for filter
  const departments = ['ALL', ...Array.from(new Set(staffList.map((s) => s.department)))];

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.staffNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.createStaff(formData);
      onRefresh();
      setShowAddModal(false);
      setFormData({
        fullName: '',
        staffNumber: '',
        department: 'Robotics & Hardware Lab',
        email: '',
        phone: '',
        role: 'Staff Engineer'
      });
      // Prompt printing newly generated badge
      if (res.token && res.staff) {
        setSelectedTokenForPrint({ token: res.token, staff: res.staff });
      }
    } catch (err) {
      console.error('Failed to create staff:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (staff: Staff) => {
    try {
      await api.updateStaff(staff.id, { active: !staff.active });
      onRefresh();
    } catch (err) {
      console.error('Error toggling staff status:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Staff Registry</h2>
          <p className="text-xs text-slate-400">
            Manage authorized facility personnel and attendance sticker token assignments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-950/20"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register New Staff</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Department & Role</th>
                <th className="px-4 py-3">Sticker Token</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStaff.map((staff) => {
                const tokenObj = tokensList.find((t) => t.id === staff.stickerTokenId || t.assignedToId === staff.id);
                return (
                  <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{staff.fullName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        {staff.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {staff.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400 font-medium">
                      {staff.staffNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-medium">{staff.department}</div>
                      <div className="text-[11px] text-slate-400">{staff.role}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {tokenObj ? (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 text-[11px]">
                            {tokenObj.token}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({tokenObj.status})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(staff)}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                          staff.active ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            staff.active ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        {staff.active ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tokenObj && (
                        <button
                          onClick={() => setSelectedTokenForPrint({ token: tokenObj, staff })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Print Badge</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No staff members match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">Register Staff Member</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Maya Angelou"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Staff Number (Auto if blank)</label>
                  <input
                    type="text"
                    value={formData.staffNumber}
                    onChange={(e) => setFormData({ ...formData, staffNumber: e.target.value })}
                    placeholder="EMP-1046"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Role / Job Title</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Principal Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Robotics & Hardware Lab">Robotics & Hardware Lab</option>
                  <option value="Computer Vision & AI Systems">Computer Vision & AI Systems</option>
                  <option value="Cloud & IoT Infrastructure">Cloud & IoT Infrastructure</option>
                  <option value="Human Resources & Facilities">Human Resources & Facilities</option>
                  <option value="Security & Compliance">Security & Compliance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@smartwelcome.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                A unique cryptographically signed sticker token (<code className="text-cyan-400">SWK-STF-XXXX</code>) will be generated and ready to print upon creation.
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
                  Save & Generate Badge
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
          person={selectedTokenForPrint.staff}
          onClose={() => setSelectedTokenForPrint(null)}
        />
      )}
    </div>
  );
};

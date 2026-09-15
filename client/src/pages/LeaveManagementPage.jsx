import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Calendar, Plus, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';

const LeaveManagementPage = () => {
  const { user } = useAuth();
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-leaves');

  // Modals & Forms
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [applyForm, setApplyForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchMyLeaves = async () => {
    try {
      const res = await api.get('/leaves/my-requests');
      setMyLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch personal leave requests:', err);
    }
  };

  const fetchTeamLeaves = async () => {
    if (user?.role === 'Manager' || user?.role === 'HR') {
      try {
        const res = await api.get('/leaves/team-requests');
        setTeamLeaves(res.data);
      } catch (err) {
        console.error('Failed to fetch team leave requests:', err);
      }
    }
  };

  const fetchAllLeaves = async () => {
    if (user?.role === 'HR') {
      try {
        const res = await api.get('/leaves/all-requests');
        setAllLeaves(res.data);
      } catch (err) {
        console.error('Failed to fetch all leave requests:', err);
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchMyLeaves(), fetchTeamLeaves(), fetchAllLeaves()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', applyForm);
      setIsApplyModalOpen(false);
      setApplyForm({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleApprove = async (leaveId) => {
    if (window.confirm('Are you sure you want to approve this leave request?')) {
      try {
        await api.patch(`/leaves/${leaveId}/approve`);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve leave request');
      }
    }
  };

  const openRejectModal = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Rejection reason is mandatory.');
      return;
    }
    try {
      await api.patch(`/leaves/${selectedLeaveId}/reject`, { rejectionReason });
      setIsRejectModalOpen(false);
      setSelectedLeaveId(null);
      setRejectionReason('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject leave request');
    }
  };

  const role = user?.role;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Leave Management Portal</h2>
          <p className="text-xs text-slate-400">Apply for leave, track requests and manage team time-off approvals</p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('my-leaves')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'my-leaves' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          My Leave History
        </button>

        {(role === 'Manager' || role === 'HR') && (
          <button
            onClick={() => setActiveTab('team-leaves')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'team-leaves' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Team Requests ({teamLeaves.filter((l) => l.status === 'Pending').length} Pending)
          </button>
        )}

        {role === 'HR' && (
          <button
            onClick={() => setActiveTab('all-leaves')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'all-leaves' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Company Requests ({allLeaves.filter((l) => l.status === 'Pending').length} Pending)
          </button>
        )}
      </div>

      {/* My Leaves Table */}
      {activeTab === 'my-leaves' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Personal Leave Applications</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {myLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{l.leaveType}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-indigo-400">{l.totalDays} Day(s)</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">{l.reason}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={l.status}>{l.status}</Badge>
                        {l.rejectionReason && (
                          <span className="text-xs text-rose-400 italic">Reason: {l.rejectionReason}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Leaves Table (Manager/HR) */}
      {activeTab === 'team-leaves' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Team Leave Approvals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {teamLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">{l.employeeId?.fullName}</span>
                      <p className="text-xs text-slate-400">{l.employeeId?.designation}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">{l.leaveType}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} Days)
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs">{l.reason}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={l.status}>{l.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(l._id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(l._id)}
                            className="flex items-center gap-1 rounded-lg bg-rose-600/20 border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Company Leaves Table (HR) */}
      {activeTab === 'all-leaves' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">All Company Leave Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Dept</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {allLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{l.employeeId?.fullName}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{l.employeeId?.department}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{l.leaveType}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} Days)
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={l.status}>{l.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(l._id)}
                            className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(l._id)}
                            className="rounded-lg bg-rose-600/20 border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Apply For Time-Off Leave">
        <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Leave Type</label>
            <select
              value={applyForm.leaveType}
              onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
            >
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Paid">Paid Time Off (PTO)</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                required
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Reason for Leave</label>
            <textarea
              required
              rows="3"
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              placeholder="Explain the reason for leave..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-95"
          >
            Submit Leave Request
          </button>
        </form>
      </Modal>

      {/* Reject Leave Reason Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Leave Request">
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Mandatory Rejection Explanation</label>
            <textarea
              required
              rows="3"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a specific reason for rejecting this request..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-rose-600 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:bg-rose-500"
          >
            Confirm Rejection
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveManagementPage;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  CalendarDays,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  User,
} from 'lucide-react';

const LeaveManagementPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Apply Leave Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [formError, setFormError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let endpoint = '/leaves/my-requests';
      if (user?.role === 'Manager') {
        endpoint = '/leaves/team-requests';
      } else if (user?.role === 'HR') {
        endpoint = '/leaves/all-requests';
      }

      const res = await api.get(`${endpoint}${statusFilter ? `?status=${statusFilter}` : ''}`);
      setLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!applyForm.startDate || !applyForm.endDate) {
      setFormError('Please select start and end dates.');
      return;
    }

    if (new Date(applyForm.startDate) > new Date(applyForm.endDate)) {
      setFormError('Start date cannot be after end date.');
      return;
    }

    setApplyLoading(true);

    try {
      await api.post('/leaves/apply', applyForm);
      setIsApplyModalOpen(false);
      setApplyForm({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approve this leave request?')) {
      try {
        await api.patch(`/leaves/${id}/approve`);
        fetchLeaves();
      } catch (err) {
        alert(err.response?.data?.message || 'Approve failed');
      }
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter mandatory rejection reason:');
    if (!reason) return;

    try {
      await api.patch(`/leaves/${id}/reject`, { rejectionReason: reason });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Reject failed');
    }
  };

  const role = user?.role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Leave Management Desk</h2>
          <p className="text-xs font-semibold text-slate-500">Apply for time-off, manage leave balances, and review approvals</p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsApplyModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-black text-slate-900">
          {role === 'HR' ? 'Company Leave Records' : role === 'Manager' ? 'Team Leave Applications' : 'My Leave Applications'}
        </h3>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending Only</option>
          <option value="Approved">Approved Only</option>
          <option value="Rejected">Rejected Only</option>
        </select>
      </div>

      {/* Main Leave Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : leaves.length === 0 ? (
          <p className="text-center py-8 text-xs font-semibold text-slate-500">No leave requests found.</p>
        ) : (
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                {(role === 'HR' || role === 'Manager') && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                {(role === 'HR' || role === 'Manager') && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50 transition-colors">
                  {(role === 'HR' || role === 'Manager') && (
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900">{l.employeeId?.fullName}</span>
                      <p className="text-xs text-slate-500 font-mono">{l.employeeId?.employeeId} • {l.employeeId?.department}</p>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <Badge variant={l.leaveType} size="xs">{l.leaveType}</Badge>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{l.totalDays}d</td>
                  <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                    {l.reason}
                    {l.rejectionReason && (
                      <p className="text-[10px] text-rose-600 font-bold">Reason: {l.rejectionReason}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={l.status} size="xs">{l.status}</Badge>
                  </td>
                  {(role === 'HR' || role === 'Manager') && (
                    <td className="py-3 px-4 text-right">
                      {l.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(l._id)}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(l._id)}
                            className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 transition-all shadow-sm"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Submit Leave Request">
        <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Leave Type *</label>
            <select
              value={applyForm.leaveType}
              onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-semibold"
            >
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Paid">Paid Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">End Date *</label>
              <input
                type="date"
                required
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Reason for Leave *</label>
            <textarea
              required
              rows="3"
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              placeholder="State your reason clearly..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={applyLoading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {applyLoading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveManagementPage;

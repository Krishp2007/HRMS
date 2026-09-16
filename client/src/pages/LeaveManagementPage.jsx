import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const LeaveManagementPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize filter from URL query param if present (e.g. /leaves?status=Pending)
  const initialStatus = searchParams.get('status') || '';
  const [statusFilter, setStatusFilter] = useState(initialStatus);

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
      setCurrentPage(1);
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

  // Pagination calculation
  const totalPages = Math.ceil(leaves.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeaves = leaves.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Leave Requests</h2>
          <p className="text-xs font-semibold text-slate-500">Apply for time-off, manage leave applications, and process approvals</p>
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

      {/* Filter Header Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-black text-slate-900">
          {role === 'HR' ? 'Company Leave Applications' : role === 'Manager' ? 'Team Leave Applications' : 'My Applications'}
        </h3>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending Review Only</option>
          <option value="Approved">Approved Leaves Only</option>
          <option value="Rejected">Rejected Only</option>
        </select>
      </div>

      {/* Main Leave Grid View (No HTML tables) */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm font-extrabold text-slate-500">No leave applications found matching your status filter.</p>
        </div>
      ) : (
        <>
          {/* Responsive Leave Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedLeaves.map((l) => (
              <div
                key={l._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {l.employeeId?.fullName || 'Employee Application'}
                      </span>
                      <p className="text-xs text-slate-500 font-mono">
                        {l.employeeId?.employeeId} • {l.employeeId?.department}
                      </p>
                    </div>
                    <Badge variant={l.status} size="xs">{l.status}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold text-[10px]">Type:</span>
                      <Badge variant={l.leaveType} size="xs">{l.leaveType}</Badge>
                    </div>
                    <span className="font-black text-indigo-600">{l.totalDays} Day(s)</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                      <span>{new Date(l.startDate).toLocaleDateString()}</span>
                      <span className="text-slate-400">to</span>
                      <span>{new Date(l.endDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 text-xs italic mt-1">"{l.reason}"</p>
                    {l.rejectionReason && (
                      <p className="text-[10px] text-rose-600 font-bold border-t border-slate-200/60 pt-1 mt-1">
                        Rejection Reason: {l.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Manager / HR Direct Actions */}
                {(role === 'HR' || role === 'Manager') && l.status === 'Pending' && (
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleApprove(l._id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(l._id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-all shadow-sm"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Leave Cards Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, leaves.length)} of {leaves.length} leave applications
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs font-black text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

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

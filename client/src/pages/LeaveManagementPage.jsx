import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Select from '../components/Select';
import {
  CalendarDays,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar as CalendarIcon,
  Tag,
  FileText,
  Building,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const LeaveManagementPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');

  // Synchronize statusFilter with URL search parameters (e.g. /leaves?status=Pending or /leaves?status=Approved)
  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    setStatusFilter(urlStatus);
    setCurrentPage(1);
  }, [searchParams]);

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
    if (val) {
      setSearchParams({ status: val });
    } else {
      setSearchParams({});
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Apply Leave Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [leaveData, setLeaveData] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Action Confirmation Modals
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [targetLeave, setTargetLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const role = user?.role;

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      let res;
      if (role === 'HR') {
        res = await api.get('/leaves/all-requests');
      } else if (role === 'Manager') {
        res = await api.get('/leaves/team-requests');
      } else {
        res = await api.get('/leaves/my-requests');
      }
      setLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [role]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');

    if (!leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
      setApplyError('Please fill in all mandatory fields.');
      return;
    }

    if (new Date(leaveData.endDate) < new Date(leaveData.startDate)) {
      setApplyError('End date cannot be earlier than start date.');
      return;
    }

    setApplyLoading(true);
    try {
      await api.post('/leaves', leaveData);
      setIsApplyModalOpen(false);
      setLeaveData({
        leaveType: 'Casual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchLeaves();
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setApplyLoading(false);
    }
  };

  const openApproveModal = (leave) => {
    setTargetLeave(leave);
    setIsApproveConfirmOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!targetLeave) return;
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${targetLeave._id}/approve`);
      setIsApproveConfirmOpen(false);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve leave request.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (leave) => {
    setTargetLeave(leave);
    setRejectionReason('');
    setIsRejectConfirmOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetLeave) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a mandatory reason for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${targetLeave._id}/reject`, { rejectionReason });
      setIsRejectConfirmOpen(false);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject leave request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate Days count preview for modal
  const calculateTotalDays = () => {
    if (!leaveData.startDate || !leaveData.endDate) return 0;
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Filtered & Paginated List
  const filteredLeaves = leaves.filter((leave) => {
    if (!statusFilter) return true;
    return leave.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Custom Select Options
  const statusFilterOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending Approval', value: 'Pending' },
    { label: 'Approved Time-Off', value: 'Approved' },
    { label: 'Rejected Applications', value: 'Rejected' },
  ];

  const leaveTypeOptions = [
    { label: 'Casual Leave', value: 'Casual' },
    { label: 'Sick Leave', value: 'Sick' },
    { label: 'Paid Leave', value: 'Paid' },
    { label: 'Unpaid Leave', value: 'Unpaid' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Leave Requests</h2>
          <p className="text-xs font-bold text-slate-700">Apply for time-off, track progress, and manage leave approvals</p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-sm font-black text-slate-900">
          {role === 'Employee' ? 'My Time-Off Applications' : 'Company Leave Applications'}
        </h3>

        <div className="w-full sm:w-64">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            placeholder="All Statuses"
            icon={Filter}
          />
        </div>
      </div>

      {/* Main Leave Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : paginatedLeaves.length === 0 ? (
        <div className="rounded-2xl border border-blue-200 bg-white p-12 text-center">
          <p className="text-sm font-black text-slate-800">No leave requests found matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {paginatedLeaves.map((leave) => (
              <div
                key={leave._id}
                className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-tight">
                        {leave.employeeId?.fullName || user.fullName}
                      </h4>
                      <p className="text-xs font-mono font-black text-slate-600 mt-0.5">
                        {leave.employeeId?.employeeId || user.employeeId} • {leave.employeeId?.department || user.department}
                      </p>
                    </div>
                    <Badge variant={leave.status} size="xs">{leave.status}</Badge>
                  </div>

                  <div className="mt-4 rounded-xl bg-sky-50/70 border border-blue-100 p-3 space-y-2 text-xs font-bold text-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Type:</span>
                      <Badge variant={leave.leaveType} size="xs">{leave.leaveType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-black text-blue-900">{leave.totalDays} Day(s)</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-blue-100/60 font-mono text-[11px] font-black text-slate-900">
                      <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                      <span className="text-slate-400 font-sans text-xs">to</span>
                      <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-slate-700 italic font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      "{leave.reason}"
                    </p>
                  </div>

                  {leave.status === 'Rejected' && leave.rejectionReason && (
                    <div className="mt-2 text-xs font-black text-rose-800 bg-rose-50 p-2 rounded-xl border border-rose-200">
                      Rejection Reason: {leave.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Approve/Reject Action Buttons (Manager/HR) */}
                {(role === 'HR' || role === 'Manager') && leave.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openApproveModal(leave)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => openRejectModal(leave)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2 text-xs font-black text-white hover:bg-rose-700 transition-all shadow-sm"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-black text-slate-800">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredLeaves.length)} of {filteredLeaves.length} requests
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-2.5 sm:px-3 py-1.5 text-xs font-black text-slate-900 hover:bg-blue-100 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="text-xs font-black text-slate-900 px-2">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-2.5 sm:px-3 py-1.5 text-xs font-black text-slate-900 hover:bg-blue-100 disabled:opacity-40 transition-all"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        isOpen={isApproveConfirmOpen}
        onClose={() => setIsApproveConfirmOpen(false)}
        onConfirm={handleConfirmApprove}
        title="Approve Leave Application"
        message={`Are you sure you want to approve time-off for ${targetLeave?.employeeId?.fullName} (${targetLeave?.totalDays} Days)?`}
        confirmText="Approve Leave"
        variant="success"
        loading={actionLoading}
      />

      {/* Reject Confirmation Modal with Reason */}
      <Modal
        isOpen={isRejectConfirmOpen}
        onClose={() => setIsRejectConfirmOpen(false)}
        title="Reject Leave Application"
      >
        <div className="space-y-4 text-xs">
          <p className="font-bold text-slate-800">
            Please provide a mandatory reason for rejecting {targetLeave?.employeeId?.fullName}'s leave request:
          </p>

          <div>
            <label className="block text-slate-900 font-black mb-1">Rejection Reason *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Critical sales project deadline on selected dates..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-xl border border-rose-200 bg-rose-50/50 p-2.5 text-slate-900 font-bold focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-2">
            <button
              onClick={() => setIsRejectConfirmOpen(false)}
              className="rounded-xl border border-blue-200 bg-sky-50 px-4 py-2.5 font-black text-slate-800 hover:bg-blue-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="rounded-xl bg-rose-600 px-5 py-2.5 font-black text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Enhanced Apply For Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply For Time-Off"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
          {applyError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {/* Leave Type Select */}
          <Select
            label="Leave Type Category *"
            options={leaveTypeOptions}
            value={leaveData.leaveType}
            onChange={(val) => setLeaveData({ ...leaveData, leaveType: val })}
            icon={Tag}
          />

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-900 font-black mb-1">Start Date *</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={leaveData.startDate}
                  onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                  className="w-full rounded-xl border border-blue-200 bg-sky-50/60 p-2.5 text-slate-900 font-black focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-900 font-black mb-1">End Date *</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={leaveData.endDate}
                  onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                  className="w-full rounded-xl border border-blue-200 bg-sky-50/60 p-2.5 text-slate-900 font-black focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live Calculated Duration Preview Badge */}
          {calculateTotalDays() > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-black text-blue-900">
              <span>Total Leave Duration:</span>
              <span className="text-sm font-black text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm">
                {calculateTotalDays()} Day(s)
              </span>
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label className="block text-slate-900 font-black mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              required
              placeholder="Provide clear details regarding your time-off request..."
              value={leaveData.reason}
              onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
              className="w-full rounded-xl border border-blue-200 bg-sky-50/60 p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={applyLoading}
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {applyLoading ? 'Submitting Application...' : 'Submit Leave Application'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveManagementPage;

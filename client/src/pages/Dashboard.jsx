import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import EmployeeProfileModal from '../components/EmployeeProfileModal';
import {
  Users,
  UserCheck,
  Clock,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  LogIn,
  LogOut as LogOutIcon,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Daily Check-In/Out State
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Pending Leave Requests for Direct Approvals Desk
  const [pendingLeaves, setPendingLeaves] = useState([]);

  // Employees Grid Preview
  const [previewEmployees, setPreviewEmployees] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Approval/Rejection Modals
  const [targetLeave, setTargetLeave] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deskActionLoading, setDeskActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, todayRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/attendance/today-status'),
      ]);

      setStats(statsRes.data);
      setTodayAttendance(todayRes.data);

      if (user?.role === 'Manager') {
        const [leavesRes, empsRes] = await Promise.all([
          api.get('/leaves/team-requests?status=Pending'),
          api.get('/employees'),
        ]);
        setPendingLeaves(leavesRes.data);
        setPreviewEmployees(empsRes.data.slice(0, 6));
      } else if (user?.role === 'HR') {
        const [leavesRes, empsRes] = await Promise.all([
          api.get('/leaves/all-requests?status=Pending'),
          api.get('/employees'),
        ]);
        setPendingLeaves(leavesRes.data);
        setPreviewEmployees(empsRes.data.slice(0, 6));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.post('/attendance/check-in');
      setActionMsg('✅ Checked in successfully!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.post('/attendance/check-out');
      setActionMsg('✅ Checked out successfully!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openApproveModal = (leave) => {
    setTargetLeave(leave);
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!targetLeave) return;
    setDeskActionLoading(true);
    try {
      await api.patch(`/leaves/${targetLeave._id}/approve`);
      setIsApproveModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve leave');
    } finally {
      setDeskActionLoading(false);
    }
  };

  const openRejectModal = (leave) => {
    setTargetLeave(leave);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetLeave || !rejectionReason.trim()) return;
    setDeskActionLoading(true);
    try {
      await api.patch(`/leaves/${targetLeave._id}/reject`, { rejectionReason });
      setIsRejectModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject leave');
    } finally {
      setDeskActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const role = user?.role;
  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Header Banner */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Welcome, {user?.fullName}! 👋
              </h2>
              <Badge variant={role}>{role}</Badge>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-700">
              {role === 'HR' && 'Corporate human resources & workforce overview.'}
              {role === 'Manager' && 'Team operations oversight & leave review.'}
              {role === 'Employee' && 'Personal daily shift check-in & leave portal.'}
            </p>
          </div>
        </div>
      </div>

      {/* Shift Check-In / Check-Out Station */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-black text-blue-700">Daily Attendance Station</span>
          <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {!todayAttendance?.isCheckedIn
              ? 'Ready to start your shift today?'
              : !todayAttendance?.isCheckedOut
              ? 'Shift Active • In Office'
              : 'Shift Completed Today! 🎉'}
          </h3>
          <p className="text-xs text-slate-700 font-bold">
            {todayAttendance?.attendanceRecord?.checkInTime
              ? `Check-In Time: ${new Date(todayAttendance.attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'No check-in recorded yet today.'}
          </p>
          {actionMsg && <p className="text-xs font-black text-emerald-700 mt-1">{actionMsg}</p>}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleCheckIn}
            disabled={actionLoading || todayAttendance?.isCheckedIn}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-all"
          >
            <LogIn className="h-4 w-4" />
            <span>{todayAttendance?.isCheckedIn ? 'Checked In' : 'Check In'}</span>
          </button>
          <button
            onClick={handleCheckOut}
            disabled={actionLoading || !todayAttendance?.isCheckedIn || todayAttendance?.isCheckedOut}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-blue-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition-all"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>{todayAttendance?.isCheckedOut ? 'Checked Out' : 'Check Out'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      {role === 'HR' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Total Staff" value={metrics.totalEmployees || 0} icon={Users} color="blue" subtext="Directory" />
          </div>
          <div onClick={() => navigate('/employees?status=Active')} className="cursor-pointer">
            <StatCard title="Active Staff" value={metrics.activeEmployees || 0} icon={UserCheck} color="emerald" subtext="Active Accounts" />
          </div>
          <div onClick={() => navigate('/employees?status=Present')} className="cursor-pointer">
            <StatCard title="Present Today" value={metrics.presentToday || 0} icon={Clock} color="indigo" subtext="View Present Staff" />
          </div>
          <div onClick={() => navigate('/leaves?status=Approved')} className="cursor-pointer">
            <StatCard title="On Leave Today" value={metrics.onLeaveToday || 0} icon={CalendarDays} color="rose" subtext="Approved Time-Off" />
          </div>
          <div onClick={() => navigate('/leaves?status=Pending')} className="cursor-pointer">
            <StatCard title="Pending Requests" value={metrics.pendingLeaveRequests || 0} icon={AlertCircle} color="amber" subtext="Review Pending" />
          </div>
        </div>
      )}

      {role === 'Manager' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Team Members" value={metrics.totalTeamMembers || 0} icon={Users} color="blue" subtext="Assigned Team" />
          </div>
          <div onClick={() => navigate('/employees?status=Present')} className="cursor-pointer">
            <StatCard title="Team Present" value={metrics.teamPresentToday || 0} icon={UserCheck} color="emerald" subtext="View Team Logs" />
          </div>
          <div onClick={() => navigate('/leaves?status=Approved')} className="cursor-pointer">
            <StatCard title="Team On Leave" value={metrics.teamMembersOnLeave || 0} icon={CalendarDays} color="rose" subtext="Approved Time-Off" />
          </div>
          <div onClick={() => navigate('/leaves?status=Pending')} className="cursor-pointer">
            <StatCard title="Pending Review" value={metrics.pendingTeamApprovals || 0} icon={AlertCircle} color="amber" subtext="Review Applications" />
          </div>
        </div>
      )}

      {role === 'Employee' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard title="Shift Status" value={metrics.todayStatus || 'Not Checked In'} icon={Clock} color={metrics.todayStatus === 'Completed' ? 'emerald' : metrics.todayStatus === 'Checked In' ? 'blue' : 'amber'} />
          <div onClick={() => navigate('/leaves')} className="cursor-pointer">
            <StatCard title="Total Leave Applications" value={metrics.totalLeaveRequests || 0} icon={CalendarDays} color="indigo" subtext="All Time Requests" />
          </div>
          <div onClick={() => navigate('/leaves?status=Pending')} className="cursor-pointer">
            <StatCard title="Pending Review" value={metrics.pendingRequests || 0} icon={AlertCircle} color="amber" subtext="View Pending" />
          </div>
          <div onClick={() => navigate('/leaves?status=Approved')} className="cursor-pointer">
            <StatCard title="Approved Leaves" value={metrics.approvedRequests || 0} icon={CheckCircle2} color="emerald" subtext="View Approved" />
          </div>
        </div>
      )}

      {/* Direct Pending Leave Approvals Desk */}
      {(role === 'Manager' || role === 'HR') && pendingLeaves.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">Pending Approvals ({pendingLeaves.length})</h3>
            </div>
            <button onClick={() => navigate('/leaves?status=Pending')} className="text-xs font-black text-blue-700 hover:underline shrink-0">
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((l) => (
              <div key={l._id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 text-sm">{l.employeeId?.fullName}</span>
                    <p className="text-xs text-slate-700 font-bold">{l.employeeId?.department} • {l.employeeId?.designation}</p>
                  </div>
                  <Badge variant={l.leaveType}>{l.leaveType}</Badge>
                </div>

                <div className="text-xs text-slate-800 font-bold">
                  <span className="font-black text-blue-700">Duration: </span>
                  {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} Days)
                  <p className="text-slate-600 mt-1 italic font-medium">"{l.reason}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openApproveModal(l)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => openRejectModal(l)}
                    className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-700 transition-all shadow-sm"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personnel Quick Access */}
      {(role === 'Manager' || role === 'HR') && (
        <div className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Personnel Quick Access</h3>
            <button
              onClick={() => navigate('/employees')}
              className="flex items-center gap-1 text-xs font-black text-blue-700 hover:text-blue-800 transition-colors"
            >
              <span>View Full Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewEmployees.map((emp) => (
              <div
                key={emp._id}
                onClick={() => {
                  setSelectedProfileId(emp._id);
                  setIsProfileModalOpen(true);
                }}
                className="rounded-xl border border-blue-200 bg-sky-50/40 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 group-hover:text-blue-700 transition-colors text-sm">
                        {emp.fullName}
                      </h4>
                      <p className="text-xs text-blue-700 font-mono font-black">{emp.employeeId}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status} size="xs">{emp.status}</Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <Badge variant={emp.role} size="xs">{emp.role}</Badge>
                  <span className="text-[10px] font-black text-blue-700 group-hover:underline">View Deep Profile →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desk Approval Confirmation Modal */}
      <ConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleConfirmApprove}
        title="Approve Leave Application"
        message={`Approve time-off for ${targetLeave?.employeeId?.fullName} (${targetLeave?.totalDays} Days)?`}
        confirmText="Approve"
        variant="success"
        loading={deskActionLoading}
      />

      {/* Desk Rejection Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Leave Application"
      >
        <div className="space-y-4 text-xs">
          <p className="font-bold text-slate-800">
            Provide a mandatory reason for rejecting {targetLeave?.employeeId?.fullName}'s leave request:
          </p>

          <div>
            <label className="block text-slate-900 font-black mb-1">Rejection Reason *</label>
            <textarea
              rows={3}
              required
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-xl border border-rose-200 bg-rose-50/50 p-2.5 text-slate-900 font-bold focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="rounded-xl border border-blue-200 bg-sky-50 px-4 py-2.5 font-black text-slate-800 hover:bg-blue-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={deskActionLoading || !rejectionReason.trim()}
              className="rounded-xl bg-rose-600 px-5 py-2.5 font-black text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
            >
              {deskActionLoading ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deep Profile View Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        employeeId={selectedProfileId}
      />
    </div>
  );
};

export default Dashboard;

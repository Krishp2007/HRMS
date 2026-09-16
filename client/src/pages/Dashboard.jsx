import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
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
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
  Briefcase,
  Building,
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

  // Pending Leave Requests for HR/Manager Direct Approvals
  const [pendingLeaves, setPendingLeaves] = useState([]);

  // Employees Grid Preview for Dashboard
  const [previewEmployees, setPreviewEmployees] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const handleApproveLeave = async (leaveId) => {
    if (window.confirm('Approve this leave request directly from dashboard?')) {
      try {
        await api.patch(`/leaves/${leaveId}/approve`);
        fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve leave');
      }
    }
  };

  const handleRejectLeave = async (leaveId) => {
    const reason = window.prompt('Enter mandatory rejection reason:');
    if (!reason) return;
    try {
      await api.patch(`/leaves/${leaveId}/reject`, { rejectionReason: reason });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject leave');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const role = user?.role;
  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Light Corporate Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge variant={role}>{role} Operations Desk</Badge>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Live Workspace
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {user?.fullName}! 👋
            </h2>
            <p className="mt-1.5 text-sm font-medium text-slate-600 max-w-xl">
              {role === 'HR' && 'Corporate human resources administration & workforce overview.'}
              {role === 'Manager' && 'Team operations oversight, direct attendance tracking & leave review.'}
              {role === 'Employee' && 'Personal daily attendance check-in/out station & leave hub.'}
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/attendance')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
            >
              <Clock className="h-4 w-4" />
              <span>Attendance Hub</span>
            </button>
            <button
              onClick={() => navigate('/leaves')}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Apply / View Leave</span>
            </button>
            {(role === 'HR' || role === 'Manager') && (
              <button
                onClick={() => navigate('/employees')}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <Users className="h-4 w-4" />
                <span>Directory</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quick Check-In / Out Station */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
            <Clock className="h-4 w-4" />
            <span>Shift Attendance Tracker</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            {!todayAttendance?.isCheckedIn
              ? 'Ready to start your shift today?'
              : !todayAttendance?.isCheckedOut
              ? 'Shift Active • In Office'
              : 'Shift Completed Today! 🎉'}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {todayAttendance?.attendanceRecord?.checkInTime
              ? `Check-In Time: ${new Date(todayAttendance.attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'No check-in recorded yet for today.'}
          </p>
          {actionMsg && <p className="text-xs font-bold text-emerald-600 mt-1">{actionMsg}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckIn}
            disabled={actionLoading || todayAttendance?.isCheckedIn}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-all"
          >
            <LogIn className="h-4 w-4" />
            <span>{todayAttendance?.isCheckedIn ? 'Checked In' : 'Check In Now'}</span>
          </button>
          <button
            onClick={handleCheckOut}
            disabled={actionLoading || !todayAttendance?.isCheckedIn || todayAttendance?.isCheckedOut}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-40 transition-all"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>{todayAttendance?.isCheckedOut ? 'Checked Out' : 'Check Out Now'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      {role === 'HR' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Total Staff" value={metrics.totalEmployees || 0} icon={Users} color="indigo" subtext="Directory" />
          </div>
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Active Staff" value={metrics.activeEmployees || 0} icon={UserCheck} color="emerald" subtext="Active Accounts" />
          </div>
          <div onClick={() => navigate('/attendance')} className="cursor-pointer">
            <StatCard title="Present Today" value={metrics.presentToday || 0} icon={Clock} color="blue" subtext="In Office" />
          </div>
          <div onClick={() => navigate('/leaves')} className="cursor-pointer">
            <StatCard title="On Leave Today" value={metrics.onLeaveToday || 0} icon={CalendarDays} color="rose" subtext="Approved Time-Off" />
          </div>
          <div onClick={() => navigate('/leaves')} className="cursor-pointer">
            <StatCard title="Pending Requests" value={metrics.pendingLeaveRequests || 0} icon={AlertCircle} color="amber" subtext="Requires Action" />
          </div>
        </div>
      )}

      {role === 'Manager' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Team Members" value={metrics.totalTeamMembers || 0} icon={Users} color="indigo" subtext="Assigned Team" />
          </div>
          <div onClick={() => navigate('/attendance')} className="cursor-pointer">
            <StatCard title="Team Present" value={metrics.teamPresentToday || 0} icon={UserCheck} color="emerald" subtext="Present Today" />
          </div>
          <div onClick={() => navigate('/leaves')} className="cursor-pointer">
            <StatCard title="Team On Leave" value={metrics.teamMembersOnLeave || 0} icon={CalendarDays} color="rose" subtext="Time-Off Today" />
          </div>
          <div onClick={() => navigate('/leaves')} className="cursor-pointer">
            <StatCard title="Pending Review" value={metrics.pendingTeamApprovals || 0} icon={AlertCircle} color="amber" subtext="Awaiting Action" />
          </div>
        </div>
      )}

      {role === 'Employee' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Shift Status" value={metrics.todayStatus || 'Not Checked In'} icon={Clock} color={metrics.todayStatus === 'Completed' ? 'emerald' : metrics.todayStatus === 'Checked In' ? 'blue' : 'amber'} />
          <StatCard title="Total Applications" value={metrics.totalLeaveRequests || 0} icon={CalendarDays} color="indigo" />
          <StatCard title="Pending Review" value={metrics.pendingRequests || 0} icon={AlertCircle} color="amber" />
          <StatCard title="Approved Leaves" value={metrics.approvedRequests || 0} icon={CheckCircle2} color="emerald" />
        </div>
      )}

      {/* Direct Pending Leave Approvals Widget for Manager & HR */}
      {(role === 'Manager' || role === 'HR') && pendingLeaves.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-black text-slate-900">Pending Leave Approvals Desk ({pendingLeaves.length})</h3>
            </div>
            <button onClick={() => navigate('/leaves')} className="text-xs font-bold text-indigo-600 hover:underline">
              View All Requests →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((l) => (
              <div key={l._id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">{l.employeeId?.fullName}</span>
                    <p className="text-xs text-slate-500">{l.employeeId?.department} • {l.employeeId?.designation}</p>
                  </div>
                  <Badge variant={l.leaveType}>{l.leaveType}</Badge>
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-indigo-600">Duration: </span>
                  {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} Days)
                  <p className="text-slate-500 mt-1 italic">"{l.reason}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleApproveLeave(l._id)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectLeave(l._id)}
                    className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-all shadow-sm"
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

      {/* Personnel Quick Access Grid Widget */}
      {(role === 'Manager' || role === 'HR') && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Personnel Quick Access</h3>
            <button
              onClick={() => navigate('/employees')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
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
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                        {emp.fullName}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">{emp.employeeId}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status} size="xs">{emp.status}</Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-1 border-t border-slate-200/60 pt-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>{emp.designation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>{emp.department} • <Badge variant={emp.role} size="xs">{emp.role}</Badge></span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProfileId(emp._id);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Deep Profile</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Profile View Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        employeeId={selectedProfileId}
        isHR={role === 'HR'}
      />
    </div>
  );
};

export default Dashboard;

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
  TrendingUp,
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Daily Check-In/Out Widget State
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Pending Leave Requests for HR/Manager Direct Approvals on Dashboard
  const [pendingLeaves, setPendingLeaves] = useState([]);

  // Employees List Preview for HR/Manager Dashboard
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
        setPreviewEmployees(empsRes.data.slice(0, 5));
      } else if (user?.role === 'HR') {
        const [leavesRes, empsRes] = await Promise.all([
          api.get('/leaves/all-requests?status=Pending'),
          api.get('/employees'),
        ]);
        setPendingLeaves(leavesRes.data);
        setPreviewEmployees(empsRes.data.slice(0, 5));
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const role = user?.role;
  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-950 via-purple-950/40 to-slate-950 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Badge variant={role}>{role} Command Portal</Badge>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Live Workspace
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-white tracking-tight">
              Welcome back, {user?.fullName}! 👋
            </h2>
            <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
              {role === 'HR' && 'Real-time corporate administrative dashboard & employee lifecycle analytics.'}
              {role === 'Manager' && 'Team operations oversight, direct attendance tracking & leave approval desk.'}
              {role === 'Employee' && 'Personal daily attendance check-in/out station & time-off management.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/attendance')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all"
            >
              <Clock className="h-4 w-4" />
              <span>Attendance Hub</span>
            </button>
            <button
              onClick={() => navigate('/leaves')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Apply / View Leave</span>
            </button>
            {(role === 'HR' || role === 'Manager') && (
              <button
                onClick={() => navigate('/employees')}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all"
              >
                <Users className="h-4 w-4" />
                <span>Directory</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quick Check-In / Out Station */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Clock className="h-4 w-4" />
            <span>Today's Work Shift Tracker</span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            {!todayAttendance?.isCheckedIn
              ? 'Ready to start your shift?'
              : !todayAttendance?.isCheckedOut
              ? 'Shift Active • In Office'
              : 'Shift Completed Today! 🎉'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {todayAttendance?.attendanceRecord?.checkInTime
              ? `Check-In Time: ${new Date(todayAttendance.attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'No check-in recorded yet for today.'}
          </p>
          {actionMsg && <p className="text-xs font-bold text-emerald-400 mt-1">{actionMsg}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckIn}
            disabled={actionLoading || todayAttendance?.isCheckedIn}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-600/25 hover:bg-emerald-500 disabled:opacity-40 transition-all"
          >
            <LogIn className="h-4 w-4" />
            <span>{todayAttendance?.isCheckedIn ? 'Checked In' : 'Check In Now'}</span>
          </button>
          <button
            onClick={handleCheckOut}
            disabled={actionLoading || !todayAttendance?.isCheckedIn || todayAttendance?.isCheckedOut}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-purple-600/25 hover:bg-purple-500 disabled:opacity-40 transition-all"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>{todayAttendance?.isCheckedOut ? 'Checked Out' : 'Check Out Now'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Stats Cards */}
      {role === 'HR' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Total Staff" value={metrics.totalEmployees || 0} icon={Users} color="indigo" subtext="Company Directory" />
          </div>
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Active Personnel" value={metrics.activeEmployees || 0} icon={UserCheck} color="emerald" subtext="Active Accounts" />
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div onClick={() => navigate('/employees')} className="cursor-pointer">
            <StatCard title="Team Members" value={metrics.totalTeamMembers || 0} icon={Users} color="indigo" subtext="Assigned Team" />
          </div>
          <div onClick={() => navigate('/attendance')} className="cursor-pointer">
            <StatCard title="Team Present Today" value={metrics.teamPresentToday || 0} icon={UserCheck} color="emerald" subtext="Present Shift" />
          </div>
          <div onClick={() => navigate('/leaves')} className="cursor-pointer">
            <StatCard title="Team On Leave" value={metrics.teamMembersOnLeave || 0} icon={CalendarDays} color="rose" subtext="Time-off Today" />
          </div>
          <div onClick={() => navigate('/leaves')} className="cursor-pointer">
            <StatCard title="Pending Approvals" value={metrics.pendingTeamApprovals || 0} icon={AlertCircle} color="amber" subtext="Awaiting Review" />
          </div>
        </div>
      )}

      {role === 'Employee' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Today Shift Status" value={metrics.todayStatus || 'Not Checked In'} icon={Clock} color={metrics.todayStatus === 'Completed' ? 'emerald' : metrics.todayStatus === 'Checked In' ? 'blue' : 'amber'} />
          <StatCard title="Total Applications" value={metrics.totalLeaveRequests || 0} icon={CalendarDays} color="indigo" />
          <StatCard title="Pending Review" value={metrics.pendingRequests || 0} icon={AlertCircle} color="amber" />
          <StatCard title="Approved Leaves" value={metrics.approvedRequests || 0} icon={CheckCircle2} color="emerald" />
        </div>
      )}

      {/* Direct Pending Leave Approvals Widget for Manager & HR */}
      {(role === 'Manager' || role === 'HR') && pendingLeaves.length > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-extrabold text-white">Pending Leave Approvals Desk ({pendingLeaves.length})</h3>
            </div>
            <button onClick={() => navigate('/leaves')} className="text-xs font-bold text-amber-400 hover:underline">
              View All Requests →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((l) => (
              <div key={l._id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-sm">{l.employeeId?.fullName}</span>
                    <p className="text-xs text-slate-400">{l.employeeId?.department} • {l.employeeId?.designation}</p>
                  </div>
                  <Badge variant={l.leaveType}>{l.leaveType}</Badge>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-indigo-400">Duration: </span>
                  {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} Days)
                  <p className="text-slate-400 mt-1 italic">"{l.reason}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleApproveLeave(l._id)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleRejectLeave(l._id)}
                    className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-md"
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

      {/* Directory Quick Preview Widget for Manager & HR */}
      {(role === 'Manager' || role === 'HR') && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white">Personnel Quick Access</h3>
            <button
              onClick={() => navigate('/employees')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>View Full Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role / Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Deep Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {previewEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{emp.fullName}</span>
                      <p className="text-xs text-slate-400">{emp.employeeId} • {emp.designation}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-slate-200">{emp.department}</span>
                      <p className="text-[10px] text-slate-400">{emp.role}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={emp.status}>{emp.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedProfileId(emp._id);
                          setIsProfileModalOpen(true);
                        }}
                        className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all ml-auto"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

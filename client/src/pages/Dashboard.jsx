import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { Users, UserCheck, Clock, CalendarDays, AlertCircle, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-sm font-semibold text-rose-400">
        {error}
      </div>
    );
  }

  const role = user?.role;
  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Badge variant={role}>{role} Dashboard</Badge>
            <span className="text-xs text-slate-400">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.fullName}! 👋
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {role === 'HR' && 'Company-wide HR & Administrative Intelligence Center'}
            {role === 'Manager' && 'Team Leadership & Operations Management Workspace'}
            {role === 'Employee' && 'Personal Workstation, Attendance & Leave Portal'}
          </p>
        </div>
      </div>

      {/* HR Stats Grid */}
      {role === 'HR' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Employees" value={metrics.totalEmployees || 0} icon={Users} color="indigo" />
          <StatCard title="Active Employees" value={metrics.activeEmployees || 0} icon={UserCheck} color="emerald" />
          <StatCard title="Present Today" value={metrics.presentToday || 0} icon={Clock} color="blue" />
          <StatCard title="Employees On Leave" value={metrics.onLeaveToday || 0} icon={CalendarDays} color="rose" />
          <StatCard title="Pending Requests" value={metrics.pendingLeaveRequests || 0} icon={AlertCircle} color="amber" />
        </div>
      )}

      {/* Manager Stats Grid */}
      {role === 'Manager' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Team Members" value={metrics.totalTeamMembers || 0} icon={Users} color="indigo" />
          <StatCard title="Team Present Today" value={metrics.teamPresentToday || 0} icon={UserCheck} color="emerald" />
          <StatCard title="Team On Leave" value={metrics.teamMembersOnLeave || 0} icon={CalendarDays} color="rose" />
          <StatCard title="Pending Approvals" value={metrics.pendingTeamApprovals || 0} icon={AlertCircle} color="amber" />
        </div>
      )}

      {/* Employee Stats Grid */}
      {role === 'Employee' && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Today's Status" value={metrics.todayStatus || 'Not Checked In'} icon={Clock} color={metrics.todayStatus === 'Completed' ? 'emerald' : metrics.todayStatus === 'Checked In' ? 'blue' : 'amber'} />
            <StatCard title="Total Leaves" value={metrics.totalLeaveRequests || 0} icon={CalendarDays} color="indigo" />
            <StatCard title="Pending Requests" value={metrics.pendingRequests || 0} icon={AlertCircle} color="amber" />
            <StatCard title="Approved Leaves" value={metrics.approvedRequests || 0} icon={CheckCircle2} color="emerald" />
          </div>

          {/* Recent Attendance Log */}
          {metrics.recentAttendance && metrics.recentAttendance.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Recent Attendance Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check In</th>
                      <th className="py-3 px-4">Check Out</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {metrics.recentAttendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">{rec.date}</td>
                        <td className="py-3 px-4 text-emerald-400 font-mono">
                          {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-purple-400 font-mono">
                          {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still checked in'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={rec.status}>{rec.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;

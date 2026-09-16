import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import { Clock, LogIn, LogOut as LogOutIcon, Calendar, CheckCircle2, User, Search } from 'lucide-react';

const AttendancePage = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Date Filter
  const [filterDate, setFilterDate] = useState('');

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const [todayRes, logsRes] = await Promise.all([
        api.get('/attendance/today-status'),
        api.get(`/attendance/history${filterDate ? `?date=${filterDate}` : ''}`),
      ]);

      setTodayStatus(todayRes.data);
      setAttendanceLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [filterDate]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.post('/attendance/check-in');
      setActionMsg('✅ Checked in successfully!');
      fetchAttendanceData();
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
      fetchAttendanceData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const role = user?.role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Operations Hub</h2>
        <p className="text-xs font-semibold text-slate-500">Track shift check-ins, check-outs, and historical log records</p>
      </div>

      {/* Daily Shift Punch Station Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
              <Clock className="h-4 w-4" />
              <span>Today's Shift Action Station ({new Date().toLocaleDateString()})</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {!todayStatus?.isCheckedIn
                ? 'Not Checked In Yet Today'
                : !todayStatus?.isCheckedOut
                ? 'Shift Active (Checked In)'
                : 'Shift Completed Today'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {todayStatus?.attendanceRecord?.checkInTime
                ? `Check-In Recorded: ${new Date(todayStatus.attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Mark your arrival to register attendance for today.'}
            </p>
            {actionMsg && <p className="text-xs font-bold text-emerald-600 mt-1">{actionMsg}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCheckIn}
              disabled={actionLoading || todayStatus?.isCheckedIn}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>{todayStatus?.isCheckedIn ? 'Checked In' : 'Check In'}</span>
            </button>
            <button
              onClick={handleCheckOut}
              disabled={actionLoading || !todayStatus?.isCheckedIn || todayStatus?.isCheckedOut}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-40 transition-all"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>{todayStatus?.isCheckedOut ? 'Checked Out' : 'Check Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & History Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-black text-slate-900">
            {role === 'HR' ? 'All Corporate Attendance Logs' : role === 'Manager' ? 'Team Attendance Records' : 'My Shift History'}
          </h3>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : attendanceLogs.length === 0 ? (
          <p className="text-center py-8 text-xs font-semibold text-slate-500">No attendance logs found for this query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  {(role === 'HR' || role === 'Manager') && <th className="py-3 px-4">Employee</th>}
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    {(role === 'HR' || role === 'Manager') && (
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900">{log.employeeId?.fullName}</span>
                        <p className="text-xs text-slate-500 font-mono">{log.employeeId?.employeeId} • {log.employeeId?.department}</p>
                      </td>
                    )}
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-xs">
                      {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-600 text-xs">
                      {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Office'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={log.status} size="xs">{log.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;

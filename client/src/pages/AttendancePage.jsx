import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import { Clock, LogIn, LogOut as LogOutIcon, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const AttendancePage = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState(null);
  const [allAttendance, setAllAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today-status');
      setTodayStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch today status:', err);
    }
  };

  const fetchMyHistory = async () => {
    try {
      const res = await api.get('/attendance/my-history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    }
  };

  const fetchTeamAttendance = async () => {
    if (user?.role === 'Manager' || user?.role === 'HR') {
      try {
        const res = await api.get(`/attendance/team?date=${selectedDate}`);
        setTeamAttendance(res.data);
      } catch (err) {
        console.error('Failed to fetch team attendance:', err);
      }
    }
  };

  const fetchAllAttendance = async () => {
    if (user?.role === 'HR') {
      try {
        const res = await api.get(`/attendance/all?date=${selectedDate}`);
        setAllAttendance(res.data);
      } catch (err) {
        console.error('Failed to fetch all attendance:', err);
      }
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchTodayStatus(), fetchMyHistory(), fetchTeamAttendance(), fetchAllAttendance()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [selectedDate]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/attendance/check-in');
      setMessage('✅ Check-in recorded successfully!');
      fetchTodayStatus();
      fetchMyHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/attendance/check-out');
      setMessage('✅ Check-out recorded successfully!');
      fetchTodayStatus();
      fetchMyHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const role = user?.role;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Attendance Center</h2>
        <p className="text-xs text-slate-400">Track daily check-ins, check-outs and team presence logs</p>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Daily Check-In/Out Card for Logged-In User */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Calendar className="h-4 w-4" />
              <span>Today: {todayStatus?.date}</span>
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-white">Daily Attendance Action</h3>
            <p className="text-xs text-slate-400">
              {!todayStatus?.isCheckedIn
                ? 'You have not checked in today yet.'
                : !todayStatus?.isCheckedOut
                ? 'Checked in! Remember to check out at end of shift.'
                : 'Attendance completed for today! 🎉'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCheckIn}
              disabled={actionLoading || todayStatus?.isCheckedIn}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-40"
            >
              <LogIn className="h-4 w-4" />
              <span>{todayStatus?.isCheckedIn ? 'Checked In' : 'Check In Now'}</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={actionLoading || !todayStatus?.isCheckedIn || todayStatus?.isCheckedOut}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500 disabled:opacity-40"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>{todayStatus?.isCheckedOut ? 'Checked Out' : 'Check Out Now'}</span>
            </button>
          </div>
        </div>

        {/* Current Day Timestamps */}
        {todayStatus?.attendanceRecord && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4 text-xs">
            <div>
              <span className="text-slate-400">Check-In Time:</span>
              <p className="font-mono text-sm font-semibold text-emerald-400 mt-0.5">
                {new Date(todayStatus.attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Check-Out Time:</span>
              <p className="font-mono text-sm font-semibold text-purple-400 mt-0.5">
                {todayStatus.attendanceRecord.checkOutTime
                  ? new Date(todayStatus.attendanceRecord.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Pending'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Date Picker Selector for Manager/HR */}
      {(role === 'Manager' || role === 'HR') && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-300">Filter Team/Company Logs By Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
          />
        </div>
      )}

      {/* Team Attendance View for Manager */}
      {role === 'Manager' && teamAttendance && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Team Attendance Overview ({selectedDate})</h3>
            <span className="text-xs text-slate-400">
              Present: {teamAttendance.records?.length || 0} / {teamAttendance.totalTeamMembers || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {teamAttendance.records && teamAttendance.records.length > 0 ? (
                  teamAttendance.records.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{rec.employeeId?.fullName}</span>
                        <p className="text-xs text-slate-400">{rec.employeeId?.designation}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-400">
                        {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Office'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={rec.status}>{rec.status}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-slate-500">
                      No team attendance records found for {selectedDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Company Wide Attendance View for HR */}
      {role === 'HR' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Company Attendance Logs ({selectedDate})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Dept</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {allAttendance && allAttendance.length > 0 ? (
                  allAttendance.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{rec.employeeId?.fullName}</span>
                        <p className="text-xs text-slate-400">{rec.employeeId?.employeeId}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">{rec.employeeId?.department}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-400">
                        {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Office'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={rec.status}>{rec.status}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-xs text-slate-500">
                      No attendance logs recorded for {selectedDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Personal History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white">My Attendance Log History</h3>
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
              {history.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{rec.date}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-purple-400">
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
    </div>
  );
};

export default AttendancePage;

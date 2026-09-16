import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import {
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Grid,
  User,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const AttendancePage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // View Mode: 'calendar' (default) or 'grid'
  const [viewMode, setViewMode] = useState('calendar');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Pagination State (for Grid View)
  const [currentPage, setCurrentPage] = useState(1);

  // Optional date filter initialized from URL
  const [filterDate, setFilterDate] = useState(searchParams.get('date') || '');

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const role = user?.role;
      let logsEndpoint = '/attendance/my-history';

      if (role === 'HR') {
        logsEndpoint = `/attendance/all${filterDate ? `?date=${filterDate}` : ''}`;
      } else if (role === 'Manager') {
        logsEndpoint = `/attendance/team${filterDate ? `?date=${filterDate}` : ''}`;
      } else {
        logsEndpoint = '/attendance/my-history';
      }

      const [todayRes, logsRes] = await Promise.all([
        api.get('/attendance/today-status'),
        api.get(logsEndpoint),
      ]);

      setTodayStatus(todayRes.data);

      if (role === 'Manager' && logsRes.data?.records) {
        setAttendanceLogs(logsRes.data.records);
      } else if (Array.isArray(logsRes.data)) {
        setAttendanceLogs(logsRes.data);
      } else {
        setAttendanceLogs([]);
      }
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
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

  // Calendar Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map attendance logs by date for quick lookup in calendar
  const getLogsForDate = (dayNum) => {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
    return attendanceLogs.filter((log) => log.date === dateStr);
  };

  const role = user?.role;

  // Pagination for Grid View
  const totalPages = Math.ceil(attendanceLogs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = attendanceLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Center</h2>
          <p className="text-xs font-semibold text-slate-500">Track daily shift check-ins and view attendance history in calendar or grid format</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Calendar Grid View</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Grid Cards View</span>
          </button>
        </div>
      </div>

      {/* Daily Shift Action Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600">Today's Shift Action Station ({new Date().toLocaleDateString()})</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {!todayStatus?.isCheckedIn
                ? 'Not Checked In Yet'
                : !todayStatus?.isCheckedOut
                ? 'Shift Active • In Office'
                : 'Shift Completed Today! 🎉'}
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
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 transition-all"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>{todayStatus?.isCheckedOut ? 'Checked Out' : 'Check Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Calendar View vs Grid Cards View */}
      {viewMode === 'calendar' ? (
        /* Interactive Calendar Month Grid */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900">
                {monthNames[month]} {year}
              </h3>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                Attendance Calendar
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev Month</span>
              </button>
              <button
                onClick={handleNextMonth}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <span>Next Month</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header (Days of Week) */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-slate-400">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty Slots before month start */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 rounded-2xl bg-slate-50/40 border border-slate-100" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayLogs = getLogsForDate(dayNum);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`h-24 rounded-2xl border p-2 flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isToday ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Attendance Log Pills inside Calendar Cell */}
                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayLogs.length === 0 ? (
                      <span className="text-[10px] text-slate-400 font-medium italic block">-</span>
                    ) : (
                      dayLogs.map((log) => (
                        <div
                          key={log._id}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 p-1 text-[10px] font-bold text-emerald-800 flex items-center justify-between"
                        >
                          <span className="truncate max-w-[80px]">
                            {role === 'HR' || role === 'Manager' ? log.employeeId?.fullName : 'Present'}
                          </span>
                          <span className="font-mono text-[9px]">
                            {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Responsive Grid Cards View with Pagination */
        <div className="space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : attendanceLogs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm font-extrabold text-slate-500">No attendance records found.</p>
            </div>
          ) : (
            <>
              {/* Responsive Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedLogs.map((log) => (
                  <div
                    key={log._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {log.employeeId?.fullName || 'Staff Member'}
                        </span>
                        <p className="text-xs text-slate-500 font-mono">
                          {log.employeeId?.employeeId} • {log.employeeId?.department}
                        </p>
                      </div>
                      <Badge variant={log.status} size="xs">{log.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <span className="text-slate-400 font-bold text-[10px] block">Check In</span>
                        <span className="font-mono font-black text-emerald-600">
                          {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <span className="text-slate-400 font-bold text-[10px] block">Check Out</span>
                        <span className="font-mono font-black text-indigo-600">
                          {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Office'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between pt-1">
                      <span>Date: <strong className="text-slate-900">{log.date}</strong></span>
                      {log.remarks && <span className="text-slate-500 italic">"{log.remarks}"</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid View Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, attendanceLogs.length)} of {attendanceLogs.length} attendance records
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
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

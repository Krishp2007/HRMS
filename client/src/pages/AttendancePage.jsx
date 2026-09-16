import React, { useEffect, useState } from 'react';
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
  User,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';

const AttendancePage = () => {
  const { user } = useAuth();

  const [todayStatus, setTodayStatus] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Calendar Date State (default current month)
  const [currentDate, setCurrentDate] = useState(new Date());

  const role = user?.role;

  // 1. Fetch Today Status and Employee List (if HR/Manager)
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        const todayRes = await api.get('/attendance/today-status');
        setTodayStatus(todayRes.data);

        if (role === 'HR' || role === 'Manager') {
          const empsRes = await api.get('/employees');
          const activeEmps = empsRes.data.filter((e) => e.status === 'Active');
          setEmployeesList(activeEmps);

          if (activeEmps.length > 0) {
            setSelectedEmployeeId(activeEmps[0]._id);
            setSelectedEmployee(activeEmps[0]);
          }
        } else {
          // Employee role
          setSelectedEmployeeId(user._id);
          setSelectedEmployee(user);
        }
      } catch (err) {
        console.error('Failed to initialize attendance page:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [user, role]);

  // 2. Fetch Selected Employee's Attendance History for the Calendar
  const fetchSelectedEmployeeAttendance = async () => {
    if (!selectedEmployeeId) return;

    try {
      setLoading(true);
      let res;
      if (role === 'HR' || role === 'Manager') {
        res = await api.get(`/attendance/all?employeeId=${selectedEmployeeId}`);
      } else {
        res = await api.get('/attendance/my-history');
      }

      setAttendanceLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch employee attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedEmployeeAttendance();
  }, [selectedEmployeeId]);

  const handleEmployeeSelect = (emp) => {
    setSelectedEmployeeId(emp._id);
    setSelectedEmployee(emp);
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.post('/attendance/check-in');
      setActionMsg('✅ Checked in successfully!');
      const todayRes = await api.get('/attendance/today-status');
      setTodayStatus(todayRes.data);
      fetchSelectedEmployeeAttendance();
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
      const todayRes = await api.get('/attendance/today-status');
      setTodayStatus(todayRes.data);
      fetchSelectedEmployeeAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  // Find attendance record for selected date string YYYY-MM-DD
  const getLogForDate = (dayNum) => {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
    return attendanceLogs.find((log) => log.date === dateStr);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Individual Attendance Calendar</h2>
        <p className="text-xs font-bold text-slate-700">
          {role === 'HR' || role === 'Manager'
            ? 'Select an employee to view their complete monthly attendance calendar record'
            : 'View your monthly shift check-in calendar and attendance logs'}
        </p>
      </div>

      {/* Daily Shift Punch Station */}
      <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black text-blue-700">Daily Punch Station ({new Date().toLocaleDateString()})</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {!todayStatus?.isCheckedIn
                ? 'Not Checked In Yet'
                : !todayStatus?.isCheckedOut
                ? 'Shift Active • In Office'
                : 'Shift Completed Today! 🎉'}
            </h3>
            <p className="text-xs text-slate-700 font-bold mt-0.5">
              {todayStatus?.attendanceRecord?.checkInTime
                ? `Check-In Recorded: ${new Date(todayStatus.attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Register your check-in time for today.'}
            </p>
            {actionMsg && <p className="text-xs font-black text-emerald-700 mt-1">{actionMsg}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCheckIn}
              disabled={actionLoading || todayStatus?.isCheckedIn}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>{todayStatus?.isCheckedIn ? 'Checked In' : 'Check In'}</span>
            </button>
            <button
              onClick={handleCheckOut}
              disabled={actionLoading || !todayStatus?.isCheckedIn || todayStatus?.isCheckedOut}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition-all"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>{todayStatus?.isCheckedOut ? 'Checked Out' : 'Check Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employee Selector Bar (HR & Manager Only) */}
      {(role === 'HR' || role === 'Manager') && (
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Select Employee to View Individual Calendar ({employeesList.length} Staff)
            </span>
          </div>

          {/* Quick Select Employee Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {employeesList.map((emp) => {
              const isSelected = emp._id === selectedEmployeeId;
              return (
                <button
                  key={emp._id}
                  onClick={() => handleEmployeeSelect(emp)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-sky-50 text-slate-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black ${
                      isSelected ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {emp.fullName.charAt(0)}
                  </div>
                  <span>{emp.fullName}</span>
                  <span className={`text-[10px] font-mono font-black ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                    ({emp.employeeId})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Employee Calendar Card */}
      <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-6">
        {/* Selected Employee Calendar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-lg shadow-sm">
              {selectedEmployee?.fullName?.charAt(0) || user?.fullName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">
                  {selectedEmployee?.fullName || user?.fullName}'s Attendance Calendar
                </h3>
                <Badge variant={selectedEmployee?.role || user?.role} size="xs">
                  {selectedEmployee?.role || user?.role}
                </Badge>
              </div>
              <p className="text-xs text-slate-700 font-extrabold">
                {selectedEmployee?.employeeId || user?.employeeId} • {selectedEmployee?.department || user?.department} ({selectedEmployee?.designation || user?.designation})
              </p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <h4 className="text-base font-black text-slate-900">
              {monthNames[month]} {year}
            </h4>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-blue-100 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <button
                onClick={handleNextMonth}
                className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-blue-100 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-700">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Individual Calendar Month Day Cells */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2.5">
            {/* Empty Slots before 1st of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 rounded-2xl bg-sky-50/40 border border-slate-200" />
            ))}

            {/* Day Cells 1-31 */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const log = getLogForDate(dayNum);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`h-28 rounded-2xl border p-2.5 flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : log
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isToday ? 'text-blue-800' : 'text-slate-900'}`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-200">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Shift Log Data */}
                  <div className="mt-1 flex-1 flex flex-col justify-center">
                    {!log ? (
                      <div className="text-[10px] text-slate-500 font-bold italic text-center">No Shift</div>
                    ) : (
                      <div className="rounded-xl bg-emerald-100/80 border border-emerald-300 p-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black text-emerald-950">
                          <span>{log.status}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                        </div>
                        <div className="text-[9px] font-mono text-emerald-950 font-black space-y-0.5">
                          <div>
                            In: {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>
                          <div>
                            Out: {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Office'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;

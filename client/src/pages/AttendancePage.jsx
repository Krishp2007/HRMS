import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import Select from '../components/Select';
import Modal from '../components/Modal';
import {
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
  Briefcase,
  Sun,
  Umbrella,
  Search,
  UserCheck,
} from 'lucide-react';

const AttendancePage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [todayStatus, setTodayStatus] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empSearchTerm, setEmpSearchTerm] = useState('');

  // Mode: 'staff' for viewing team/staff member, 'my' for HR/Manager's own attendance
  const [attendanceViewMode, setAttendanceViewMode] = useState('staff');
  const [presenceFilter, setPresenceFilter] = useState(() => (searchParams.get('filter') === 'present' ? 'present' : 'all'));
  const [todayPresentSet, setTodayPresentSet] = useState(new Set());

  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Mobile/Desktop Day Details Modal
  const [selectedDayModalData, setSelectedDayModalData] = useState(null);

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
          const todayStr = new Date().toISOString().split('T')[0];
          const [empsRes, todayLogsRes] = await Promise.all([
            api.get('/employees'),
            api.get(`/attendance/all?date=${todayStr}`).catch(() => ({ data: [] })),
          ]);

          // Set of employee IDs present today
          const presentIds = new Set(
            (Array.isArray(todayLogsRes.data) ? todayLogsRes.data : [])
              .filter((r) => r.status === 'Present' || r.checkInTime)
              .map((r) => (r.employeeId?._id ? r.employeeId._id : r.employeeId))
          );
          setTodayPresentSet(presentIds);

          // Staff list EXCLUDES the logged-in manager/HR user themselves
          const staffEmps = empsRes.data.filter((e) => e.status === 'Active' && e._id !== user._id);
          setEmployeesList(staffEmps);

          const urlFilterPresent = searchParams.get('filter') === 'present';
          if (urlFilterPresent) {
            setPresenceFilter('present');
          }

          if (staffEmps.length > 0) {
            if (urlFilterPresent) {
              const firstPresent = staffEmps.find((e) => presentIds.has(e._id));
              const target = firstPresent || staffEmps[0];
              setSelectedEmployeeId(target._id);
              setSelectedEmployee(target);
            } else {
              setSelectedEmployeeId(staffEmps[0]._id);
              setSelectedEmployee(staffEmps[0]);
            }
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
  }, [user, role, searchParams]);

  // 2. Fetch Selected Employee's Attendance History & Approved Leaves for Calendar
  const fetchSelectedEmployeeData = async () => {
    if (!selectedEmployeeId) return;

    try {
      setLoading(true);
      let attendanceRes;
      let leavesRes;

      if (attendanceViewMode === 'my' || role === 'Employee') {
        [attendanceRes, leavesRes] = await Promise.all([
          api.get('/attendance/my-history'),
          api.get('/leaves/my-requests'),
        ]);
      } else if (role === 'HR') {
        [attendanceRes, leavesRes] = await Promise.all([
          api.get(`/attendance/all?employeeId=${selectedEmployeeId}`),
          api.get('/leaves/all-requests'),
        ]);
      } else if (role === 'Manager') {
        [attendanceRes, leavesRes] = await Promise.all([
          api.get(`/attendance/all?employeeId=${selectedEmployeeId}`),
          api.get('/leaves/team-requests'),
        ]);
      }

      setAttendanceLogs(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);

      // Filter leaves for this selected employee and status === 'Approved'
      const empLeaves = (Array.isArray(leavesRes.data) ? leavesRes.data : []).filter(
        (l) =>
          (l.employeeId?._id === selectedEmployeeId || l.employeeId === selectedEmployeeId) &&
          l.status === 'Approved'
      );
      setLeaveRecords(empLeaves);
    } catch (err) {
      console.error('Failed to fetch employee attendance & leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedEmployeeData();
  }, [selectedEmployeeId, attendanceViewMode]);

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
      fetchSelectedEmployeeData();
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Check-in failed.'}`);
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
      fetchSelectedEmployeeData();
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Check-out failed.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Month Picker Input Handler: e.g. "2026-09"
  const handleMonthPickerChange = (monthVal) => {
    if (!monthVal) return;
    const [yStr, mStr] = monthVal.split('-');
    const newY = parseInt(yStr, 10);
    const newM = parseInt(mStr, 10) - 1;
    setCurrentDate(new Date(newY, newM, 1));
  };

  const monthInputValue = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Find attendance record for selected date string YYYY-MM-DD
  const getLogForDate = (dayNum) => {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
    return attendanceLogs.find((log) => log.date === dateStr);
  };

  // Check if date falls in any approved leave for this employee
  const getApprovedLeaveForDate = (dayNum) => {
    const checkDate = new Date(year, month, dayNum);
    return leaveRecords.find((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return checkDate >= start && checkDate <= end;
    });
  };

  // Monthly Metrics Calculations for Summary Grid above Calendar
  let workingDaysCount = 0;
  let presentDaysCount = 0;
  let approvedLeaveDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek !== 0) {
      workingDaysCount++;
    }

    const log = getLogForDate(d);
    if (log && log.status === 'Present') {
      presentDaysCount++;
    }

    const leave = getApprovedLeaveForDate(d);
    if (leave) {
      approvedLeaveDaysCount++;
    }
  }

  // Employee selector options for custom Select on mobile
  const employeeOptions = employeesList.map((emp) => ({
    label: `${emp.fullName} (${emp.employeeId})`,
    value: emp._id,
  }));

  // Month names for date formatting
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Short day labels for mobile
  const dayLabelsFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayLabelsShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Title & Mode Switcher for HR/Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Attendance & Operations</h2>
          <p className="text-xs font-bold text-slate-700">
            {attendanceViewMode === 'my'
              ? 'Viewing your personal shift check-in calendar and logs'
              : 'Select a staff member to view their monthly attendance record'}
          </p>
        </div>

        {(role === 'HR' || role === 'Manager') && (
          <div className="flex items-center gap-1.5 bg-blue-50/80 p-1 rounded-2xl border border-blue-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => {
                setAttendanceViewMode('staff');
                if (employeesList.length > 0) {
                  setSelectedEmployeeId(employeesList[0]._id);
                  setSelectedEmployee(employeesList[0]);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                attendanceViewMode === 'staff'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Team Attendance</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAttendanceViewMode('my');
                setSelectedEmployeeId(user._id);
                setSelectedEmployee(user);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                attendanceViewMode === 'my'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>My Personal Attendance</span>
            </button>
          </div>
        )}
      </div>

      {/* Daily Shift Punch Station */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <span className="text-xs font-black text-blue-700">Daily Punch Station ({new Date().toLocaleDateString()})</span>
            <h3 className="text-base sm:text-xl font-black text-slate-900 mt-0.5">
              {!todayStatus?.isCheckedIn
                ? 'Not Checked In Yet'
                : !todayStatus?.isCheckedOut
                ? 'Shift Active • In Office'
                : 'Shift Completed Today! 🎉'}
            </h3>
            <p className="text-xs text-slate-700 font-bold mt-0.5">
              {todayStatus?.attendanceRecord?.checkInTime
                ? `Check-In: ${new Date(todayStatus.attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Register your check-in time for today.'}
            </p>
            {actionMsg && <p className="text-xs font-black text-emerald-700 mt-1">{actionMsg}</p>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleCheckIn}
              disabled={actionLoading || todayStatus?.isCheckedIn}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">{todayStatus?.isCheckedIn ? 'Checked In' : 'Check In'}</span>
              <span className="sm:hidden">In</span>
            </button>
            <button
              onClick={handleCheckOut}
              disabled={actionLoading || !todayStatus?.isCheckedIn || todayStatus?.isCheckedOut}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-blue-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <LogOutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{todayStatus?.isCheckedOut ? 'Checked Out' : 'Check Out'}</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Searchable Employee Selector Bar (HR & Manager Only in Staff View) */}
      {(role === 'HR' || role === 'Manager') && attendanceViewMode === 'staff' && (
        <div className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Select Staff Member ({employeesList.length})
              </span>

              {/* Filter Pills: All Staff vs Present Today */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPresenceFilter('all')}
                  className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                    presenceFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({employeesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPresenceFilter('present')}
                  className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                    presenceFilter === 'present'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Present Today ({employeesList.filter((e) => todayPresentSet.has(e._id)).length})
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Search Input by Name or Unique Employee ID */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name or unique ID..."
                value={empSearchTerm}
                onChange={(e) => setEmpSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-blue-200 bg-sky-50/70 pl-10 pr-9 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-500 transition-all"
              />
              {empSearchTerm && (
                <button
                  type="button"
                  onClick={() => setEmpSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 hover:text-slate-800 bg-slate-200/80 rounded-full h-4 w-4 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Selector of Employees */}
            {(() => {
              const filteredStaff = employeesList.filter((emp) => {
                if (presenceFilter === 'present' && !todayPresentSet.has(emp._id)) {
                  return false;
                }
                const query = empSearchTerm.toLowerCase();
                return (
                  emp.fullName?.toLowerCase().includes(query) ||
                  emp.employeeId?.toLowerCase().includes(query) ||
                  emp.department?.toLowerCase().includes(query)
                );
              });

              const dropdownOptions = filteredStaff.map((emp) => ({
                label: `${emp.fullName} (${emp.employeeId})`,
                value: emp._id,
              }));

              return (
                <Select
                  options={dropdownOptions}
                  value={selectedEmployeeId}
                  onChange={(empId) => {
                    const found = employeesList.find((e) => e._id === empId);
                    if (found) handleEmployeeSelect(found);
                  }}
                  placeholder={
                    filteredStaff.length === 0
                      ? 'No matching staff found'
                      : 'Choose staff member...'
                  }
                  icon={User}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Monthly Summary Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-blue-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Total Days</p>
              <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-1">{daysInMonth}</h4>
            </div>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800 shrink-0">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Working</p>
              <h4 className="text-lg sm:text-xl font-black text-indigo-950 mt-1">{workingDaysCount}</h4>
            </div>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 shrink-0">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Present</p>
              <h4 className="text-lg sm:text-xl font-black text-emerald-950 mt-1">{presentDaysCount}</h4>
            </div>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Leaves</p>
              <h4 className="text-lg sm:text-xl font-black text-amber-950 mt-1">{approvedLeaveDaysCount}</h4>
            </div>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Umbrella className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Individual Employee Calendar Card */}
      <div className="rounded-2xl border border-blue-200 bg-white p-3 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
        {/* Selected Employee Calendar Header with Month/Year Picker */}
        <div className="flex flex-col gap-3 sm:gap-4 border-b border-slate-200 pb-3 sm:pb-4">
          {/* Employee Info Row */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-base sm:text-lg shadow-sm shrink-0">
              {selectedEmployee?.fullName?.charAt(0) || user?.fullName?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                  {selectedEmployee?.fullName || user?.fullName}
                </h3>
                <Badge variant={selectedEmployee?.role || user?.role} size="xs">
                  {selectedEmployee?.role || user?.role}
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-700 font-extrabold truncate">
                {selectedEmployee?.employeeId || user?.employeeId} • {selectedEmployee?.department || user?.department}
              </p>
            </div>
          </div>

          {/* Month/Year Picker + Prev/Next Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-sky-50 border border-blue-200 rounded-xl px-2.5 sm:px-3 py-1.5">
              <CalendarIcon className="h-4 w-4 text-blue-600 shrink-0" />
              <input
                type="month"
                value={monthInputValue}
                onChange={(e) => handleMonthPickerChange(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer w-[130px]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-2.5 sm:px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-blue-100 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                onClick={handleNextMonth}
                className="flex items-center gap-1 rounded-xl border border-blue-200 bg-sky-50 px-2.5 sm:px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-blue-100 transition-all"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-700">
          <div className="text-sky-700">
            <span className="hidden sm:inline">Sun (Off)</span>
            <span className="sm:hidden">S</span>
          </div>
          {dayLabelsFull.slice(1).map((label, i) => (
            <div key={label + i}>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{dayLabelsShort[i + 1]}</span>
            </div>
          ))}
        </div>

        {/* Individual Calendar Month Day Cells */}
        {loading ? (
          <div className="flex h-40 sm:h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
            {/* Empty Slots before 1st of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square sm:h-28 rounded-xl sm:rounded-2xl bg-sky-50/40 border border-slate-200" />
            ))}

            {/* Day Cells 1-31 */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateObj = new Date(year, month, dayNum);
              const isSunday = dateObj.getDay() === 0;

              const log = getLogForDate(dayNum);
              const approvedLeave = getApprovedLeaveForDate(dayNum);

              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <button
                  type="button"
                  key={`day-${dayNum}`}
                  onClick={() => {
                    setSelectedDayModalData({
                      dayNum,
                      dateStr: `${monthNames[month]} ${dayNum}, ${year}`,
                      isSunday,
                      isToday,
                      log,
                      approvedLeave,
                      employeeName: selectedEmployee?.fullName || user?.fullName,
                      employeeId: selectedEmployee?.employeeId || user?.employeeId,
                      department: selectedEmployee?.department || user?.department,
                      role: selectedEmployee?.role || user?.role,
                    });
                  }}
                  className={`aspect-square sm:h-28 rounded-xl sm:rounded-2xl border p-1 sm:p-2.5 flex flex-col justify-between transition-all overflow-hidden cursor-pointer text-left hover:shadow-md hover:border-blue-500 hover:scale-[1.02] active:scale-95 ${
                    isToday
                      ? 'border-blue-600 bg-blue-50/50 ring-1 sm:ring-2 ring-blue-500/20'
                      : approvedLeave
                      ? 'border-amber-300 bg-amber-50/60'
                      : log
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : isSunday
                      ? 'border-sky-200 bg-sky-50/70'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between pointer-events-none w-full">
                    <span className={`text-[10px] sm:text-xs font-black ${isToday ? 'text-blue-800' : isSunday ? 'text-sky-800' : 'text-slate-900'}`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="hidden sm:inline text-[9px] font-black text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-200">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Shift Log / Approved Leave / Sunday Holiday Indicator */}
                  <div className="mt-0.5 sm:mt-1 flex-1 flex flex-col justify-center min-w-0 pointer-events-none w-full">
                    {approvedLeave ? (
                      <>
                        {/* Mobile: small dot */}
                        <div className="sm:hidden flex justify-center">
                          <div className="h-2 w-2 rounded-full bg-amber-500" title="Approved Leave" />
                        </div>
                        {/* Desktop: full card */}
                        <div className="hidden sm:block rounded-xl bg-amber-100 border border-amber-300 p-1.5 space-y-0.5 shadow-sm">
                          <div className="flex items-center justify-between text-[10px] font-black text-amber-950">
                            <span>Leave</span>
                            <Umbrella className="h-3 w-3 text-amber-700" />
                          </div>
                          <div className="text-[9px] font-bold text-amber-900">
                            {approvedLeave.leaveType}
                          </div>
                        </div>
                      </>
                    ) : log ? (
                      <>
                        {/* Mobile: small dot */}
                        <div className="sm:hidden flex justify-center">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" title="Present" />
                        </div>
                        {/* Desktop: full card */}
                        <div className="hidden sm:block rounded-xl bg-emerald-100/80 border border-emerald-300 p-1.5 space-y-1 shadow-sm">
                          <div className="flex items-center justify-between text-[10px] font-black text-emerald-950">
                            <span>{log.status}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                          </div>
                          <div className="text-[9px] font-mono text-emerald-950 font-black space-y-0.5">
                            <div>
                              In: {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                            <div>
                              Out: {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : isSunday ? (
                      <>
                        <div className="sm:hidden flex justify-center">
                          <div className="h-2 w-2 rounded-full bg-sky-400" title="Weekly Off" />
                        </div>
                        <div className="hidden sm:block rounded-xl bg-sky-100/70 border border-sky-200 p-1.5 text-center shadow-sm">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-sky-950">
                            <Sun className="h-3 w-3 text-sky-600" />
                            <span>Off</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="hidden sm:block text-[10px] text-slate-500 font-bold italic text-center">No Shift</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile Calendar Legend */}
        <div className="flex sm:hidden flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-200 text-[10px] font-bold text-slate-700">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-sky-400" />
            <span>Weekly Off</span>
          </div>
        </div>
      </div>

      {/* Day Details Modal for Mobile & Desktop */}
      <Modal
        isOpen={!!selectedDayModalData}
        onClose={() => setSelectedDayModalData(null)}
        title={`Date Details: ${selectedDayModalData?.dateStr || ''}`}
      >
        {selectedDayModalData && (
          <div className="space-y-4 text-xs">
            {/* Employee Info Header */}
            <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-blue-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm shrink-0">
                {selectedDayModalData.employeeName?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">{selectedDayModalData.employeeName}</p>
                <p className="text-xs text-slate-600 font-mono font-bold truncate">
                  {selectedDayModalData.employeeId} • {selectedDayModalData.department}
                </p>
              </div>
            </div>

            {/* Attendance Status Details */}
            {selectedDayModalData.approvedLeave ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 text-sm flex items-center gap-1.5">
                    <Umbrella className="h-4 w-4 text-amber-700" />
                    Approved Time-Off
                  </span>
                  <Badge variant={selectedDayModalData.approvedLeave.leaveType} size="xs">
                    {selectedDayModalData.approvedLeave.leaveType} Leave
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-amber-200/60 font-bold text-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Duration:</span>
                    <span className="font-black text-amber-950">{selectedDayModalData.approvedLeave.totalDays} Day(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date Range:</span>
                    <span className="font-mono text-slate-900 font-black">
                      {new Date(selectedDayModalData.approvedLeave.startDate).toLocaleDateString()} to {new Date(selectedDayModalData.approvedLeave.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60">
                  <p className="text-slate-700 font-black mb-1">Leave Reason:</p>
                  <p className="p-2.5 rounded-lg bg-white border border-amber-200 text-slate-800 italic font-medium">
                    "{selectedDayModalData.approvedLeave.reason}"
                  </p>
                </div>
              </div>
            ) : selectedDayModalData.log ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Present • Shift Recorded
                  </span>
                  <Badge variant="Approved" size="xs">
                    {selectedDayModalData.log.status || 'Present'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Check-In Time</span>
                    <p className="text-xs font-mono font-black text-emerald-900 mt-0.5">
                      {selectedDayModalData.log.checkInTime
                        ? new Date(selectedDayModalData.log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '-'}
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Check-Out Time</span>
                    <p className="text-xs font-mono font-black text-emerald-900 mt-0.5">
                      {selectedDayModalData.log.checkOutTime
                        ? new Date(selectedDayModalData.log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'Shift Active'}
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedDayModalData.isSunday ? (
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-center space-y-1">
                <Sun className="h-6 w-6 text-sky-600 mx-auto" />
                <h4 className="font-black text-sky-950 text-sm">Sunday - Company Weekly Off</h4>
                <p className="text-xs text-slate-600 font-medium">Standard non-working holiday for all employees.</p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center space-y-1">
                <AlertCircle className="h-6 w-6 text-slate-400 mx-auto" />
                <h4 className="font-black text-slate-800 text-sm">No Attendance Log</h4>
                <p className="text-xs text-slate-600 font-medium">No shift check-in or time-off request recorded for this date.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendancePage;

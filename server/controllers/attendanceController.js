const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// Helper to get today's YYYY-MM-DD string
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// @desc    Employee daily Check-In
// @route   POST /api/attendance/check-in
// @access  Private (All Roles)
const checkIn = async (req, res) => {
  try {
    const today = getTodayString();
    const employeeId = req.user._id;

    // Edge Case 1: Check if already checked in today
    const existingRecord = await Attendance.findOne({ employeeId, date: today });
    if (existingRecord) {
      return res.status(400).json({ message: 'You have already checked in for today.' });
    }

    // Edge Case 2: Check if employee is on approved leave today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const approvedLeave = await LeaveRequest.findOne({
      employeeId,
      status: 'Approved',
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
    });

    if (approvedLeave) {
      return res.status(400).json({
        message: 'Cannot check in today. You are currently on an approved leave.',
      });
    }

    const now = new Date();
    let initialStatus = 'Present';
    let remarks = req.body.remarks || '';

    // Late Arrival Check (Shift starts at 10:00 AM, 15 mins grace period)
    const lateThreshold = new Date();
    lateThreshold.setHours(10, 15, 0, 0);

    // If check-in is past 10:15 AM
    if (now.getTime() > lateThreshold.getTime()) {
      remarks = remarks ? `${remarks} | Late Arrival` : 'Late Arrival';
    }

    const attendance = await Attendance.create({
      employeeId,
      date: today,
      checkInTime: now,
      status: initialStatus,
      remarks,
    });

    return res.status(201).json(attendance);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Employee daily Check-Out
// @route   POST /api/attendance/check-out
// @access  Private (All Roles)
const checkOut = async (req, res) => {
  try {
    const today = getTodayString();
    const employeeId = req.user._id;

    const attendance = await Attendance.findOne({ employeeId, date: today });

    // Edge Case 3: Check-out without check-in
    if (!attendance) {
      return res.status(400).json({ message: 'Cannot check out. You have not checked in today.' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: 'You have already checked out for today.' });
    }

    const now = new Date();
    
    // Calculate worked hours (CheckOut - CheckIn)
    const diffTime = now.getTime() - new Date(attendance.checkInTime).getTime();
    const workedHours = diffTime / (1000 * 60 * 60);
    
    let finalStatus = attendance.status;
    if (workedHours < 2) {
      finalStatus = 'Absent';
    } else if (workedHours < 4.5) {
      finalStatus = 'Half Day';
    }

    // Early Departure Check (Shift ends at 6:00 PM, threshold 5:45 PM)
    const earlyDepartureThreshold = new Date();
    earlyDepartureThreshold.setHours(17, 45, 0, 0);

    let remarks = attendance.remarks;
    if (now.getTime() < earlyDepartureThreshold.getTime()) {
      remarks = remarks ? `${remarks} | Early Departure` : 'Early Departure';
    }

    attendance.checkOutTime = now;
    attendance.status = finalStatus;
    attendance.remarks = remarks;
    await attendance.save();

    return res.json(attendance);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's check-in/out status for today
// @route   GET /api/attendance/today-status
// @access  Private (All Roles)
const getTodayStatus = async (req, res) => {
  try {
    const today = getTodayString();
    const attendance = await Attendance.findOne({ employeeId: req.user._id, date: today });

    return res.json({
      date: today,
      isCheckedIn: !!attendance,
      isCheckedOut: !!(attendance && attendance.checkOutTime),
      attendanceRecord: attendance || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get personal attendance history
// @route   GET /api/attendance/my-history
// @access  Private (All Roles)
const getMyAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { employeeId: req.user._id };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const history = await Attendance.find(query).sort({ date: -1 });
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get manager team attendance history
// @route   GET /api/attendance/team
// @access  Private (Manager, HR)
const getTeamAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = date || getTodayString();

    let teamQuery = {};
    if (req.user.role === 'Manager') {
      teamQuery.managerId = req.user._id;
    }

    // Get team members IDs
    const teamMembers = await User.find(teamQuery).select('_id fullName email employeeId department designation');
    const teamIds = teamMembers.map((m) => m._id);

    const attendanceRecords = await Attendance.find({
      employeeId: { $in: teamIds },
      date: selectedDate,
    }).populate('employeeId', 'fullName email employeeId department designation');

    return res.json({
      date: selectedDate,
      totalTeamMembers: teamMembers.length,
      records: attendanceRecords,
      teamMembers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance logs (HR & Manager view)
// @route   GET /api/attendance/all
// @access  Private (HR, Manager)
const getAllAttendance = async (req, res) => {
  try {
    const { date, department, employeeId } = req.query;
    let query = {};

    if (req.user.role === 'Manager') {
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      const allowedIds = [req.user._id, ...teamMembers.map((m) => m._id)];

      if (employeeId) {
        query.employeeId = employeeId;
      } else {
        query.employeeId = { $in: allowedIds };
      }
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (date) {
      query.date = date;
    }

    let records = await Attendance.find(query)
      .populate('employeeId', 'fullName email employeeId department designation')
      .sort({ date: -1, createdAt: -1 });

    if (department) {
      records = records.filter((r) => r.employeeId?.department === department);
    }

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendanceHistory,
  getTeamAttendance,
  getAllAttendance,
};

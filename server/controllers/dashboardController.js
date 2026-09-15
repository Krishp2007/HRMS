const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

const getTodayString = () => new Date().toISOString().split('T')[0];

// @desc    Get dynamic dashboard statistics based on user role
// @route   GET /api/dashboard/stats
// @access  Private (All Roles)
const getDashboardStats = async (req, res) => {
  try {
    const todayStr = getTodayString();
    const now = new Date();

    if (req.user.role === 'HR') {
      // HR Dashboard Stats
      const totalEmployees = await User.countDocuments();
      const activeEmployees = await User.countDocuments({ status: 'Active' });
      const presentToday = await Attendance.countDocuments({ date: todayStr, status: 'Present' });

      const onLeaveToday = await LeaveRequest.countDocuments({
        status: 'Approved',
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      const pendingLeaveRequests = await LeaveRequest.countDocuments({ status: 'Pending' });

      return res.json({
        role: 'HR',
        metrics: {
          totalEmployees,
          activeEmployees,
          presentToday,
          onLeaveToday,
          pendingLeaveRequests,
        },
      });
    }

    if (req.user.role === 'Manager') {
      // Manager Dashboard Stats
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = teamMembers.map((m) => m._id);

      const totalTeamMembers = teamMembers.length;

      const teamPresentToday = await Attendance.countDocuments({
        employeeId: { $in: teamIds },
        date: todayStr,
        status: 'Present',
      });

      const teamMembersOnLeave = await LeaveRequest.countDocuments({
        employeeId: { $in: teamIds },
        status: 'Approved',
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      const pendingTeamApprovals = await LeaveRequest.countDocuments({
        employeeId: { $in: teamIds },
        status: 'Pending',
      });

      return res.json({
        role: 'Manager',
        metrics: {
          totalTeamMembers,
          teamPresentToday,
          teamMembersOnLeave,
          pendingTeamApprovals,
        },
      });
    }

    if (req.user.role === 'Employee') {
      // Employee Dashboard Stats
      const todayAttendance = await Attendance.findOne({ employeeId: req.user._id, date: todayStr });

      const totalLeaveRequests = await LeaveRequest.countDocuments({ employeeId: req.user._id });
      const pendingRequests = await LeaveRequest.countDocuments({ employeeId: req.user._id, status: 'Pending' });
      const approvedRequests = await LeaveRequest.countDocuments({ employeeId: req.user._id, status: 'Approved' });
      const rejectedRequests = await LeaveRequest.countDocuments({ employeeId: req.user._id, status: 'Rejected' });

      const recentAttendance = await Attendance.find({ employeeId: req.user._id })
        .sort({ date: -1 })
        .limit(5);

      return res.json({
        role: 'Employee',
        metrics: {
          todayStatus: todayAttendance ? (todayAttendance.checkOutTime ? 'Completed' : 'Checked In') : 'Not Checked In',
          todayRecord: todayAttendance || null,
          totalLeaveRequests,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          recentAttendance,
        },
      });
    }

    return res.status(400).json({ message: 'Unknown user role' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };

const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (All Roles)
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user._id;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Edge Case 1: Invalid Date Range
    if (end < start) {
      return res.status(400).json({ message: 'End date cannot be before start date.' });
    }

    // Calculate total days
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Edge Case 2: Overlapping Leave Check
    const overlappingLeave = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlappingLeave) {
      return res.status(400).json({
        message: 'You already have a pending or approved leave request for the selected date range.',
      });
    }

    // Edge Case 3: Leave on date already marked Present
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: startStr, $lte: endStr },
      status: 'Present',
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: `Cannot apply for leave. You have already marked attendance (Present) on ${existingAttendance.date}.`,
      });
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: 'Pending',
    });

    const populatedRequest = await LeaveRequest.findById(leaveRequest._id).populate(
      'employeeId',
      'fullName email employeeId department'
    );

    return res.status(201).json(populatedRequest);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get personal leave requests
// @route   GET /api/leaves/my-requests
// @access  Private (All Roles)
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.user._id })
      .populate('reviewedBy', 'fullName employeeId role')
      .sort({ createdAt: -1 });

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get team leave requests (Manager view)
// @route   GET /api/leaves/team-requests
// @access  Private (Manager, HR)
const getTeamLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (req.user.role === 'Manager') {
      // Find team members
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = teamMembers.map((m) => m._id);
      query.employeeId = { $in: teamIds };
    }

    if (status) {
      query.status = status;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('employeeId', 'fullName email employeeId department designation managerId')
      .populate('reviewedBy', 'fullName employeeId role')
      .sort({ createdAt: -1 });

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all leave requests (HR view)
// @route   GET /api/leaves/all-requests
// @access  Private (HR)
const getAllLeaves = async (req, res) => {
  try {
    const { status, department } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    let leaves = await LeaveRequest.find(query)
      .populate('employeeId', 'fullName email employeeId department designation')
      .populate('reviewedBy', 'fullName employeeId role')
      .sort({ createdAt: -1 });

    if (department) {
      leaves = leaves.filter((l) => l.employeeId?.department === department);
    }

    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Approve leave request
// @route   PATCH /api/leaves/:id/approve
// @access  Private (Manager, HR)
const approveLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Edge Case 4: Self Approval Block
    if (leave.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Security Block: You cannot approve your own leave request.' });
    }

    // Edge Case 5: Cross-Team Approval Block for Managers
    if (
      req.user.role === 'Manager' &&
      leave.employeeId.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You can only approve leave for your own team members.' });
    }

    leave.status = 'Approved';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    const updatedLeave = await LeaveRequest.findById(leave._id)
      .populate('employeeId', 'fullName email employeeId department')
      .populate('reviewedBy', 'fullName employeeId role');

    return res.json(updatedLeave);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Reject leave request with mandatory reason
// @route   PATCH /api/leaves/:id/reject
// @access  Private (Manager, HR)
const rejectLeave = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is mandatory when rejecting a leave request.' });
    }

    const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Self Approval/Rejection block
    if (leave.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Security Block: You cannot reject your own leave request.' });
    }

    // Cross-Team Block for Managers
    if (
      req.user.role === 'Manager' &&
      leave.employeeId.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You can only reject leave for your own team members.' });
    }

    leave.status = 'Rejected';
    leave.rejectionReason = rejectionReason;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    const updatedLeave = await LeaveRequest.findById(leave._id)
      .populate('employeeId', 'fullName email employeeId department')
      .populate('reviewedBy', 'fullName employeeId role');

    return res.json(updatedLeave);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel leave request (Only allowed for Pending requests by the owner)
// @route   DELETE /api/leaves/:id
// @access  Private (All Roles - Owner only)
const cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Ownership check
    if (leave.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You can only cancel your own leave requests.' });
    }

    // Edge Case 4: Cannot cancel Approved or Rejected requests
    if (leave.status !== 'Pending') {
      return res.status(400).json({
        message: `Cannot cancel this leave request because it is already ${leave.status.toLowerCase()}. Only Pending requests can be cancelled.`,
      });
    }

    await leave.deleteOne();
    return res.json({ message: 'Leave request cancelled successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getTeamLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
};

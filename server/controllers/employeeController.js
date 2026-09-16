const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

// @desc    Add new employee
// @route   POST /api/employees
// @access  Private (HR)
const addEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      fullName,
      email,
      password,
      phone,
      role,
      department,
      designation,
      managerId,
      joiningDate,
    } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or Employee ID already exists' });
    }

    const newEmployee = await User.create({
      employeeId,
      fullName,
      email,
      password,
      phone,
      role,
      department,
      designation,
      managerId: managerId || null,
      joiningDate,
    });

    const populatedUser = await User.findById(newEmployee._id)
      .select('-password')
      .populate('managerId', 'fullName email employeeId designation department');

    return res.status(201).json(populatedUser);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get employees list with search & filter
// @route   GET /api/employees
// @access  Private (HR, Manager)
const getEmployees = async (req, res) => {
  try {
    const { search, department, role, status } = req.query;

    let query = {};

    // Manager strict access control: can ONLY view employees assigned to their team in their department
    if (req.user.role === 'Manager') {
      if (department && req.user.department && department !== req.user.department) {
        return res.status(403).json({
          message: 'Unauthorized. Managers can only access employees in their assigned department.',
        });
      }
      query.managerId = req.user._id;
      if (req.user.department) {
        query.department = req.user.department;
      }
    } else {
      if (department) {
        query.department = department;
      }
      if (role) {
        query.role = role;
      }
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(query)
      .select('-password')
      .populate('managerId', 'fullName email employeeId designation department')
      .sort({ createdAt: -1 });

    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get complete employee deep profile details (user + attendance + leaves)
// @route   GET /api/employees/:id
// @access  Private (HR, Manager of team, Employee self)
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'fullName email employeeId designation department');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // RBAC Security Check
    if (req.user.role === 'Employee' && req.user._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }

    if (
      req.user.role === 'Manager' &&
      employee.managerId?._id?.toString() !== req.user._id.toString() &&
      employee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied. You can only view team members.' });
    }

    // Fetch deep attendance and leave history for this employee
    const attendanceHistory = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1 })
      .limit(10);

    const leaveHistory = await LeaveRequest.find({ employeeId: employee._id })
      .populate('reviewedBy', 'fullName employeeId role')
      .sort({ createdAt: -1 });

    return res.json({
      user: employee,
      attendance: attendanceHistory,
      leaves: leaveHistory,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee (includes oldPassword validation when changing password)
// @route   PUT /api/employees/:id
// @access  Private (HR, Employee self for limited fields)
const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Security check: only HR or the user themselves can edit
    if (req.user.role !== 'HR' && req.user._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Secure Password Change Verification
    if (req.body.newPassword) {
      if (!req.body.oldPassword) {
        return res.status(400).json({ message: 'Current password is required to change password.' });
      }
      const isMatch = await employee.matchPassword(req.body.oldPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
      employee.password = req.body.newPassword;
    }

    // Self update rules vs HR update rules
    if (req.user._id.toString() === employee._id.toString() && req.user.role !== 'HR') {
      if (req.body.phone) employee.phone = req.body.phone;
      if (req.body.fullName) employee.fullName = req.body.fullName;
    } else if (req.user.role === 'HR') {
      employee.fullName = req.body.fullName || employee.fullName;
      employee.email = req.body.email || employee.email;
      employee.phone = req.body.phone || employee.phone;
      employee.role = req.body.role || employee.role;
      employee.department = req.body.department || employee.department;
      employee.designation = req.body.designation || employee.designation;
      employee.managerId = req.body.managerId !== undefined ? req.body.managerId : employee.managerId;
      employee.joiningDate = req.body.joiningDate || employee.joiningDate;
    }

    const updatedEmployee = await employee.save();
    const populatedUser = await User.findById(updatedEmployee._id)
      .select('-password')
      .populate('managerId', 'fullName email employeeId designation department');

    return res.json(populatedUser);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Activate/Deactivate employee
// @route   PATCH /api/employees/:id/status
// @access  Private (HR)
const toggleEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Active or Inactive.' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.status = status;
    await employee.save();

    return res.json({ message: `Employee status changed to ${status}`, status: employee.status });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of Managers and HRs for dropdown selection
// @route   GET /api/employees/managers/list
// @access  Private (HR)
const getManagersList = async (req, res) => {
  try {
    const managers = await User.find({ role: { $in: ['HR', 'Manager'] }, status: 'Active' })
      .select('fullName employeeId department email role designation')
      .sort({ fullName: 1 });

    return res.json(managers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  getManagersList,
};

const User = require('../models/User');

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
      .populate('managerId', 'fullName email employeeId');

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
    const { search, department, status } = req.query;

    let query = {};

    // Manager can only view employees assigned to their team
    if (req.user.role === 'Manager') {
      query.managerId = req.user._id;
    }

    if (department) {
      query.department = department;
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
      .populate('managerId', 'fullName email employeeId')
      .sort({ createdAt: -1 });

    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private (HR, Manager of team, Employee self)
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'fullName email employeeId');

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

    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (HR, Employee self for limited fields)
const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Employee self update rules
    if (req.user.role === 'Employee') {
      if (req.user._id.toString() !== employee._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Allow self to update phone or full name only
      if (req.body.phone) employee.phone = req.body.phone;
      if (req.body.fullName) employee.fullName = req.body.fullName;
    } else if (req.user.role === 'HR') {
      // HR full update rules
      employee.fullName = req.body.fullName || employee.fullName;
      employee.email = req.body.email || employee.email;
      employee.phone = req.body.phone || employee.phone;
      employee.role = req.body.role || employee.role;
      employee.department = req.body.department || employee.department;
      employee.designation = req.body.designation || employee.designation;
      employee.managerId = req.body.managerId !== undefined ? req.body.managerId : employee.managerId;
      employee.joiningDate = req.body.joiningDate || employee.joiningDate;
      if (req.body.password) {
        employee.password = req.body.password; // Pre-save hook will hash it
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedEmployee = await employee.save();
    const populatedUser = await User.findById(updatedEmployee._id)
      .select('-password')
      .populate('managerId', 'fullName email employeeId');

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
      .select('fullName employeeId department email role')
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

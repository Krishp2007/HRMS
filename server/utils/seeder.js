const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing all existing database collections (Users, Attendance, LeaveRequests)...');
    await User.deleteMany();
    await Attendance.deleteMany();
    await LeaveRequest.deleteMany();

    console.log('👥 Seeding users across all 3 roles (HR, Manager, Employee)...');

    // 1. HR User
    const hr = await User.create({
      employeeId: 'EMP-1001',
      fullName: 'Sarah Connor (HR Lead)',
      email: 'hr@apptrait.com',
      password: 'password123',
      phone: '9876543210',
      role: 'HR',
      department: 'HR',
      designation: 'HR Lead',
      managerId: null,
      joiningDate: new Date('2022-01-10'),
      status: 'Active',
    });

    // 2. Managers
    const mgrEng = await User.create({
      employeeId: 'EMP-1002',
      fullName: 'Alex Vance (Eng Manager)',
      email: 'manager1@apptrait.com',
      password: 'password123',
      phone: '9876543211',
      role: 'Manager',
      department: 'Engineering',
      designation: 'Engineering Lead',
      managerId: hr._id,
      joiningDate: new Date('2022-03-15'),
      status: 'Active',
    });

    const mgrSales = await User.create({
      employeeId: 'EMP-1003',
      fullName: 'David Miller (Sales Manager)',
      email: 'manager2@apptrait.com',
      password: 'password123',
      phone: '9876543212',
      role: 'Manager',
      department: 'Sales',
      designation: 'Sales Director',
      managerId: hr._id,
      joiningDate: new Date('2022-05-01'),
      status: 'Active',
    });

    // 3. Employees (Engineering Team)
    const emp1 = await User.create({
      employeeId: 'EMP-1004',
      fullName: 'John Doe (Frontend Dev)',
      email: 'employee1@apptrait.com',
      password: 'password123',
      phone: '9876543213',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Senior Frontend Developer',
      managerId: mgrEng._id,
      joiningDate: new Date('2023-01-20'),
      status: 'Active',
    });

    const emp2 = await User.create({
      employeeId: 'EMP-1005',
      fullName: 'Jane Smith (Backend Dev)',
      email: 'employee2@apptrait.com',
      password: 'password123',
      phone: '9876543214',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Node.js Developer',
      managerId: mgrEng._id,
      joiningDate: new Date('2023-02-15'),
      status: 'Active',
    });

    const emp3 = await User.create({
      employeeId: 'EMP-1006',
      fullName: 'Robert Johnson (QA Engineer)',
      email: 'employee3@apptrait.com',
      password: 'password123',
      phone: '9876543215',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Automation QA Lead',
      managerId: mgrEng._id,
      joiningDate: new Date('2023-04-10'),
      status: 'Active',
    });

    // 4. Employees (Sales Team)
    const emp4 = await User.create({
      employeeId: 'EMP-1007',
      fullName: 'Emily Davis (Sales Exec)',
      email: 'employee4@apptrait.com',
      password: 'password123',
      phone: '9876543216',
      role: 'Employee',
      department: 'Sales',
      designation: 'Account Executive',
      managerId: mgrSales._id,
      joiningDate: new Date('2023-07-01'),
      status: 'Active',
    });

    const emp5 = await User.create({
      employeeId: 'EMP-1008',
      fullName: 'Michael Brown (Sales Representative)',
      email: 'employee5@apptrait.com',
      password: 'password123',
      phone: '9876543217',
      role: 'Employee',
      department: 'Sales',
      designation: 'Sales Representative',
      managerId: mgrSales._id,
      joiningDate: new Date('2023-08-15'),
      status: 'Active',
    });

    // 5. Inactive Employee (To test Deactivated User filter & blocks)
    const emp6 = await User.create({
      employeeId: 'EMP-1009',
      fullName: 'Mark Wilson (Inactive Staff)',
      email: 'employee6@apptrait.com',
      password: 'password123',
      phone: '9876543218',
      role: 'Employee',
      department: 'Operations',
      designation: 'Operations Assistant',
      managerId: hr._id,
      joiningDate: new Date('2023-09-01'),
      status: 'Inactive',
    });

    console.log('📅 Seeding sample attendance records...');
    const todayStr = new Date().toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Seed Today's Attendance
    await Attendance.create([
      {
        employeeId: emp1._id,
        date: todayStr,
        checkInTime: new Date(new Date().setHours(9, 15, 0, 0)),
        checkOutTime: null,
        status: 'Present',
        remarks: 'Checked in on time',
      },
      {
        employeeId: emp2._id,
        date: todayStr,
        checkInTime: new Date(new Date().setHours(9, 30, 0, 0)),
        checkOutTime: new Date(new Date().setHours(17, 45, 0, 0)),
        status: 'Present',
        remarks: 'Completed full day shift',
      },
      {
        employeeId: emp4._id,
        date: todayStr,
        checkInTime: new Date(new Date().setHours(10, 0, 0, 0)),
        checkOutTime: null,
        status: 'Present',
        remarks: 'Working remotely today',
      },
    ]);

    // Seed Yesterday's Attendance
    await Attendance.create([
      {
        employeeId: emp1._id,
        date: yesterdayStr,
        checkInTime: new Date(yesterday.setHours(9, 0, 0, 0)),
        checkOutTime: new Date(yesterday.setHours(18, 0, 0, 0)),
        status: 'Present',
      },
      {
        employeeId: emp2._id,
        date: yesterdayStr,
        checkInTime: new Date(yesterday.setHours(9, 20, 0, 0)),
        checkOutTime: new Date(yesterday.setHours(18, 15, 0, 0)),
        status: 'Present',
      },
      {
        employeeId: emp3._id,
        date: yesterdayStr,
        checkInTime: new Date(yesterday.setHours(9, 45, 0, 0)),
        checkOutTime: new Date(yesterday.setHours(17, 30, 0, 0)),
        status: 'Present',
      },
    ]);

    console.log('🌴 Seeding sample leave requests...');
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 3);

    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 5);

    await LeaveRequest.create([
      {
        employeeId: emp1._id, // John Doe
        leaveType: 'Casual',
        startDate: nextWeekStart,
        endDate: nextWeekEnd,
        totalDays: 3,
        reason: 'Family function in hometown',
        status: 'Pending',
      },
      {
        employeeId: emp3._id, // Robert Johnson
        leaveType: 'Sick',
        startDate: new Date('2026-09-10'),
        endDate: new Date('2026-09-11'),
        totalDays: 2,
        reason: 'Viral fever and doctor prescribed rest',
        status: 'Approved',
        reviewedBy: mgrEng._id,
        reviewedAt: new Date('2026-09-09'),
      },
      {
        employeeId: emp4._id, // Emily Davis
        leaveType: 'Paid',
        startDate: new Date('2026-09-20'),
        endDate: new Date('2026-09-22'),
        totalDays: 3,
        reason: 'Personal travel plans',
        status: 'Rejected',
        reviewedBy: mgrSales._id,
        rejectionReason: 'High priority sales client meeting scheduled on those dates.',
        reviewedAt: new Date('2026-09-14'),
      },
    ]);

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY WITH MULTIPLE ACCOUNTS!');
    console.log('======================================================');
    console.log('👑 HR Lead:            hr@apptrait.com          / password123');
    console.log('👔 Eng Manager:        manager1@apptrait.com    / password123');
    console.log('👔 Sales Manager:      manager2@apptrait.com    / password123');
    console.log('🧑 Eng Employee 1:     employee1@apptrait.com   / password123 (John Doe)');
    console.log('🧑 Eng Employee 2:     employee2@apptrait.com   / password123 (Jane Smith)');
    console.log('🧑 Sales Employee 4:   employee4@apptrait.com   / password123 (Emily Davis)');
    console.log('🚫 Inactive Employee:  employee6@apptrait.com   / password123 (Mark Wilson)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Execute seeder function when run directly via node command
seedData();

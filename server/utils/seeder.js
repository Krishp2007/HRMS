const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing users...');
    await User.deleteMany();

    console.log('Creating demo users...');

    // 1. Create HR User
    const hr = await User.create({
      employeeId: 'EMP-1001',
      fullName: 'Sarah Connor (HR)',
      email: 'hr@apptrait.com',
      password: 'password123',
      phone: '9876543210',
      role: 'HR',
      department: 'HR',
      designation: 'HR Lead',
      managerId: null,
      joiningDate: new Date('2023-01-15'),
      status: 'Active',
    });

    // 2. Create Manager User
    const manager = await User.create({
      employeeId: 'EMP-1002',
      fullName: 'Alex Vance (Manager)',
      email: 'manager@apptrait.com',
      password: 'password123',
      phone: '9876543211',
      role: 'Manager',
      department: 'Engineering',
      designation: 'Engineering Manager',
      managerId: hr._id,
      joiningDate: new Date('2023-03-01'),
      status: 'Active',
    });

    // 3. Create Employee User
    const employee = await User.create({
      employeeId: 'EMP-1003',
      fullName: 'John Doe (Developer)',
      email: 'employee@apptrait.com',
      password: 'password123',
      phone: '9876543212',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Frontend Developer',
      managerId: manager._id,
      joiningDate: new Date('2023-06-10'),
      status: 'Active',
    });

    console.log('✅ Demo accounts seeded successfully:');
    console.log('------------------------------------');
    console.log('HR Account: hr@apptrait.com / password123');
    console.log('Manager Account: manager@apptrait.com / password123');
    console.log('Employee Account: employee@apptrait.com / password123');
    console.log('------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

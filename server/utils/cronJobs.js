const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

const getTodayString = (date) => {
  return date.toISOString().split('T')[0];
};

const markAbsentEmployees = async () => {
  const now = new Date();
  
  // 0 is Sunday
  if (now.getDay() === 0) {
    console.log('[Cron] Today is Sunday. Skipping absent marker.');
    return;
  }

  try {
    const todayStr = getTodayString(now);
    console.log(`[Cron] Running absent marker for ${todayStr}...`);

    const activeEmployees = await User.find({ status: 'Active' });

    for (const emp of activeEmployees) {
      // Check if attendance exists
      const existingRecord = await Attendance.findOne({ employeeId: emp._id, date: todayStr });
      if (existingRecord) {
        continue;
      }

      // Check if approved leave exists
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const approvedLeave = await LeaveRequest.findOne({
        employeeId: emp._id,
        status: 'Approved',
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay },
      });

      if (approvedLeave) {
        continue;
      }

      // Neither attendance nor approved leave exists, mark absent
      await Attendance.create({
        employeeId: emp._id,
        date: todayStr,
        status: 'Absent',
        checkInTime: null,
        remarks: 'Auto-marked for missing shift log',
      });
      console.log(`[Cron] Marked ${emp.fullName} (${emp.employeeId}) as Absent.`);
    }

    console.log('[Cron] Absent marker process completed.');
  } catch (error) {
    console.error('[Cron] Error running absent marker:', error);
  }
};

const initCronJobs = () => {
  // Main run at 11:55 PM
  cron.schedule('55 23 * * *', async () => {
    await markAbsentEmployees();
  });

  // Backup run at 11:59 PM
  cron.schedule('59 23 * * *', async () => {
    await markAbsentEmployees();
  });

  console.log('[Cron] Absent marker jobs initialized to run at 23:55 and 23:59.');
};

module.exports = initCronJobs;

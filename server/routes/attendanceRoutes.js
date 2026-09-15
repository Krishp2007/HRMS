const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendanceHistory,
  getTeamAttendance,
  getAllAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today-status', getTodayStatus);
router.get('/my-history', getMyAttendanceHistory);
router.get('/team', authorize('Manager', 'HR'), getTeamAttendance);
router.get('/all', authorize('HR'), getAllAttendance);

module.exports = router;

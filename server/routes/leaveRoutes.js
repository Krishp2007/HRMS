const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getTeamLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', applyLeave);
router.post('/apply', applyLeave);
router.get('/my-requests', getMyLeaves);
router.get('/team-requests', authorize('Manager', 'HR'), getTeamLeaves);
router.get('/all-requests', authorize('HR'), getAllLeaves);
router.patch('/:id/approve', authorize('Manager', 'HR'), approveLeave);
router.patch('/:id/reject', authorize('Manager', 'HR'), rejectLeave);
router.delete('/:id', cancelLeave);

module.exports = router;

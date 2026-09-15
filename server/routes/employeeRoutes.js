const express = require('express');
const router = express.Router();
const {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  getManagersList,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('HR'), addEmployee);
router.get('/', authorize('HR', 'Manager'), getEmployees);
router.get('/managers/list', authorize('HR'), getManagersList);
router.get('/:id', authorize('HR', 'Manager', 'Employee'), getEmployeeById);
router.put('/:id', authorize('HR', 'Employee'), updateEmployee);
router.patch('/:id/status', authorize('HR'), toggleEmployeeStatus);

module.exports = router;

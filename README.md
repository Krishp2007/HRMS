# Human Resource Management System (HRMS)

A full-stack Mini HRMS application built for SaaS companies to manage employees, attendance, leave requests, and role-based operations with strict security and dynamic dashboards.

> **Assessment Project**: AppTrait Solutions - Vibe Coder Practical Assessment  
> **Tech Stack**: MERN (MongoDB, Express.js, React.js, Node.js) + Tailwind CSS + JWT Auth

---

## 📌 Project Features

- **Role-Based Access Control (RBAC)**: Distinct permissions and dynamic dashboards for **HR/Admin**, **Manager**, and **Employee**.
- **Employee Management**: HR can add, edit, view, search, filter by department/status, and activate/deactivate employees.
- **Attendance Management**: Check-in and check-out tracking with status detection (`Present`, `Absent`, `Half Day`, `Leave`).
- **Leave Management**: Leave application workflow, overlapping leave prevention, manager/HR approvals, and mandatory rejection reasoning.
- **Dynamic Dashboards**: Real-time metric cards computed directly from database queries (no hardcoded metrics).
- **Edge Case Engine**: Handled date conflicts, double check-in prevention, self-approval prevention, and cross-team security boundaries.

---

## 🔐 Demo Credentials

Use these seeded credentials to test different user roles and workflows:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **HR / Admin** | `hr@apptrait.com` | `password123` | Full system access, employee creation, company-wide attendance & leaves |
| **Manager** | `manager@apptrait.com` | `password123` | View team members, team attendance, approve/reject team leave requests |
| **Employee** | `employee@apptrait.com` | `password123` | Mark daily check-in/out, view own history, apply for leave |

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local MongoDB server running on `mongodb://127.0.0.1:27017/hrms_db` or MongoDB Atlas URI

### 1. Clone Repository & Setup Backend
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create local environment file (.env)
cp .env.example .env

# Seed initial demo accounts (HR, Manager, Employee)
npm run seed

# Start development backend server (Port 5000)
npm run dev
```

### 2. Setup Frontend Client
```bash
# Open a new terminal and navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite React development server (Port 5173)
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## ⚙️ Environment Variables (`.env`)

The backend environment variables are specified in `server/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/hrms_db
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

> **Security Note**: All sensitive credential files (`.env`) and dependency directories (`node_modules/`) are strictly excluded via `.gitignore` to prevent secret leakage.

---

## 🤖 AI Development Process (Section 8 Evaluation)

As per assessment instructions, AI tools were leveraged to accelerate boilerplate creation, route generation, and schema drafting. Below are 5 documented prompts detailing the prompting strategy, AI outputs, accepted implementations, and manual refinements:

### Prompt 1: Database Schema & Indexing Strategy
- **The Prompt**: *"Design Mongoose schemas for Users, Attendance, and LeaveRequests in a MERN HRMS application with RBAC rules and unique constraints."*
- **Why Used**: To establish structured data models with MongoDB validation rules, references, and timestamps.
- **AI's Approach/Output**: Generated 3 separate Mongoose schema files with basic field types and string references.
- **What Accepted**: Schema structures, password hashing pre-save hook, and status enums (`Active`/`Inactive`, `Present`/`Absent`, `Pending`/`Approved`/`Rejected`).
- **What Changed/Rejected**: AI omitted the compound unique index on `{ employeeId: 1, date: 1 }` in `Attendance`, which allowed duplicate check-ins on the same date. Added explicit index constraint to prevent duplicate attendance logs.

### Prompt 2: Middleware for Role-Based Access Control (RBAC)
- **The Prompt**: *"Write a flexible Express middleware function to restrict route access by user roles (HR, Manager, Employee)."*
- **Why Used**: To enforce security at the HTTP request layer instead of relying solely on frontend button hiding.
- **AI's Approach/Output**: Created a higher-order middleware function checking `req.user.role`.
- **What Accepted**: Variadic parameter function pattern `authorize(...roles)`.
- **What Changed/Rejected**: AI's initial output did not handle deactivated user status (`status === 'Inactive'`). Updated `authMiddleware.js` to instantly reject requests from deactivated user accounts with a `403 Forbidden` response.

### Prompt 3: Leave Application & Overlapping Date Validation
- **The Prompt**: *"Write an Express controller function for applying leave that checks for overlapping dates and invalid start/end dates."*
- **Why Used**: To handle edge cases where employees submit overlapping leave requests or end dates prior to start dates.
- **AI's Approach/Output**: Calculated total days and used a simple date query filter.
- **What Accepted**: Calculation of total leave days using date timestamps.
- **What Changed/Rejected**: AI's overlap query checked `startDate` and `endDate` equality only (`$eq`), missing date ranges that span across existing leaves. Updated the query to use range overlap logic: `startDate <= newEndDate AND endDate >= newStartDate`. Also added validation blocking leave application if attendance (`Present`) is already marked for those dates.

### Prompt 4: Manager Team Attendance & Leave Isolation
- **The Prompt**: *"Write Express route handlers for Managers to view team attendance and approve team leave requests."*
- **Why Used**: To enforce team boundaries so managers can only access data belonging to their direct reports.
- **AI's Approach/Output**: Queried all attendance and leave records without filtering by `managerId`.
- **What Accepted**: Data populate formatting for employee details.
- **What Changed/Rejected**: AI allowed managers to view and approve any employee's leave request. Modified the query to resolve team members first (`managerId: req.user._id`), preventing cross-team data leaks and cross-team approval tampering.

### Prompt 5: Dynamic Role-Aware Dashboard Aggregation
- **The Prompt**: *"Create a single controller endpoint that returns dynamic dashboard metric cards based on the logged-in user's role."*
- **Why Used**: To avoid hardcoded dashboard data and supply role-specific counts directly from MongoDB.
- **AI's Approach/Output**: Returned a single static JSON object with sample count values.
- **What Accepted**: The concept of a unified `/api/dashboard/stats` endpoint.
- **What Changed/Rejected**: Rejected hardcoded mock data. Implemented dynamic Mongoose queries (`User.countDocuments`, `Attendance.countDocuments`, `LeaveRequest.countDocuments`) scoped dynamically by role (`HR`, `Manager`, `Employee`).

---

## 🔍 AI Code Review Challenge (Section 9 Evaluation)

During AI-assisted development, code generated by AI tools was audited against security requirements and business rules. Below are 2 specific cases where AI code contained flaws and was refactored:

### Case 1: Cross-Team Approval & Self-Approval Vulnerabilities in Leave Approvals
- **What AI Generated**:
  ```javascript
  // AI Generated Code
  const approveLeave = async (req, res) => {
    const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, { status: 'Approved' }, { new: true });
    res.json(leave);
  };
  ```
- **What Was Wrong**:
  1. **Cross-Team Approval**: Manager A could approve leave requests belonging to Manager B's team simply by passing the target leave ID in the URL.
  2. **Self-Approval**: A manager or HR user applying for leave could approve their own leave request.
- **How Identified**: Audited against security requirement: *"Manager A must not be able to approve leave for another manager's team"* and *"An employee must not be able to approve their own leave request"*.
- **How Fixed**: Refactored `leaveController.js` to populate employee data and perform security boundary checks before updating status:
  ```javascript
  const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');

  // Block Self Approval
  if (leave.employeeId._id.toString() === req.user._id.toString()) {
    return res.status(403).json({ message: 'Security Block: You cannot approve your own leave request.' });
  }

  // Block Cross-Team Approval for Managers
  if (req.user.role === 'Manager' && leave.employeeId.managerId?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied: You can only approve leave for your own team members.' });
  }
  ```

---

### Case 2: Duplicate Attendance Check-In Vulnerability
- **What AI Generated**:
  ```javascript
  // AI Generated Code
  const checkIn = async (req, res) => {
    const attendance = await Attendance.create({
      employeeId: req.user._id,
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date()
    });
    res.status(201).json(attendance);
  };
  ```
- **What Was Wrong**: An employee clicking the "Check-In" button multiple times on the same day would create duplicate records in MongoDB, breaking daily present counts on dashboards and corrupting attendance logs.
- **How Identified**: Audited against requirement: *"What happens if an employee clicks Check-in twice?"*.
- **How Fixed**: Added a compound unique index in Mongoose (`attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })`) and implemented explicit check-in validation in `attendanceController.js`:
  ```javascript
  const today = new Date().toISOString().split('T')[0];
  const existingRecord = await Attendance.findOne({ employeeId: req.user._id, date: today });

  if (existingRecord) {
    return res.status(400).json({ message: 'You have already checked in for today.' });
  }
  ```

---

## 🛡️ Edge Cases Handled

1. **Overlapping Leaves**: System queries existing pending/approved requests to block date range overlaps.
2. **Invalid Date Ranges**: Blocks submissions where `endDate < startDate`.
3. **Leave vs Attendance Conflicts**: Blocks leave applications on dates where attendance is already marked `Present`; blocks `check-in` on days with approved leave.
4. **Order Enforcement**: Prevents check-out without prior check-in; prevents duplicate check-in.
5. **Rejection Transparency**: Requires managers/HR to provide an explicit reason when rejecting a leave request.

---

## 📄 Planning & Architecture Reference

For detailed system requirement breakdown, database entity relationships, permission matrix, and full 22 API endpoints documentation, view [`planning.md`](./planning.md).

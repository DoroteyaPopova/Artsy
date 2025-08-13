// server/src/routes/teacherRoutes.js
const express = require("express");
const router = express.Router();
const {
   submitTeacherApplication,
   getTeacherApplicationStatus,
   getAllTeacherApplications,
   getPendingApplications,
   getApprovedTeachers,
   approveTeacherApplication,
   rejectTeacherApplication,
   updateTeacherApplication,
   deleteTeacherApplication,
} = require("../controllers/teacherController");

// Public routes
router.get("/approved", getApprovedTeachers); // Get list of approved teachers

// Protected routes (require authentication)
router.post("/apply", submitTeacherApplication); // Submit teacher application
router.get("/my-application", getTeacherApplicationStatus); // Get user's application status
router.put("/my-application", updateTeacherApplication); // Update user's pending application
router.delete("/my-application", deleteTeacherApplication); // Delete user's pending application

// Admin routes (TODO: Add admin middleware when roles are implemented)
router.get("/applications", getAllTeacherApplications); // Get all applications (admin)
router.get("/applications/pending", getPendingApplications); // Get pending applications (admin)
router.put("/applications/:applicationId/approve", approveTeacherApplication); // Approve application (admin)
router.put("/applications/:applicationId/reject", rejectTeacherApplication); // Reject application (admin)

module.exports = router;

// server/src/routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const {
   getAllCourses,
   getSingleCourse,
   createCourse,
   updateCourse,
   deleteCourse,
   getCoursesByTeacher,
   enrollInCourse,
   unenrollFromCourse,
   getUserEnrolledCourses,
   getCourseStats,
} = require("../controllers/courseController");

// Public routes
router.get("/", getAllCourses); // GET /courses - Get all courses with filters
router.get("/stats", getCourseStats); // GET /courses/stats - Get course statistics
router.get("/:id", getSingleCourse); // GET /courses/:id - Get single course
router.get("/teacher/:teacherId", getCoursesByTeacher); // GET /courses/teacher/:teacherId - Get courses by teacher

// Protected routes (require authentication)
router.post("/", createCourse); // POST /courses - Create new course (teachers only)
router.put("/:id", updateCourse); // PUT /courses/:id - Update course (teacher only)
router.delete("/:id", deleteCourse); // DELETE /courses/:id - Delete course (teacher only)

// Enrollment routes
router.post("/:id/enroll", enrollInCourse); // POST /courses/:id/enroll - Enroll in course
router.post("/:id/unenroll", unenrollFromCourse); // POST /courses/:id/unenroll - Unenroll from course
router.get("/user/enrolled", getUserEnrolledCourses); // GET /courses/user/enrolled - Get user's enrolled courses

module.exports = router;

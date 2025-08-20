// server/src/controllers/courseController.js - UPDATED VERSION
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { updateSingleCourseStatus } = require("../services/courseStatusService");

// Get all courses (public - with filters)
const getAllCourses = async (req, res) => {
   try {
      const {
         category,
         level,
         status = "published",
         teacher,
         sortBy = "startDate",
         order = "asc",
         page = 1,
         limit = 12,
      } = req.query;

      // Build filter
      const filter = {};

      if (
         status &&
         ["draft", "published", "ongoing", "completed"].includes(status)
      ) {
         filter.status = status;
      }

      if (category) {
         filter.category = category;
      }

      if (
         level &&
         ["beginner", "intermediate", "advanced", "all-levels"].includes(level)
      ) {
         filter.level = level;
      }

      if (teacher) {
         filter.teacher = teacher;
      }

      // Build sort
      const sortOptions = {};
      const validSortFields = [
         "startDate",
         "createdAt",
         "cost.amount",
         "averageRating",
         "title",
      ];
      if (validSortFields.includes(sortBy)) {
         sortOptions[sortBy] = order === "desc" ? -1 : 1;
      }

      // Pagination
      const skip = (page - 1) * limit;

      let courses = await Course.find(filter)
         .populate("teacher", "username email")
         .sort(sortOptions)
         .skip(skip)
         .limit(parseInt(limit));

      // Update course statuses based on current date
      courses = await Promise.all(
         courses.map((course) => updateSingleCourseStatus(course))
      );

      const total = await Course.countDocuments(filter);

      res.status(200).json({
         courses,
         pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
         },
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Get single course by ID
const getSingleCourse = async (req, res) => {
   try {
      const { id } = req.params;

      let courseData = await Course.findById(id)
         .populate("teacher", "username email bio avatar")
         .populate("enrolledStudents.student", "username");

      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      // Update course status based on current date
      courseData = await updateSingleCourseStatus(courseData);

      res.status(200).json(courseData);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Get courses by teacher
const getCoursesByTeacher = async (req, res) => {
   try {
      const { teacherId } = req.params;
      const { status } = req.query;

      const filter = { teacher: teacherId };
      if (status) {
         filter.status = status;
      }

      let courses = await Course.find(filter)
         .populate("teacher", "username email")
         .sort({ createdAt: -1 });

      // Update course statuses based on current date
      courses = await Promise.all(
         courses.map((course) => updateSingleCourseStatus(course))
      );

      res.status(200).json(courses);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Create new course (teachers only)
const createCourse = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      // Check if user is a teacher
      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ error: "User not found" });
      }

      if (!user.isTeacher() && user.role !== "admin") {
         return res
            .status(403)
            .json({ error: "Only teachers can create courses" });
      }

      const {
         title,
         description,
         duration,
         cost,
         schedule,
         startDate,
         endDate,
         category,
         level,
         maxStudents,
         requirements,
         materials,
         image,
         tags,
      } = req.body;

      // Validation
      if (
         !title ||
         !description ||
         !duration ||
         !cost ||
         !schedule ||
         !startDate ||
         !endDate
      ) {
         return res.status(400).json({ error: "Missing required fields" });
      }

      // Create course
      const newCourse = new Course({
         title,
         description,
         teacher: userId,
         teacherName: user.username,
         duration,
         cost,
         schedule,
         startDate: new Date(startDate),
         endDate: new Date(endDate),
         category,
         level,
         maxStudents: maxStudents || 10,
         requirements: requirements || "",
         materials: materials || "",
         image: image || "",
         tags: tags || [],
      });

      await newCourse.save();
      await newCourse.populate("teacher", "username email");

      res.status(201).json({
         message: "Course created successfully",
         course: newCourse,
      });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

// Update course (teacher only)
const updateCourse = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      // Check if course exists and user owns it
      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
         return res.status(404).json({ error: "Course not found" });
      }

      if (existingCourse.teacher.toString() !== userId) {
         return res
            .status(403)
            .json({ error: "Not authorized to update this course" });
      }

      let updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
         new: true,
         runValidators: true,
      }).populate("teacher", "username email");

      // Update course status based on current date after update
      updatedCourse = await updateSingleCourseStatus(updatedCourse);

      res.status(200).json({
         message: "Course updated successfully",
         course: updatedCourse,
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Update course status (teacher only)
const updateCourseStatus = async (req, res) => {
   try {
      const { id } = req.params;
      const { status } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      // Validate status
      const validStatuses = [
         "draft",
         "published",
         "ongoing",
         "completed",
         "cancelled",
      ];
      if (!status || !validStatuses.includes(status)) {
         return res.status(400).json({
            error:
               "Invalid status. Must be one of: " + validStatuses.join(", "),
         });
      }

      // Check if course exists and user owns it
      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
         return res.status(404).json({ error: "Course not found" });
      }

      if (existingCourse.teacher.toString() !== userId) {
         return res
            .status(403)
            .json({ error: "Not authorized to update this course" });
      }

      // Business logic for status transitions
      const currentStatus = existingCourse.status;

      // Define allowed manual status transitions
      const allowedTransitions = {
         draft: ["published", "cancelled"],
         published: ["cancelled"], // ongoing is automatic
         ongoing: ["cancelled"], // completed is automatic
         completed: [], // Cannot change from completed
         cancelled: [], // Cannot change from cancelled
      };

      if (
         !allowedTransitions[currentStatus] ||
         !allowedTransitions[currentStatus].includes(status)
      ) {
         return res.status(400).json({
            error: `Cannot manually change status from '${currentStatus}' to '${status}'`,
         });
      }

      // Additional validation for publishing
      if (status === "published") {
         // Check if course has all required information
         if (
            !existingCourse.title ||
            !existingCourse.description ||
            !existingCourse.startDate ||
            !existingCourse.endDate ||
            !existingCourse.schedule ||
            !existingCourse.cost
         ) {
            return res.status(400).json({
               error: "Course must have all required information before publishing",
            });
         }

         // Check if start date is in the future
         const now = new Date();
         const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
         );
         const startDate = new Date(existingCourse.startDate);
         const courseStartDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
         );

         if (courseStartDate < today) {
            return res.status(400).json({
               error: "Cannot publish course with start date in the past",
            });
         }
      }

      // Update the course status
      let updatedCourse = await Course.findByIdAndUpdate(
         id,
         {
            status,
            ...(status === "published" && { publishedAt: new Date() }),
            ...(status === "cancelled" && { cancelledAt: new Date() }),
            ...(status === "completed" && { completedAt: new Date() }),
         },
         {
            new: true,
            runValidators: true,
         }
      ).populate("teacher", "username email");

      // After manual status update, check if it should be auto-updated based on dates
      updatedCourse = await updateSingleCourseStatus(updatedCourse);

      res.status(200).json({
         message: `Course status updated to ${updatedCourse.status} successfully`,
         course: updatedCourse,
      });
   } catch (error) {
      console.error("Error updating course status:", error);
      res.status(500).json({ error: error.message });
   }
};

// Delete course (teacher only)
const deleteCourse = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      // Check if course exists and user owns it
      const courseData = await Course.findById(id);
      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      if (courseData.teacher.toString() !== userId) {
         return res
            .status(403)
            .json({ error: "Not authorized to delete this course" });
      }

      // Don't allow deletion if there are enrolled students
      if (courseData.currentStudents > 0) {
         return res.status(400).json({
            error: "Cannot delete course with enrolled students",
         });
      }

      await Course.findByIdAndDelete(id);

      res.status(200).json({ message: "Course deleted successfully" });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Enroll in course
const enrollInCourse = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      let courseData = await Course.findById(id);
      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      // Update course status first
      courseData = await updateSingleCourseStatus(courseData);

      if (
         courseData.status !== "published" &&
         courseData.status !== "ongoing"
      ) {
         return res
            .status(400)
            .json({ error: "Course is not available for enrollment" });
      }

      await courseData.enrollStudent(userId);

      res.status(200).json({
         message: "Successfully enrolled in course",
         course: courseData,
      });
   } catch (error) {
      if (
         error.message === "Course is full" ||
         error.message === "Student is already enrolled"
      ) {
         return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
   }
};

// Unenroll from course
const unenrollFromCourse = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      let courseData = await Course.findById(id);
      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      await courseData.unenrollStudent(userId);

      // Update course status after unenrollment
      courseData = await updateSingleCourseStatus(courseData);

      res.status(200).json({
         message: "Successfully unenrolled from course",
         course: courseData,
      });
   } catch (error) {
      if (error.message === "Student is not enrolled in this course") {
         return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
   }
};

// Get user's enrolled courses
const getUserEnrolledCourses = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      let courses = await Course.find({
         "enrolledStudents.student": userId,
      }).populate("teacher", "username email");

      // Update course statuses
      courses = await Promise.all(
         courses.map((course) => updateSingleCourseStatus(course))
      );

      res.status(200).json(courses);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Get course statistics
const getCourseStats = async (req, res) => {
   try {
      const stats = await Course.aggregate([
         {
            $group: {
               _id: null,
               totalCourses: { $sum: 1 },
               publishedCourses: {
                  $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
               },
               totalStudents: { $sum: "$currentStudents" },
               averageCost: { $avg: "$cost.amount" },
               categoryCounts: {
                  $push: "$category",
               },
            },
         },
      ]);

      res.status(200).json(stats[0] || {});
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

module.exports = {
   getAllCourses,
   getSingleCourse,
   createCourse,
   updateCourse,
   updateCourseStatus,
   deleteCourse,
   getCoursesByTeacher,
   enrollInCourse,
   unenrollFromCourse,
   getUserEnrolledCourses,
   getCourseStats,
};

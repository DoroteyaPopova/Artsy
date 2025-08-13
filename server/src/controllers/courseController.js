// server/src/controllers/courseController.js
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

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

      const courses = await Course.find(filter)
         .populate("teacher", "username email")
         .sort(sortOptions)
         .skip(skip)
         .limit(parseInt(limit));

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

      const courseData = await Course.findById(id)
         .populate("teacher", "username email bio avatar")
         .populate("enrolledStudents.student", "username");

      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      res.status(200).json(courseData);
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

      const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
         new: true,
         runValidators: true,
      }).populate("teacher", "username email");

      res.status(200).json({
         message: "Course updated successfully",
         course: updatedCourse,
      });
   } catch (error) {
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

// Get courses by teacher
const getCoursesByTeacher = async (req, res) => {
   try {
      const { teacherId } = req.params;
      const { status } = req.query;

      const filter = { teacher: teacherId };
      if (status) {
         filter.status = status;
      }

      const courses = await Course.find(filter)
         .populate("teacher", "username email")
         .sort({ createdAt: -1 });

      res.status(200).json(courses);
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

      const courseData = await Course.findById(id);
      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      if (courseData.status !== "published") {
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

      const courseData = await Course.findById(id);
      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      await courseData.unenrollStudent(userId);

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

      const courses = await Course.find({
         "enrolledStudents.student": userId,
      }).populate("teacher", "username email");

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
   deleteCourse,
   getCoursesByTeacher,
   enrollInCourse,
   unenrollFromCourse,
   getUserEnrolledCourses,
   getCourseStats,
};

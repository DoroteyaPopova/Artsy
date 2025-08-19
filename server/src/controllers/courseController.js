const Course = require("../models/courseModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

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

const createCourse = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

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

      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ error: "User not found" });
      }

      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
         return res.status(404).json({ error: "Course not found" });
      }

      const isOwner = existingCourse.teacher.toString() === userId;
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
         return res
            .status(403)
            .json({ error: "Not authorized to update this course" });
      }

      const updateData = { ...req.body };

      if (existingCourse.currentStudents > 0) {
         if (
            updateData.maxStudents !== undefined &&
            updateData.maxStudents < existingCourse.currentStudents
         ) {
            return res.status(400).json({
               error: `Cannot reduce maximum students below current enrollment (${existingCourse.currentStudents} students)`,
            });
         }

         const courseStarted = new Date(existingCourse.startDate) <= new Date();
         if (courseStarted) {
            const criticalFields = [
               "startDate",
               "schedule.daysOfWeek",
               "schedule.startTime",
               "schedule.endTime",
            ];

            const modifiedCriticalFields = [];

            if (
               updateData.startDate &&
               new Date(updateData.startDate).getTime() !==
                  new Date(existingCourse.startDate).getTime()
            ) {
               modifiedCriticalFields.push("start date");
            }

            if (updateData.schedule) {
               if (
                  updateData.schedule.daysOfWeek &&
                  JSON.stringify(updateData.schedule.daysOfWeek.sort()) !==
                     JSON.stringify(existingCourse.schedule.daysOfWeek.sort())
               ) {
                  modifiedCriticalFields.push("class days");
               }
               if (
                  updateData.schedule.startTime &&
                  updateData.schedule.startTime !==
                     existingCourse.schedule.startTime
               ) {
                  modifiedCriticalFields.push("start time");
               }
               if (
                  updateData.schedule.endTime &&
                  updateData.schedule.endTime !==
                     existingCourse.schedule.endTime
               ) {
                  modifiedCriticalFields.push("end time");
               }
            }

            if (modifiedCriticalFields.length > 0) {
               if (!isAdmin) {
                  return res.status(400).json({
                     error: `Cannot modify ${modifiedCriticalFields.join(
                        ", "
                     )} after course has started with enrolled students. Please contact an administrator if changes are necessary.`,
                  });
               }

               console.log(
                  `Admin ${
                     user.username
                  } modified critical fields for ongoing course ${id}: ${modifiedCriticalFields.join(
                     ", "
                  )}`
               );
            }
         }
      }

      if (updateData.startDate && updateData.endDate) {
         const start = new Date(updateData.startDate);
         const end = new Date(updateData.endDate);

         if (start >= end) {
            return res.status(400).json({
               error: "End date must be after start date",
            });
         }
      }

      if (updateData.status) {
         const validTransitions = {
            draft: ["published", "cancelled"],
            published: ["ongoing", "cancelled"],
            ongoing: ["completed", "cancelled"],
            completed: [],
            cancelled: ["draft"],
         };

         const currentStatus = existingCourse.status;
         const newStatus = updateData.status;

         if (currentStatus !== newStatus) {
            if (!validTransitions[currentStatus].includes(newStatus)) {
               return res.status(400).json({
                  error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
               });
            }

            if (newStatus === "published") {
               const requiredFields = [
                  "title",
                  "description",
                  "duration",
                  "cost",
                  "schedule",
                  "startDate",
                  "endDate",
               ];

               for (const field of requiredFields) {
                  const value = updateData[field] || existingCourse[field];
                  if (!value) {
                     return res.status(400).json({
                        error: `Cannot publish course without ${field}`,
                     });
                  }
               }
            }

            if (
               newStatus === "cancelled" &&
               existingCourse.currentStudents > 0
            ) {
               if (!isAdmin) {
                  return res.status(400).json({
                     error: `Cannot cancel course with ${existingCourse.currentStudents} enrolled students. Please contact an administrator.`,
                  });
               }
               console.log(
                  `Admin ${user.username} cancelled course ${id} with ${existingCourse.currentStudents} students`
               );
            }
         }
      }

      if (updateData.tags && Array.isArray(updateData.tags)) {
         updateData.tags = updateData.tags
            .map((tag) => tag.trim())
            .filter((tag) => tag !== "")
            .slice(0, 10);
      }

      const updatedCourse = await Course.findByIdAndUpdate(id, updateData, {
         new: true,
         runValidators: true,
      }).populate("teacher", "username email");

      const significantChanges = [];
      if (updateData.status && updateData.status !== existingCourse.status) {
         significantChanges.push(
            `status: ${existingCourse.status} → ${updateData.status}`
         );
      }
      if (
         updateData.maxStudents &&
         updateData.maxStudents !== existingCourse.maxStudents
      ) {
         significantChanges.push(
            `max students: ${existingCourse.maxStudents} → ${updateData.maxStudents}`
         );
      }

      if (significantChanges.length > 0) {
         console.log(
            `Course ${id} updated by ${user.username} (${
               user.role
            }): ${significantChanges.join(", ")}`
         );
      }

      res.status(200).json({
         message: "Course updated successfully",
         course: updatedCourse,
      });
   } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: error.message });
   }
};

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

      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
         return res.status(404).json({ error: "Course not found" });
      }

      if (existingCourse.teacher.toString() !== userId) {
         return res
            .status(403)
            .json({ error: "Not authorized to update this course" });
      }

      const currentStatus = existingCourse.status;

      const allowedTransitions = {
         draft: ["published", "cancelled"],
         published: ["ongoing", "cancelled"],
         ongoing: ["completed", "cancelled"],
         completed: [],
         cancelled: [],
      };

      if (
         !allowedTransitions[currentStatus] ||
         !allowedTransitions[currentStatus].includes(status)
      ) {
         return res.status(400).json({
            error: `Cannot change status from '${currentStatus}' to '${status}'`,
         });
      }

      if (status === "published") {
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

         const now = new Date();
         const startDate = new Date(existingCourse.startDate);
         if (startDate <= now) {
            return res.status(400).json({
               error: "Cannot publish course with start date in the past",
            });
         }
      }

      const updatedCourse = await Course.findByIdAndUpdate(
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

      res.status(200).json({
         message: `Course status updated to ${status} successfully`,
         course: updatedCourse,
      });
   } catch (error) {
      console.error("Error updating course status:", error);
      res.status(500).json({ error: error.message });
   }
};

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

      const courseData = await Course.findById(id);
      if (!courseData) {
         return res.status(404).json({ error: "Course not found" });
      }

      if (courseData.teacher.toString() !== userId) {
         return res
            .status(403)
            .json({ error: "Not authorized to delete this course" });
      }

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

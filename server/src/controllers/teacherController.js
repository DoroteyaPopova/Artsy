// server/src/controllers/teacherController.js
const Teacher = require("../models/teacherModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Submit teacher application
const submitTeacherApplication = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const { specialties, bio } = req.body;

      // Validation
      if (
         !specialties ||
         !Array.isArray(specialties) ||
         specialties.length === 0
      ) {
         return res
            .status(400)
            .json({ error: "At least one specialty is required" });
      }

      if (!bio || bio.trim().length < 10) {
         return res
            .status(400)
            .json({ error: "Bio must be at least 10 characters long" });
      }

      if (bio.trim().length > 200) {
         return res
            .status(400)
            .json({ error: "Bio cannot exceed 200 characters" });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has a teacher application
      const existingApplication = await Teacher.findOne({ userId });
      if (existingApplication) {
         return res.status(409).json({
            error: "You have already submitted a teacher application",
            status: existingApplication.status,
            applicationDate: existingApplication.applicationDate,
         });
      }

      // Filter out empty specialties and clean them
      const cleanedSpecialties = specialties
         .map((specialty) => specialty.trim())
         .filter((specialty) => specialty !== "")
         .slice(0, 3); // Maximum 3 specialties

      if (cleanedSpecialties.length === 0) {
         return res
            .status(400)
            .json({ error: "At least one valid specialty is required" });
      }

      // Create teacher application
      const teacherApplication = new Teacher({
         userId,
         username: user.username,
         email: user.email,
         specialties: cleanedSpecialties,
         bio: bio.trim(),
      });

      await teacherApplication.save();
      await teacherApplication.populate("userId", "username email");

      res.status(201).json({
         message: "Teacher application submitted successfully",
         application: teacherApplication,
      });
   } catch (error) {
      console.error("Error submitting teacher application:", error);
      res.status(500).json({ error: error.message });
   }
};

// Get user's teacher application status
const getTeacherApplicationStatus = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const application = await Teacher.findOne({ userId }).populate(
         "userId",
         "username email"
      );

      if (!application) {
         return res
            .status(404)
            .json({ message: "No teacher application found" });
      }

      res.status(200).json({
         application,
         hasApplication: true,
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Get all teacher applications (for admin use)
const getAllTeacherApplications = async (req, res) => {
   try {
      const { status = "all", page = 1, limit = 10 } = req.query;

      // Build filter
      const filter = {};
      if (
         status !== "all" &&
         ["pending", "approved", "rejected"].includes(status)
      ) {
         filter.status = status;
      }

      // Pagination
      const skip = (page - 1) * limit;

      const applications = await Teacher.find(filter)
         .populate("userId", "username email")
         .populate("approvedBy", "username email")
         .sort({ applicationDate: -1 })
         .skip(skip)
         .limit(parseInt(limit));

      const total = await Teacher.countDocuments(filter);

      res.status(200).json({
         applications,
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

// Get pending applications
const getPendingApplications = async (req, res) => {
   try {
      const applications = await Teacher.getPendingApplications();
      res.status(200).json({
         applications,
         count: applications.length,
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Get approved teachers
const getApprovedTeachers = async (req, res) => {
   try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const teachers = await Teacher.find({ status: "approved" })
         .populate("userId", "username email")
         .sort({ approvedDate: -1 })
         .skip(skip)
         .limit(parseInt(limit));

      const total = await Teacher.countDocuments({ status: "approved" });

      res.status(200).json({
         teachers,
         pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
         },
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Approve teacher application (admin only)
const approveTeacherApplication = async (req, res) => {
   try {
      const { applicationId } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const adminUserId = decodedToken.userId;

      // Check if the approving user is admin
      const adminUser = await User.findById(adminUserId);
      if (!adminUser || adminUser.role !== "admin") {
         return res.status(403).json({ error: "Admin access required" });
      }

      const application = await Teacher.findById(applicationId);
      if (!application) {
         return res
            .status(404)
            .json({ error: "Teacher application not found" });
      }

      if (application.status !== "pending") {
         return res.status(400).json({
            error: `Application is already ${application.status}`,
         });
      }

      // Approve the application
      await application.approve(adminUserId);

      // UPDATE USER ROLE TO TEACHER
      const applicantUser = await User.findById(application.userId);
      if (applicantUser) {
         await applicantUser.promoteToTeacher(adminUserId);
         console.log(`User ${applicantUser.username} promoted to teacher role`);
      }

      await application.populate("userId", "username email");

      res.status(200).json({
         message: "Teacher application approved successfully",
         application,
      });
   } catch (error) {
      console.error("Error approving teacher application:", error);
      res.status(500).json({ error: error.message });
   }
};

// Reject teacher application (admin only)
const rejectTeacherApplication = async (req, res) => {
   try {
      const { applicationId } = req.params;
      const { reason } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const adminUserId = decodedToken.userId;

      // TODO: Add admin role check here when you implement roles

      const application = await Teacher.findById(applicationId);
      if (!application) {
         return res
            .status(404)
            .json({ error: "Teacher application not found" });
      }

      if (application.status !== "pending") {
         return res.status(400).json({
            error: `Application is already ${application.status}`,
         });
      }

      await application.reject(reason, adminUserId);
      await application.populate("userId", "username email");

      res.status(200).json({
         message: "Teacher application rejected",
         application,
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Update teacher application (before approval)
const updateTeacherApplication = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const { specialties, bio } = req.body;

      const application = await Teacher.findOne({ userId });
      if (!application) {
         return res.status(404).json({ error: "No teacher application found" });
      }

      if (application.status !== "pending") {
         return res.status(400).json({
            error: "Cannot update application that is already processed",
         });
      }

      // Update fields if provided
      if (specialties && Array.isArray(specialties)) {
         const cleanedSpecialties = specialties
            .map((specialty) => specialty.trim())
            .filter((specialty) => specialty !== "")
            .slice(0, 3);

         if (cleanedSpecialties.length > 0) {
            application.specialties = cleanedSpecialties;
         }
      }

      if (bio && bio.trim().length >= 10 && bio.trim().length <= 200) {
         application.bio = bio.trim();
      }

      await application.save();
      await application.populate("userId", "username email");

      res.status(200).json({
         message: "Teacher application updated successfully",
         application,
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Delete teacher application (before approval)
const deleteTeacherApplication = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const application = await Teacher.findOne({ userId });
      if (!application) {
         return res.status(404).json({ error: "No teacher application found" });
      }

      if (application.status === "approved") {
         return res.status(400).json({
            error: "Cannot delete approved teacher application",
         });
      }

      await Teacher.findByIdAndDelete(application._id);

      res.status(200).json({
         message: "Teacher application deleted successfully",
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

module.exports = {
   submitTeacherApplication,
   getTeacherApplicationStatus,
   getAllTeacherApplications,
   getPendingApplications,
   getApprovedTeachers,
   approveTeacherApplication,
   rejectTeacherApplication,
   updateTeacherApplication,
   deleteTeacherApplication,
};

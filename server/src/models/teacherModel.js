const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         unique: true,
      },
      username: {
         type: String,
         required: [true, "Username is required"],
         trim: true,
      },
      email: {
         type: String,
         required: [true, "Email is required"],
         trim: true,
         lowercase: true,
      },
      specialties: [
         {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, "Specialty cannot exceed 50 characters"],
         },
      ],
      bio: {
         type: String,
         required: [true, "Bio is required"],
         trim: true,
         minlength: [10, "Bio must be at least 10 characters"],
         maxlength: [200, "Bio cannot exceed 200 characters"],
      },
      status: {
         type: String,
         enum: ["pending", "approved", "rejected"],
         default: "pending",
      },
      applicationDate: {
         type: Date,
         default: Date.now,
      },
      approvedDate: {
         type: Date,
      },
      approvedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      rejectionReason: {
         type: String,
         trim: true,
      },
      // Additional teacher info (can be added later)
      experience: {
         type: String,
         trim: true,
      },
      portfolio: {
         type: String, // URL to portfolio
         trim: true,
      },
      rating: {
         type: Number,
         default: 0,
         min: 0,
         max: 5,
      },
      totalStudents: {
         type: Number,
         default: 0,
      },
      totalCourses: {
         type: Number,
         default: 0,
      },
   },
   {
      timestamps: true,
   }
);

// Index for efficient queries - REMOVED DUPLICATE userId INDEX
// Removed: TeacherSchema.index({ userId: 1 }); // DUPLICATE - userId already has unique: true
TeacherSchema.index({ status: 1 });
TeacherSchema.index({ applicationDate: -1 });

// Virtual for getting specialty count
TeacherSchema.virtual("specialtyCount").get(function () {
   return this.specialties.length;
});

// Method to approve teacher application
TeacherSchema.methods.approve = function (approvedByUserId) {
   this.status = "approved";
   this.approvedDate = new Date();
   this.approvedBy = approvedByUserId;
   return this.save();
};

// Method to reject teacher application
TeacherSchema.methods.reject = function (reason, rejectedByUserId) {
   this.status = "rejected";
   this.rejectionReason = reason;
   this.approvedBy = rejectedByUserId; // Track who rejected
   return this.save();
};

// Static method to get pending applications
TeacherSchema.statics.getPendingApplications = function () {
   return this.find({ status: "pending" })
      .populate("userId", "username email")
      .sort({ applicationDate: -1 });
};

// Static method to get approved teachers
TeacherSchema.statics.getApprovedTeachers = function () {
   return this.find({ status: "approved" })
      .populate("userId", "username email")
      .sort({ approvedDate: -1 });
};

// Ensure virtuals are included in JSON
TeacherSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Teacher", TeacherSchema);

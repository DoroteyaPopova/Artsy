// server/src/models/courseModel.js
const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
   {
      title: {
         type: String,
         required: [true, "Course title is required"],
         trim: true,
         maxlength: [100, "Title cannot exceed 100 characters"],
      },
      description: {
         type: String,
         required: [true, "Course description is required"],
         trim: true,
         minlength: [20, "Description must be at least 20 characters"],
         maxlength: [1000, "Description cannot exceed 1000 characters"],
      },
      teacher: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: [true, "Teacher is required"],
      },
      teacherName: {
         type: String,
         required: [true, "Teacher name is required"],
         trim: true,
      },
      // Course duration and scheduling
      duration: {
         weeks: {
            type: Number,
            required: [true, "Duration in weeks is required"],
            min: [1, "Duration must be at least 1 week"],
            max: [52, "Duration cannot exceed 52 weeks"],
         },
         totalHours: {
            type: Number,
            required: [true, "Total hours is required"],
            min: [1, "Total hours must be at least 1"],
         },
      },
      cost: {
         amount: {
            type: Number,
            required: [true, "Cost amount is required"],
            min: [0, "Cost cannot be negative"],
         },
         currency: {
            type: String,
            default: "USD",
            enum: ["USD", "EUR", "BGN", "GBP"],
         },
      },
      // Schedule information
      schedule: {
         daysOfWeek: [
            {
               type: String,
               enum: [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
               ],
               required: true,
            },
         ],
         startTime: {
            type: String,
            required: [true, "Start time is required"],
            validate: {
               validator: function (v) {
                  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
               },
               message: "Start time must be in HH:MM format (24-hour)",
            },
         },
         endTime: {
            type: String,
            required: [true, "End time is required"],
            validate: {
               validator: function (v) {
                  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
               },
               message: "End time must be in HH:MM format (24-hour)",
            },
         },
         timezone: {
            type: String,
            default: "UTC",
         },
      },
      // Course dates
      startDate: {
         type: Date,
         required: [true, "Start date is required"],
      },
      endDate: {
         type: Date,
         required: [true, "End date is required"],
      },
      // Course details
      category: {
         type: String,
         required: [true, "Category is required"],
         enum: {
            values: [
               "digital-art",
               "traditional-painting",
               "drawing",
               "mixed-media",
               "sculpture",
               "art-history",
               "other",
            ],
            message: "Invalid category",
         },
      },
      level: {
         type: String,
         required: [true, "Level is required"],
         enum: {
            values: ["beginner", "intermediate", "advanced", "all-levels"],
            message: "Invalid level",
         },
      },
      maxStudents: {
         type: Number,
         required: [true, "Maximum students is required"],
         min: [1, "Must allow at least 1 student"],
         max: [50, "Cannot exceed 50 students"],
         default: 10,
      },
      currentStudents: {
         type: Number,
         default: 0,
         min: 0,
      },
      // Course status
      status: {
         type: String,
         enum: ["draft", "published", "ongoing", "completed", "cancelled"],
         default: "draft",
      }, // Status timestamps
      publishedAt: {
         type: Date,
      },
      cancelledAt: {
         type: Date,
      },
      completedAt: {
         type: Date,
      },
      // Requirements and materials
      requirements: {
         type: String,
         maxlength: [500, "Requirements cannot exceed 500 characters"],
         default: "",
      },
      materials: {
         type: String,
         maxlength: [500, "Materials list cannot exceed 500 characters"],
         default: "",
      },
      // Course image
      image: {
         type: String,
         default: "",
      },
      // Enrollment tracking
      enrolledStudents: [
         {
            student: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
            },
            enrolledAt: {
               type: Date,
               default: Date.now,
            },
            progress: {
               type: Number,
               default: 0,
               min: 0,
               max: 100,
            },
            status: {
               type: String,
               enum: ["enrolled", "completed", "dropped"],
               default: "enrolled",
            },
         },
      ],
      // Rating system
      averageRating: {
         type: Number,
         default: 0,
         min: 0,
         max: 5,
      },
      ratingCount: {
         type: Number,
         default: 0,
      },
      // Tags for better searchability
      tags: [
         {
            type: String,
            trim: true,
            maxlength: [30, "Tag cannot exceed 30 characters"],
         },
      ],
   },
   {
      timestamps: true,
   }
);

// Indexes for efficient queries
CourseSchema.index({ teacher: 1 });
CourseSchema.index({ status: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ level: 1 });
CourseSchema.index({ startDate: 1 });
CourseSchema.index({ "schedule.daysOfWeek": 1 });

// Virtual for formatted schedule
CourseSchema.virtual("formattedSchedule").get(function () {
   const days = this.schedule.daysOfWeek
      .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
      .join(", ");
   return `${days} from ${this.schedule.startTime} to ${this.schedule.endTime}`;
});

// Virtual for availability
CourseSchema.virtual("spotsAvailable").get(function () {
   return this.maxStudents - this.currentStudents;
});

// Virtual for formatted cost
CourseSchema.virtual("formattedCost").get(function () {
   return `${this.cost.amount} ${this.cost.currency}`;
});

// Method to check if course is full
CourseSchema.methods.isFull = function () {
   return this.currentStudents >= this.maxStudents;
};

// Method to enroll a student
CourseSchema.methods.enrollStudent = function (studentId) {
   if (this.isFull()) {
      throw new Error("Course is full");
   }

   const isAlreadyEnrolled = this.enrolledStudents.some(
      (enrollment) => enrollment.student.toString() === studentId.toString()
   );

   if (isAlreadyEnrolled) {
      throw new Error("Student is already enrolled");
   }

   this.enrolledStudents.push({
      student: studentId,
      enrolledAt: new Date(),
   });

   this.currentStudents += 1;
   return this.save();
};

// Method to unenroll a student
CourseSchema.methods.unenrollStudent = function (studentId) {
   const enrollmentIndex = this.enrolledStudents.findIndex(
      (enrollment) => enrollment.student.toString() === studentId.toString()
   );

   if (enrollmentIndex === -1) {
      throw new Error("Student is not enrolled in this course");
   }

   this.enrolledStudents.splice(enrollmentIndex, 1);
   this.currentStudents = Math.max(0, this.currentStudents - 1);
   return this.save();
};

// Static method to get courses by teacher
CourseSchema.statics.getCoursesByTeacher = function (teacherId) {
   return this.find({ teacher: teacherId })
      .populate("teacher", "username email")
      .sort({ createdAt: -1 });
};

// Static method to get published courses
CourseSchema.statics.getPublishedCourses = function () {
   return this.find({ status: "published" })
      .populate("teacher", "username email")
      .sort({ startDate: 1 });
};

// Pre-save middleware to validate dates
CourseSchema.pre("save", function (next) {
   if (this.startDate >= this.endDate) {
      return next(new Error("End date must be after start date"));
   }

   // Calculate total hours if not provided
   if (!this.duration.totalHours) {
      const startTime = this.schedule.startTime.split(":");
      const endTime = this.schedule.endTime.split(":");
      const dailyHours =
         parseInt(endTime[0]) * 60 +
         parseInt(endTime[1]) -
         (parseInt(startTime[0]) * 60 + parseInt(startTime[1]));
      const sessionsPerWeek = this.schedule.daysOfWeek.length;
      this.duration.totalHours = Math.round(
         (dailyHours / 60) * sessionsPerWeek * this.duration.weeks
      );
   }

   next();
});

// Ensure virtuals are included in JSON
CourseSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Course", CourseSchema);

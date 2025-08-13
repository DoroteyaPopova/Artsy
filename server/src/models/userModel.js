const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
   {
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },
      username: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      password: {
         type: String,
         required: true,
      },
      bio: {
         type: String,
         maxlength: 500,
         default: "",
      },
      location: {
         type: String,
         maxlength: 100,
         default: "",
      },
      avatar: {
         type: String,
         default: "",
      },
      // NEW: Role system
      role: {
         type: String,
         enum: ["user", "teacher", "admin"],
         default: "user",
      },
      // Track when role was last updated and by whom
      roleUpdatedAt: {
         type: Date,
         default: Date.now,
      },
      roleUpdatedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },
   },
   {
      timestamps: true, // Adds createdAt and updatedAt
   }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
   if (!this.isModified("password")) return next();
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
   next();
});

// Method to check if user is admin
UserSchema.methods.isAdmin = function () {
   return this.role === "admin";
};

// Method to check if user is teacher or above
UserSchema.methods.isTeacher = function () {
   return this.role === "teacher" || this.role === "admin";
};

// Method to promote user to teacher
UserSchema.methods.promoteToTeacher = function (promotedByUserId) {
   if (this.role === "user") {
      this.role = "teacher";
      this.roleUpdatedAt = new Date();
      this.roleUpdatedBy = promotedByUserId;
      return this.save();
   }
   throw new Error("User is already a teacher or admin");
};

// Method to demote teacher to user
UserSchema.methods.demoteToUser = function (demotedByUserId) {
   if (this.role === "teacher") {
      this.role = "user";
      this.roleUpdatedAt = new Date();
      this.roleUpdatedBy = demotedByUserId;
      return this.save();
   }
   throw new Error("User is not a teacher or cannot be demoted");
};

// Static method to set admin role (use carefully!)
UserSchema.statics.setAdminRole = function (userId, setByUserId = null) {
   return this.findByIdAndUpdate(
      userId,
      {
         role: "admin",
         roleUpdatedAt: new Date(),
         roleUpdatedBy: setByUserId,
      },
      { new: true }
   );
};

// Static method to get users by role
UserSchema.statics.getUsersByRole = function (role) {
   return this.find({ role }).select("-password");
};

// Index for efficient role queries - REMOVED DUPLICATE INDEXES
UserSchema.index({ role: 1 });
// Removed: UserSchema.index({ email: 1 }); // DUPLICATE - email already has unique: true
// Removed: UserSchema.index({ username: 1 }); // DUPLICATE - username already has unique: true

module.exports = mongoose.model("User", UserSchema);

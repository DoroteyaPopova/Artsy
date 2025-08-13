// server/src/models/paintingModel.js
const mongoose = require("mongoose");

const PaintingSchema = mongoose.Schema(
   {
      title: {
         type: String,
         required: [true, "Please enter title"],
         trim: true,
         maxlength: [100, "Title cannot exceed 100 characters"],
      },
      author: {
         type: String,
         required: [true, "Please enter author name"],
         trim: true,
         maxlength: [50, "Author name cannot exceed 50 characters"],
      },
      category: {
         type: String,
         required: [true, "Please select a category"],
         enum: {
            values: ["digital", "canvas"],
            message: "Category must be either 'digital' or 'canvas'",
         },
      },
      dimensions: {
         width: {
            type: Number,
            required: [true, "Please enter width"],
         },
         height: {
            type: Number,
            required: [true, "Please enter height"],
         },
         unit: {
            type: String,
            enum: ["cm", "inches", "px"],
            default: "cm",
         },
      },
      description: {
         type: String,
         required: [true, "Please enter description"],
         minlength: [10, "Description must be at least 10 characters"],
         maxlength: [1000, "Description cannot exceed 1000 characters"],
      },
      image: {
         type: String,
         required: [true, "Please provide image URL"],
      },
      owner: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      // Rating system
      totalRating: {
         type: Number,
         default: 0,
      },
      ratingCount: {
         type: Number,
         default: 0,
      },
      averageRating: {
         type: Number,
         default: 0,
         min: 0,
         max: 5,
      },
      // Comments count (actual comments stored separately)
      commentCount: {
         type: Number,
         default: 0,
      },
      // Tags
      tags: [
         {
            type: String,
            trim: true,
         },
      ],
   },
   {
      timestamps: true, // Adds createdAt and updatedAt
   }
);

// Virtual for formatted dimensions
PaintingSchema.virtual("formattedDimensions").get(function () {
   return `${this.dimensions.width} × ${this.dimensions.height} ${this.dimensions.unit}`;
});

// Method to calculate average rating
PaintingSchema.methods.updateAverageRating = function () {
   if (this.ratingCount > 0) {
      this.averageRating = (this.totalRating / this.ratingCount).toFixed(1);
   } else {
      this.averageRating = 0;
   }
};

// Ensure virtuals are included in JSON
PaintingSchema.set("toJSON", { virtuals: true });

const Painting = mongoose.model("Painting", PaintingSchema);

module.exports = Painting;

// server/src/models/ratingModel.js
const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
   {
      paintingId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Painting",
         required: true,
      },
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      rating: {
         type: Number,
         required: true,
         min: 1,
         max: 5,
         validate: {
            validator: Number.isInteger,
            message: "Rating must be an integer between 1 and 5",
         },
      },
   },
   {
      timestamps: true,
   }
);

// Compound index to ensure one rating per user per painting
RatingSchema.index({ paintingId: 1, userId: 1 }, { unique: true });

// Pre-save hook to update painting's rating statistics
RatingSchema.post("save", async function () {
   await updatePaintingRating(this.paintingId);
});

RatingSchema.post("remove", async function () {
   await updatePaintingRating(this.paintingId);
});

RatingSchema.post("findOneAndDelete", async function (doc) {
   if (doc) {
      await updatePaintingRating(doc.paintingId);
   }
});

// Function to update painting rating statistics
async function updatePaintingRating(paintingId) {
   const Rating = mongoose.model("Rating");
   const Painting = mongoose.model("Painting");

   const stats = await Rating.aggregate([
      { $match: { paintingId: paintingId } },
      {
         $group: {
            _id: "$paintingId",
            totalRating: { $sum: "$rating" },
            ratingCount: { $sum: 1 },
            averageRating: { $avg: "$rating" },
         },
      },
   ]);

   if (stats.length > 0) {
      await Painting.findByIdAndUpdate(paintingId, {
         totalRating: stats[0].totalRating,
         ratingCount: stats[0].ratingCount,
         averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
      });
   } else {
      // No ratings left
      await Painting.findByIdAndUpdate(paintingId, {
         totalRating: 0,
         ratingCount: 0,
         averageRating: 0,
      });
   }
}

module.exports = mongoose.model("Rating", RatingSchema);

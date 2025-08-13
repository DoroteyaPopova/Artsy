const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
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
      content: {
         type: String,
         required: [true, "Comment content is required"],
         trim: true,
         minlength: [1, "Comment cannot be empty"],
         maxlength: [500, "Comment cannot exceed 500 characters"],
      },
      parentComment: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment",
         default: null, // For nested replies
      },
      likes: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      ],
      isEdited: {
         type: Boolean,
         default: false,
      },
      editedAt: {
         type: Date,
      },
   },
   {
      timestamps: true,
   }
);

// Index for efficient queries
CommentSchema.index({ paintingId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });

// Pre-save hook to update painting's comment count
CommentSchema.post("save", async function () {
   await updatePaintingCommentCount(this.paintingId);
});

CommentSchema.post("remove", async function () {
   await updatePaintingCommentCount(this.paintingId);
});

CommentSchema.post("findOneAndDelete", async function (doc) {
   if (doc) {
      await updatePaintingCommentCount(doc.paintingId);
   }
});

// Function to update painting comment count
async function updatePaintingCommentCount(paintingId) {
   const Comment = mongoose.model("Comment");
   const Painting = mongoose.model("Painting");

   const count = await Comment.countDocuments({
      paintingId: paintingId,
      parentComment: null, // Only count top-level comments
   });

   await Painting.findByIdAndUpdate(paintingId, {
      commentCount: count,
   });
}

// Virtual for like count
CommentSchema.virtual("likeCount").get(function () {
   return this.likes.length;
});

// Method to check if user liked this comment
CommentSchema.methods.isLikedByUser = function (userId) {
   return this.likes.includes(userId);
};

// Ensure virtuals are included in JSON
CommentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Comment", CommentSchema);

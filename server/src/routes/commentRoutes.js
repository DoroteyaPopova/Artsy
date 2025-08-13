const express = require("express");
const router = express.Router();
const {
   getCommentsForPainting,
   addComment,
   updateComment,
   deleteComment,
   likeComment,
} = require("../controllers/commentController");

// Get comments for a specific painting
router.get("/painting/:paintingId", getCommentsForPainting);

// Add a new comment
router.post("/", addComment);

// Update a comment
router.put("/:id", updateComment);

// Delete a comment
router.delete("/:id", deleteComment);

// Like/unlike a comment
router.post("/:id/like", likeComment);

module.exports = router;

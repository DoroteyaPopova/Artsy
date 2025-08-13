const Comment = require("../models/commentModel");
const Painting = require("../models/paintingModel");
const jwt = require("jsonwebtoken");

const getCommentsForPainting = async (req, res) => {
   try {
      const { paintingId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (page - 1) * limit;

      const comments = await Comment.find({
         paintingId,
         parentComment: null, // Only top-level comments
      })
         .populate("userId", "username email")
         .populate({
            path: "paintingId",
            select: "title",
         })
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit));

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
         comments.map(async (comment) => {
            const replies = await Comment.find({ parentComment: comment._id })
               .populate("userId", "username email")
               .sort({ createdAt: 1 });

            return {
               ...comment.toJSON(),
               replies,
            };
         })
      );

      const total = await Comment.countDocuments({
         paintingId,
         parentComment: null,
      });

      res.status(200).json({
         comments: commentsWithReplies,
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

const addComment = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const { paintingId, content, parentComment } = req.body;

      if (!paintingId || !content) {
         return res
            .status(400)
            .json({ error: "Painting ID and content are required" });
      }

      // Check if painting exists
      const painting = await Painting.findById(paintingId);
      if (!painting) {
         return res.status(404).json({ error: "Painting not found" });
      }

      // If it's a reply, check if parent comment exists
      if (parentComment) {
         const parentExists = await Comment.findById(parentComment);
         if (!parentExists) {
            return res.status(404).json({ error: "Parent comment not found" });
         }
      }

      const comment = new Comment({
         paintingId,
         userId,
         content,
         parentComment: parentComment || null,
      });

      await comment.save();
      await comment.populate("userId", "username email");

      res.status(201).json({
         message: "Comment added successfully",
         comment,
      });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

const updateComment = async (req, res) => {
   try {
      const { id } = req.params;
      const { content } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const comment = await Comment.findById(id);
      if (!comment) {
         return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.userId.toString() !== userId) {
         return res
            .status(403)
            .json({ message: "Not authorized to update this comment" });
      }

      comment.content = content;
      comment.isEdited = true;
      comment.editedAt = new Date();
      await comment.save();

      await comment.populate("userId", "username email");

      res.status(200).json(comment);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const deleteComment = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const comment = await Comment.findById(id);
      if (!comment) {
         return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.userId.toString() !== userId) {
         return res
            .status(403)
            .json({ message: "Not authorized to delete this comment" });
      }

      // Delete all replies to this comment first
      await Comment.deleteMany({ parentComment: id });

      // Then delete the comment itself
      await Comment.findByIdAndDelete(id);

      res.status(200).json({ message: "Comment deleted successfully" });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const likeComment = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      const comment = await Comment.findById(id);
      if (!comment) {
         return res.status(404).json({ message: "Comment not found" });
      }

      const isLiked = comment.likes.includes(userId);

      if (isLiked) {
         // Unlike
         comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      } else {
         // Like
         comment.likes.push(userId);
      }

      await comment.save();

      res.status(200).json({
         message: isLiked ? "Comment unliked" : "Comment liked",
         likeCount: comment.likes.length,
         isLiked: !isLiked,
      });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

module.exports = {
   getCommentsForPainting,
   addComment,
   updateComment,
   deleteComment,
   likeComment,
};

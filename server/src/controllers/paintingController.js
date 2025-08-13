// server/src/controllers/paintingController.js
const Painting = require("../models/paintingModel.js");
const Rating = require("../models/ratingModel.js");
const Comment = require("../models/commentModel.js");
const jwt = require("jsonwebtoken");

const getAllPaintings = async (req, res) => {
   try {
      const {
         category,
         sortBy = "createdAt",
         order = "desc",
         page = 1,
         limit = 10,
      } = req.query;

      // Build filter
      const filter = {};
      if (category && ["digital", "canvas"].includes(category)) {
         filter.category = category;
      }

      // Build sort
      const sortOptions = {};
      const validSortFields = ["createdAt", "averageRating", "title"];
      if (validSortFields.includes(sortBy)) {
         sortOptions[sortBy] = order === "asc" ? 1 : -1;
      }

      // Pagination
      const skip = (page - 1) * limit;

      const paintings = await Painting.find(filter)
         .populate("owner", "username email")
         .sort(sortOptions)
         .skip(skip)
         .limit(parseInt(limit));

      const total = await Painting.countDocuments(filter);

      res.status(200).json({
         paintings,
         pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
         },
      });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const getSinglePainting = async (req, res) => {
   try {
      const { id } = req.params;

      const painting = await Painting.findById(id).populate(
         "owner",
         "username email"
      );

      if (!painting) {
         return res.status(404).json({ message: "Painting not found" });
      }

      res.status(200).json(painting);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const addPainting = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      // Get user info to use username as author
      const User = require("../models/userModel");
      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ error: "User not found" });
      }

      const { title, category, dimensions, description, image, tags } =
         req.body;

      // Validation
      if (!title) {
         return res.status(400).json({ error: "Title is required" });
      }
      if (!category || !["digital", "canvas"].includes(category)) {
         return res
            .status(400)
            .json({ error: "Category must be 'digital' or 'canvas'" });
      }
      if (!dimensions || !dimensions.width || !dimensions.height) {
         return res
            .status(400)
            .json({ error: "Dimensions (width and height) are required" });
      }
      if (!description) {
         return res.status(400).json({ error: "Description is required" });
      }
      if (!image) {
         return res.status(400).json({ error: "Image URL is required" });
      }

      const painting = new Painting({
         title,
         author: user.username, // Use username from JWT token
         category,
         dimensions: {
            width: dimensions.width,
            height: dimensions.height,
            unit: dimensions.unit || "cm",
         },
         description,
         image,
         owner: userId,
         tags: tags || [],
      });

      await painting.save();

      // Populate owner info before sending response
      await painting.populate("owner", "username email");

      res.status(201).json({
         message: "Painting added successfully",
         painting,
      });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

const updatePainting = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      // Check if painting exists and user owns it
      const existingPainting = await Painting.findById(id);
      if (!existingPainting) {
         return res.status(404).json({ message: "Painting not found" });
      }

      if (existingPainting.owner.toString() !== userId) {
         return res
            .status(403)
            .json({ message: "Not authorized to update this painting" });
      }

      const updatedPainting = await Painting.findByIdAndUpdate(id, req.body, {
         new: true,
         runValidators: true,
      }).populate("owner", "username email");

      res.status(200).json(updatedPainting);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const deletePainting = async (req, res) => {
   try {
      const { id } = req.params;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "No token provided" });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_Secret);
      const userId = decodedToken.userId;

      // Check if painting exists and user owns it
      const painting = await Painting.findById(id);
      if (!painting) {
         return res.status(404).json({ message: "Painting not found" });
      }

      if (painting.owner.toString() !== userId) {
         return res
            .status(403)
            .json({ message: "Not authorized to delete this painting" });
      }

      await Painting.findByIdAndDelete(id);

      // Clean up related data
      await Rating.deleteMany({ paintingId: id });
      await Comment.deleteMany({ paintingId: id });

      res.status(200).json({ message: "Painting deleted successfully!" });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const getUserPaintings = async (req, res) => {
   try {
      const { userId } = req.params;
      const paintings = await Painting.find({ owner: userId })
         .populate("owner", "username email")
         .sort({ createdAt: -1 });
      res.status(200).json(paintings);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

// New method to get painting statistics
const getPaintingStats = async (req, res) => {
   try {
      const stats = await Painting.aggregate([
         {
            $group: {
               _id: null,
               totalPaintings: { $sum: 1 },
               averageRating: { $avg: "$averageRating" },
               digitalCount: {
                  $sum: { $cond: [{ $eq: ["$category", "digital"] }, 1, 0] },
               },
               canvasCount: {
                  $sum: { $cond: [{ $eq: ["$category", "canvas"] }, 1, 0] },
               },
            },
         },
      ]);

      res.status(200).json(stats[0] || {});
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

const getHighestRatedPainting = async (req, res) => {
   try {
      // Find the painting with the highest average rating
      // Only consider paintings with at least 1 rating
      const topPainting = await Painting.findOne({ ratingCount: { $gt: 0 } })
         .sort({ averageRating: -1, ratingCount: -1 }) // Sort by rating, then by count as tiebreaker
         .populate("owner", "username email")
         .limit(1);

      if (!topPainting) {
         // If no paintings have ratings, get the most recent painting
         const recentPainting = await Painting.findOne()
            .sort({ createdAt: -1 })
            .populate("owner", "username email");

         return res.status(200).json({
            painting: recentPainting,
            message: "No rated paintings yet, showing most recent",
         });
      }

      res.status(200).json({
         painting: topPainting,
         message: "Highest rated painting",
      });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

module.exports = {
   getAllPaintings,
   getSinglePainting,
   addPainting,
   updatePainting,
   deletePainting,
   getUserPaintings,
   getPaintingStats,
   getHighestRatedPainting,
};

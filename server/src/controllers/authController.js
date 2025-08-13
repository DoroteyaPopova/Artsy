const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const registerUser = async (req, res) => {
   try {
      const { email, username, password, repass } = req.body;
      if (!email) {
         return res.json({ error: "Email is required" });
      }
      if (!username) {
         return res.json({ error: "Username is required" });
      }
      if (!password || password.length < 6) {
         return res.json({
            error: "Password is required and should be at least 6 characters long!",
         });
      }
      if (password !== repass) {
         return res.json({ error: "Passwords do not match" });
      }
      const exist = await User.findOne({ email });
      if (exist) {
         return res.json({ error: "Email is already taken" });
      }

      const user = new User({ email, username, password });
      await user.save();

      const token = jwt.sign(
         { userId: user.id, email, username },
         process.env.JWT_Secret,
         {
            expiresIn: "1w",
         }
      );

      res.status(201).json({
         message: "User registered successfully",
         user: {
            id: user.id,
            email: user.email,
            username: user.username,
         },
         token,
      });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

const loginUser = async (req, res) => {
   try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.json({ error: "User not found." });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.json({ error: "Wrong password!" });

      const token = jwt.sign(
         { userId: user.id, email: user.email, username: user.username },
         process.env.JWT_Secret,
         {
            expiresIn: "1w",
         }
      );

      res.status(200).json({
         message: "Logged in successfully",
         user: {
            id: user.id,
            email: user.email,
            username: user.username,
         },
         token,
      });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

const getProfile = (req, res) => {
   // Get token from Authorization header instead of cookies
   const authHeader = req.headers.authorization;
   const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

   if (token) {
      jwt.verify(token, process.env.JWT_Secret, async (err, decodedToken) => {
         if (err) {
            res.status(401).json({ error: "Unauthorized" });
            return;
         } else {
            const data = await User.findById(decodedToken.userId);
            const user = {
               id: data.id,
               email: data.email,
               username: data.username,
               bio: data.bio || "",
               location: data.location || "",
               avatar: data.avatar || "",
               role: data.role || "user", // ADDED: Include role in response
               isAdmin: data.role === "admin", // LEGACY: For backward compatibility
            };
            res.status(200).json({ user, token });
         }
      });
   } else {
      res.status(401).json({ error: "No token provided" });
   }
};

const updateUser = async (req, res) => {
   try {
      const { id, username, email, bio, location, avatar } = req.body;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
         return res.status(404).json({ error: "User not found" });
      }

      // Check if email is being changed and if it's already taken
      if (email !== existingUser.email) {
         const emailExists = await User.findOne({ email, _id: { $ne: id } });
         if (emailExists) {
            return res.status(400).json({ error: "Email is already taken" });
         }
      }

      // Check if username is being changed and if it's already taken
      if (username !== existingUser.username) {
         const usernameExists = await User.findOne({
            username,
            _id: { $ne: id },
         });
         if (usernameExists) {
            return res.status(400).json({ error: "Username is already taken" });
         }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
         id,
         {
            username,
            email,
            bio: bio || "",
            location: location || "",
            avatar: avatar || "",
         },
         { new: true, runValidators: true }
      ).select("-password"); // Don't return password

      res.status(200).json({
         message: "Profile updated successfully",
         user: {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
            location: updatedUser.location,
            avatar: updatedUser.avatar,
         },
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

// Add method to get user by ID
const getUserById = async (req, res) => {
   try {
      const { userId } = req.params;

      const user = await User.findById(userId).select("-password");
      if (!user) {
         return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
         user: {
            id: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            location: user.location,
            avatar: user.avatar,
         },
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

const getUserStats = async (req, res) => {
   try {
      const { userId } = req.params;

      const Painting = require("../models/paintingModel");
      const Rating = require("../models/ratingModel");
      const Comment = require("../models/commentModel");

      const [paintingCount, totalRatings, totalComments, avgRating] =
         await Promise.all([
            Painting.countDocuments({ owner: userId }),
            Rating.countDocuments({ userId }),
            Comment.countDocuments({ userId }),
            Painting.aggregate([
               { $match: { owner: mongoose.Types.ObjectId(userId) } },
               { $group: { _id: null, avgRating: { $avg: "$averageRating" } } },
            ]),
         ]);

      res.status(200).json({
         paintingCount,
         ratingsGiven: totalRatings,
         commentsPosted: totalComments,
         averageRatingReceived: avgRating[0]?.avgRating || 0,
      });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

const getAllUsers = async (req, res) => {
   try {
      const users = await User.find({});
      res.status(200).json(users);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

module.exports = {
   registerUser,
   loginUser,
   getProfile,
   updateUser,
   getUserById,
   getUserStats,
   getAllUsers,
};

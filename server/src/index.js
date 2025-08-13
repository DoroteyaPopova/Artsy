// server/src/index.js - UPDATED WITH COURSES
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
   cors({
      origin: "http://localhost:4200", // Specific origin for Angular
      credentials: true,
   })
);

// Add this before your other routes
app.get("/", (req, res) => {
   res.status(200).json({
      message: "Paintings Blog API is running",
      endpoints: {
         paintings: "/atp/paintings/catalog",
         users: "/atp/users",
         rating: "/atp/rating",
         comments: "/atp/comments",
         teachers: "/atp/teachers",
         courses: "/atp/courses", // UPDATED: Courses endpoint
      },
   });
});

// API routes
app.use("/atp/users", require("./routes/authRoutes"));
app.use("/atp/paintings", require("./routes/paintingRoutes"));
app.use("/atp/rating", require("./routes/ratingRoutes"));
app.use("/atp/comments", require("./routes/commentRoutes"));
app.use("/atp/teachers", require("./routes/teacherRoutes"));
app.use("/atp/courses", require("./routes/courseRoutes"));

// MongoDB connection
mongoose
   .connect(process.env.MONGO_URL || "mongodb://localhost:27017/atp")
   .then(() => console.log("MongoDB connected"))
   .catch((err) => console.error("MongoDB connection error:", err));

const port = process.env.PORT || 8000;
app.listen(port, () => {
   console.log(
      `Server running on port ${port} in ${process.env.NODE_ENV} mode`
   );
});

module.exports = app;

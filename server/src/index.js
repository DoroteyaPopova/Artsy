const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const {
   setupCourseStatusCron,
   runCourseStatusUpdate,
} = require("./jobs/courseStatusCron");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
   cors({
      origin: "http://localhost:4200",
      credentials: true,
   })
);

app.get("/", (req, res) => {
   res.status(200).json({
      message: "Paintings Blog API is running",
      endpoints: {
         paintings: "/atp/paintings/catalog",
         users: "/atp/users",
         rating: "/atp/rating",
         comments: "/atp/comments",
         teachers: "/atp/teachers",
         courses: "/atp/courses",
         admin: "/atp/admin/course-status-update",
      },
   });
});

app.use("/atp/users", require("./routes/authRoutes"));
app.use("/atp/paintings", require("./routes/paintingRoutes"));
app.use("/atp/rating", require("./routes/ratingRoutes"));
app.use("/atp/comments", require("./routes/commentRoutes"));
app.use("/atp/teachers", require("./routes/teacherRoutes"));
app.use("/atp/courses", require("./routes/courseRoutes"));

app.post("/atp/admin/course-status-update", async (req, res) => {
   try {
      console.log("Manual course status update triggered via API");
      const result = await runCourseStatusUpdate();
      res.status(200).json({
         message: "Course status update completed",
         ...result,
      });
   } catch (error) {
      console.error("Error in manual course status update API:", error);
      res.status(500).json({
         message: "Course status update failed",
         error: error.message,
      });
   }
});

mongoose
   .connect(process.env.MONGO_URL || "mongodb://localhost:27017/atp")
   .then(() => {
      console.log("MongoDB connected");

      setupCourseStatusCron();

      setTimeout(async () => {
         console.log("Running initial course status update...");
         await runCourseStatusUpdate();
      }, 2000);
   })
   .catch((err) => console.error("MongoDB connection error:", err));

const port = process.env.PORT || 8000;
app.listen(port, () => {
   console.log(
      `Server running on port ${port} in ${process.env.NODE_ENV} mode`
   );
});

module.exports = app;

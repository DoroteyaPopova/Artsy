const Course = require("../models/courseModel");

const updateCourseStatuses = async () => {
   try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const coursesToUpdate = await Course.find({
         status: { $in: ["published", "ongoing"] },
         $or: [
            {
               status: "published",
               startDate: { $lte: today },
            },

            {
               status: "ongoing",
               endDate: { $lt: today },
            },
         ],
      });

      let updatedCount = 0;

      for (const course of coursesToUpdate) {
         const startDate = new Date(course.startDate);
         const endDate = new Date(course.endDate);

         const courseStartDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
         );
         const courseEndDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate()
         );

         let newStatus = course.status;
         let updateFields = {};

         if (course.status === "published" && courseStartDate <= today) {
            newStatus = "ongoing";
            updateFields.status = "ongoing";
            updateFields.ongoingAt = now;
         } else if (course.status === "ongoing" && courseEndDate < today) {
            newStatus = "completed";
            updateFields.status = "completed";
            updateFields.completedAt = now;
         }

         if (newStatus !== course.status) {
            await Course.findByIdAndUpdate(course._id, updateFields);
            updatedCount++;
         }
      }
      return { success: true, updatedCount };
   } catch (error) {
      console.error("Error updating course statuses:", error);
      return { success: false, error: error.message };
   }
};

const updateSingleCourseStatus = async (course) => {
   try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const startDate = new Date(course.startDate);
      const endDate = new Date(course.endDate);

      const courseStartDate = new Date(
         startDate.getFullYear(),
         startDate.getMonth(),
         startDate.getDate()
      );
      const courseEndDate = new Date(
         endDate.getFullYear(),
         endDate.getMonth(),
         endDate.getDate()
      );

      let shouldUpdate = false;
      let updateFields = {};

      if (course.status === "published" && courseStartDate <= today) {
         updateFields.status = "ongoing";
         updateFields.ongoingAt = now;
         shouldUpdate = true;
      } else if (course.status === "ongoing" && courseEndDate < today) {
         updateFields.status = "completed";
         updateFields.completedAt = now;
         shouldUpdate = true;
      }

      if (shouldUpdate) {
         const updatedCourse = await Course.findByIdAndUpdate(
            course._id,
            updateFields,
            { new: true }
         );
         return updatedCourse;
      }

      return course;
   } catch (error) {
      console.error("Error updating single course status:", error);
      return course;
   }
};

const autoUpdateCourseStatus = async (req, res, next) => {
   try {
      const originalJson = res.json;

      res.json = async function (data) {
         if (data && data.course) {
            data.course = await updateSingleCourseStatus(data.course);
         } else if (data && data.courses && Array.isArray(data.courses)) {
            data.courses = await Promise.all(
               data.courses.map((course) => updateSingleCourseStatus(course))
            );
         } else if (data && Array.isArray(data)) {
            data = await Promise.all(
               data.map((course) => updateSingleCourseStatus(course))
            );
         }

         return originalJson.call(this, data);
      };

      next();
   } catch (error) {
      console.error("Error in autoUpdateCourseStatus middleware:", error);
      next();
   }
};

module.exports = {
   updateCourseStatuses,
   updateSingleCourseStatus,
   autoUpdateCourseStatus,
};

const cron = require("node-cron");
const { updateCourseStatuses } = require("../services/courseStatusService");

const setupCourseStatusCron = () => {
   cron.schedule("0 0 * * *", async () => {
      try {
         const result = await updateCourseStatuses();
         if (result.success) {
         } else {
            console.error("❌ Course status cron failed:", result.error);
         }
      } catch (error) {
         console.error("❌ Error in course status cron job:", error);
      }
   });
};

const runCourseStatusUpdate = async () => {
   try {
      const result = await updateCourseStatuses();
      if (result.success) {
         return result;
      } else {
         console.error("❌ Manual course status update failed:", result.error);
         return result;
      }
   } catch (error) {
      console.error("❌ Error in manual course status update:", error);
      return { success: false, error: error.message };
   }
};

module.exports = {
   setupCourseStatusCron,
   runCourseStatusUpdate,
};

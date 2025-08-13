const express = require("express");
const cors = require("cors");
const router = express.Router();
const ratingController = require("../controllers/ratingController");

router.post("/", ratingController.createRating);
router.put("/", ratingController.updateRating);
router.delete("/:userId/:paintingId", ratingController.deleteRating);
router.get("/check/:userId/:paintingId", ratingController.checkRating);
router.get(
   "/user/:userId/:paintingId",
   ratingController.getUserRatingForPainting
);
router.get(
   "/count/painting/:paintingId",
   ratingController.getPaintingRatingCount
);
router.get("/painting/:paintingId", ratingController.getPaintingRating);
router.get("/count/user/:userId", ratingController.getUserRatingCount);
router.get("/user/:userId", ratingController.getUserRating);
router.get("/top-paintings", ratingController.getTopThreeRating);

module.exports = router;

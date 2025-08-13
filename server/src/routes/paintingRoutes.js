const express = require("express");
const cors = require("cors");
const router = express.Router();
const {
   getAllPaintings,
   getSinglePainting,
   addPainting,
   updatePainting,
   deletePainting,
   getUserPaintings,
   getHighestRatedPainting,
} = require("../controllers/paintingController");

router.get("/catalog", getAllPaintings);
router.get("/top-rated", getHighestRatedPainting);
router.get("/:id", getSinglePainting);
router.post("/upload", addPainting);
router.put("/:id", updatePainting);
router.delete("/:id", deletePainting);
router.get("/user/:userId", getUserPaintings);

module.exports = router;

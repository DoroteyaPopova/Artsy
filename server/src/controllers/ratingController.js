const Rating = require("../models/ratingModel");
const Painting = require("../models/paintingModel");

exports.createRating = async (req, res) => {
   try {
      const existingRating = await Rating.findOne({
         userId: req.body.userId,
         paintingId: req.body.paintingId,
      });

      if (existingRating) {
         return res.status(409).json({
            message: "You have already rated this painting",
            hasRated: true,
            currentRating: existingRating.rating,
         });
      }

      const rating = new Rating(req.body);

      await rating.save();
      res.status(201).json(rating);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.updateRating = async (req, res) => {
   try {
      const existingRating = await Rating.findOne({
         userId: req.body.userId,
         paintingId: req.body.paintingId,
      });

      if (!existingRating) {
         return res.status(404).json({ message: "Rating not found" });
      }

      existingRating.rating = req.body.rating;
      await existingRating.save();

      res.status(200).json({
         message: "Rating updated successfully",
         rating: existingRating,
      });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.getUserRatingForPainting = async (req, res) => {
   try {
      const rating = await Rating.findOne({
         userId: req.params.userId,
         paintingId: req.params.paintingId,
      });

      if (!rating) {
         return res.status(404).json({ message: "No rating found" });
      }

      res.status(200).json(rating);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.deleteRating = async (req, res) => {
   try {
      const result = await Rating.findOneAndDelete({
         userId: req.params.userId,
         paintingId: req.params.paintingId,
      });

      if (!result) {
         return res.status(404).json({ message: "Rating not found" });
      }

      res.status(200).json({ message: "You have removed your rating" });
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

exports.checkRating = async (req, res) => {
   try {
      const rating = await Rating.findOne({
         userId: req.params.userId,
         paintingId: req.params.paintingId,
      });

      res.status(200).json({ rated: !!rating });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.getPaintingRatingCount = async (req, res) => {
   try {
      const count = await Rating.countDocuments({
         paintingId: req.params.paintingId,
      });
      res.status(200).json({ count });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.getPaintingRating = async (req, res) => {
   try {
      const ratings = await Rating.find({ paintingId: req.params.paintingId });
      res.status(200).json(ratings);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.getUserRatingCount = async (req, res) => {
   try {
      const count = await Rating.countDocuments({ userId: req.params.userId });
      res.status(200).json({ count });
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.getUserRating = async (req, res) => {
   try {
      const ratings = await Rating.find({ userId: req.params.userId });
      res.status(200).json(ratings);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
};

exports.getTopThreeRating = async (req, res) => {
   try {
      const topPaintings = await Rating.aggregate([
         { $group: { _id: "$paintingId", ratingCount: { $sum: 1 } } },
         { $sort: { ratingCount: -1 } },
         { $limit: 3 },
      ]);

      const result = await Promise.all(
         topPaintings.map(async (item) => {
            const painting = await Painting.findById(item._id);
            return {
               painting,
               ratingCount: item.ratingCount,
            };
         })
      );

      res.status(200).json(result);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
};

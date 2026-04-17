const Feedback = require("../models/FeedbackModel");
const Notification = require("../models/NotificationModel");

// ✅ CREATE REVIEW / FEEDBACK
const createReview = async (req, res) => {
  try {
    const { user_id, parkingLot_id, rating, comments } = req.body;

    const feedback = new Feedback({
      user_id,
      parkingLot_id,
      rating,
      comments
    });

    await feedback.save();

    // Optional: Notify admin (you can improve later)
    await Notification.create({
      userId: user_id,
      message: "Your feedback has been submitted successfully",
      type: "alert"
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ GET ALL REVIEWS
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Feedback.find()
      .populate("user_id", "Name email")
      .populate("parkingLot_id", "name location");

    res.status(200).json(reviews);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ GET REVIEW BY ID
const getReviewById = async (req, res) => {
  try {
    const review = await Feedback.findById(req.params.id)
      .populate("user_id", "Name email")
      .populate("parkingLot_id", "name");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(review);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ UPDATE REVIEW
const updateReview = async (req, res) => {
  try {
    const { rating, comments } = req.body;

    const review = await Feedback.findByIdAndUpdate(
      req.params.id,
      { rating, comments },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({
      message: "Review updated successfully",
      review
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ DELETE REVIEW
const deleteReview = async (req, res) => {
  try {
    const review = await Feedback.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({
      message: "Review deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview
};
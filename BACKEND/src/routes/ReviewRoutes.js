const express = require("express");
const router = express.Router();

const {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview
} = require("../controllers/ReviewController");

// ✅ CREATE REVIEW
const validateToken = require("../middleware/auth");

router.post("/create", validateToken, createReview)
router.get("/get", validateToken, getAllReviews)
router.get("/get/:id", validateToken, getReviewById)
router.put("/update/:id", validateToken, updateReview)
router.delete("/delete/:id", validateToken, deleteReview)
module.exports = router;
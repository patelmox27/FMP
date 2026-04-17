const express = require("express");
const router = express.Router();

const {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  createOrder,
  verifyPayment,
  getPaymentsByUser
} = require("../controllers/PaymentController");

const validateToken = require("../middleware/auth");

router.post("/", validateToken, createPayment);
router.get("/", validateToken, getAllPayments);
router.get("/user/:userId", validateToken, getPaymentsByUser);
router.get("/:id", validateToken, getPaymentById);
router.put("/:id", validateToken, updatePaymentStatus);
router.delete("/:id", validateToken, deletePayment);

// Razorpay routes
router.post("/create-order", validateToken, createOrder);
router.post("/verify-payment", validateToken, verifyPayment);



module.exports = router;
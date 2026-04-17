const Payment = require("../models/PaymentModel");
const Reservation = require("../models/ReservationModel");
const Notification = require("../models/NotificationModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ✅ CREATE PAYMENT
const createPayment = async (req, res) => {
  try {
    const { reservationId, amount, paymentMethod } = req.body;

    // Check reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Create payment
    const payment = new Payment({
      reservationId,
      userId: reservation.userId,
      amount,
      paymentMethod,
      paymentStatus: "completed", // you can keep "pending" if integrating gateway
    });



    await payment.save();


    // Create notification
    await Notification.create({
      userId: reservation.userId,
      message: "Payment successful for your parking reservation",
      type: "payment"
    });

    res.status(201).json({
      message: "Payment successful",
      payment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ GET ALL PAYMENTS
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("reservationId");

    res.status(200).json(payments);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ GET PAYMENT BY ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("reservationId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(payment);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ UPDATE PAYMENT STATUS
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({
      message: "Payment status updated",
      payment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ DELETE PAYMENT
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({
      message: "Payment deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ CREATE RAZORPAY ORDER
const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount. Amount must be a positive number." });
    }

    // amount in smallest currency unit
    const options = {
      amount: amount * 100, 
      currency,
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) return res.status(500).json({ message: "Some error occured" });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ VERIFY PAYMENT
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      reservationId,
      amount
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is verified
      
      if (!reservationId) {
        return res.status(400).json({ message: "Missing reservationId for payment verification." });
      }

      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      const payment = new Payment({
        reservationId,
        userId: reservation.userId,
        amount,
        paymentMethod: "razorpay",
        paymentStatus: "completed"
      });

      await payment.save();


      if (reservation) {
        await Notification.create({
          userId: reservation.userId,
          message:
            "Payment successful via Razorpay for your parking reservation",
          type: "payment",
        });
      }


      return res.status(200).json({ message: "Payment verified successfully", payment });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ GET PAYMENTS BY USER
const getPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ userId })
      .populate("reservationId")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  createOrder,
  verifyPayment,
  getPaymentsByUser
};
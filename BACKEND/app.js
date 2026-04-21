const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ Initialize WebSockets
const ALLOWED_ORIGINS = [
  "http://localhost:2701", // FRONTEND (current)
  "http://localhost:2702", // FRONTEND
  "http://localhost:5173", // FRONTEND (default Vite)
  "http://localhost:5174", // ADMIN
  "http://localhost:5176", // ADMIN
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,

  },
});

// ✅ Attach io to req for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("Client connected via Socket.io:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ✅ Middleware
app.use(express.json());

// ✅ FIXED CORS (IMPORTANT)
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),

);

// ✅ Handle preflight requests

// Database Connection
const DBConnection = require("./src/utils/DBconnection");
const initCronJobs = require("./src/services/CronService");
DBConnection().then(() => {
  initCronJobs(io);
});


// Routes
const userRoutes = require("./src/routes/UserRoutes");
const parkingRoutes = require("./src/routes/ParkingRoutes");
const VehiclesRoutes = require("./src/routes/VehicleRoutes");
const BookingRoutes = require("./src/routes/BookingRoutes");
const PaymentRoutes = require("./src/routes/PaymentRoutes");
const ReviewRoutes = require("./src/routes/ReviewRoutes");
const AdminRoutes = require("./src/routes/AdminRoutes");

app.use("/user", userRoutes);
app.use("/parking", parkingRoutes);
app.use("/vehicle", VehiclesRoutes);
app.use("/booking", BookingRoutes);
app.use("/payment", PaymentRoutes);
app.use("/review", ReviewRoutes);

app.use("/admin", AdminRoutes);

// Test Route
app.get("/test", (req, res) => {
  res.send("Server working");
});

// Health Check Route
app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start Server
const PORT = process.env.PORT || 3001; // ✅ your backend port

server.listen(PORT, () => {
  console.log(`🚀 Server and WebSockets running on port ${PORT}`);
});

# 🅿️ Find My Parking

> **Smart Parking System** — Find, book, and manage parking slots in real-time.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-black)](https://socket.io/)

---

## 📖 Overview

**Find My Parking** is a full-stack smart parking platform that allows users to browse, reserve, and pay for parking slots online. It features real-time slot availability updates, automated reservation expiry, Razorpay payment integration, and a dedicated admin panel with analytics.

---

## ✨ Features

### 👤 User Features
- Register / Login with JWT authentication
- Browse parking lots on an interactive map
- View real-time slot availability (available, reserved, occupied)
- Book parking slots with custom date & time range
- Support for EV, Handicap, and Regular slot types
- Hourly, Daily, and Monthly reservation types
- Pay via **Razorpay** payment gateway
- View booking ticket with full reservation details
- Extend an active booking
- Cancel a booking
- Real-time push notifications (e.g., expiry warnings)
- Personal dashboard with booking history

### 🔧 Admin Features
- Separate admin panel (role-protected)
- Dashboard with live KPIs (revenue, occupancy, active bookings)
- Manage parking lots (Create, Edit, Delete with map location picker)
- Manage parking slots (Add individually or in bulk, set type/category)
- Analytics — Peak hour charts, revenue breakdown
- Revenue reports (7-day, 30-day filters)
- User management
- Booking management
- Real-time alert system (full occupancy, unauthorized parking detection)

### ⚙️ System Features
- **Socket.io** for live slot status updates across all connected clients
- **node-cron** background jobs:
  - Auto-expire reservations when `endTime` is reached
  - Send 15-minute expiry warning notifications
  - Detect unauthorized parking (occupied slot with no active reservation)
- Razorpay order creation + HMAC signature verification

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), Socket.io, node-cron |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Admin Panel** | React 18, Vite, Tailwind CSS |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **Payments** | Razorpay |
| **Real-time** | Socket.io (WebSockets) |
| **Map** | Leaflet.js |

---

## 📁 Project Structure

```
FMP_27/
├── BACKEND/          # Express API server
│   └── src/
│       ├── controllers/   # Business logic (User, Parking, Booking, Payment, Admin...)
│       ├── models/        # Mongoose schemas
│       ├── routes/        # API routes
│       ├── middleware/    # JWT auth, file upload
│       ├── services/      # CronService (background jobs)
│       ├── seeders/       # Database seed scripts
│       └── utils/         # DB connection
├── FRONTEND/         # User-facing React app (Vite)
└── ADMIN/            # Admin dashboard React app (Vite)
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com/))
- Razorpay account (for payment keys)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/find-my-parking.git
cd find-my-parking
```

---

### 2. Backend Setup

```bash
cd BACKEND
npm install
```

Create a `.env` file in the `BACKEND/` directory (see `.env.example`):

```bash
cp .env.example .env
# Then fill in your values
```

Start the backend server:

```bash
npm start
# or for development with hot-reload:
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup (User App)

```bash
cd FRONTEND
npm install
npm run dev
```

User frontend runs on: `http://localhost:5173`

---

### 4. Admin Panel Setup

```bash
cd ADMIN
npm install
npm run dev
```

Admin panel runs on: `http://localhost:5174`

> **Note:** To access the admin panel, a user with `role: "admin"` must exist in the database. Use the seeder or manually update a user's role in MongoDB.

---

### 5. Seed Sample Data (Optional)

```bash
cd BACKEND
npm run seed
```

This populates the database with sample parking lots, slots, and a test admin user.

---

## 🌐 API Overview

Base URL: `http://localhost:5000/api`

| Module | Prefix | Description |
|---|---|---|
| Auth (Users) | `/api/users` | Register, Login, Profile |
| Parking | `/api/parking` | List/Get parking lots |
| Bookings | `/api/bookings` | Create, Cancel, Complete, Update reservations |
| Payments | `/api/payments` | Razorpay order & verification |
| Vehicles | `/api/vehicles` | User vehicle management |
| Reviews | `/api/reviews` | Submit & fetch reviews |
| Admin | `/api/admin` | Admin-only endpoints (protected) |

---

## 🔐 Environment Variables

See [`BACKEND/.env.example`](./BACKEND/.env.example) for the full list of required variables.

---

## 📸 Screenshots

> *Add screenshots of Home, ParkingDetails, Dashboard, and Admin Panel here before final submission.*

---

## 📄 License

This project is for educational and internship demonstration purposes.

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db.js");
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");
require("colors"); // For console colors, ensure it's installed or handle if not

// Import routes
const authRoutes = require("./routes/authRoutes.js");
const productRoutes = require("./routes/productRoutes.js");
const cartRoutes = require("./routes/cartRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
// const userRoutes = require("./routes/userRoutes.js"); // Placeholder if admin user management is separate

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors()); // Allow all origins for now, configure specific origins for production

// Mount routers
app.get("/api", (req, res) => {
    res.send("API is running...");
});
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
// app.use("/api/users", userRoutes); // For admin user management

// Custom error handling middleware (should be last)
app.use(notFound); // For 404 errors
app.use(errorHandler); // For all other errors

const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`.yellow.bold
    )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`.red);
    // Close server & exit process
    // server.close(() => process.exit(1)); // Consider if this is too aggressive for all unhandled rejections
});

module.exports = app; // For potential testing


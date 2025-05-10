const express = require("express");
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductReviews
} = require("../controllers/productController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// Public routes
router.route("/").get(getProducts);
router.route("/:id").get(getProductById);
router.route("/:id/reviews").get(getProductReviews);

// Private routes
router.route("/:id/reviews").post(protect, createProductReview);

// Admin routes
router.route("/").post(protect, admin, createProduct);
router.route("/:id").put(protect, admin, updateProduct);
router.route("/:id").delete(protect, admin, deleteProduct);

module.exports = router;


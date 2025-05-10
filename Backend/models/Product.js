const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    name: { // User's name, denormalized for easier display
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a product name"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please provide a product description"]
    },
    price: {
        type: Number,
        required: [true, "Please provide a product price"],
        min: 0
    },
    images: [
        {
            type: String,
            required: true // URL to product image
        }
    ],
    category: {
        type: String,
        required: [true, "Please specify a product category"]
    },
    brand: {
        type: String,
        default: "Unbranded"
    },
    stockQuantity: {
        type: Number,
        required: [true, "Please provide stock quantity"],
        min: 0,
        default: 0
    },
    reviews: [reviewSchema],
    numReviews: {
        type: Number,
        required: true,
        default: 0
    },
    averageRating: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 5
    },
    user: { // User who created the product (admin)
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update `updatedAt` field before saving
productSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;


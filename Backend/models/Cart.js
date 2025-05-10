const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: String, // Denormalized from Product for easier display in cart
    image: String, // Denormalized from Product
    price: Number, // Price at the time of adding to cart, denormalized
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, {_id: false}); // Prevent _id for subdocuments if not needed, or manage manually if product is key

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // Each user has one cart
    },
    items: [cartItemSchema],
    totalPrice: { // Calculated dynamically or updated on modification
        type: Number,
        required: true,
        default: 0
    },
    totalItems: { // Calculated dynamically or updated on modification
        type: Number,
        required: true,
        default: 0
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
cartSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    // Recalculate totals before saving
    this.totalPrice = this.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);
    next();
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;


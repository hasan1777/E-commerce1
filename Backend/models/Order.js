const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true // Denormalized from Product for order history
    },
    image: {
        type: String,
        required: true // Denormalized from Product for order history
    },
    price: {
        type: Number,
        required: true // Price at the time of order
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, {_id: false});

const shippingAddressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
}, {_id: false});

const paymentResultSchema = new mongoose.Schema({
    id: { type: String }, // Transaction ID from payment provider
    status: { type: String }, // e.g., succeeded, pending, failed
    update_time: { type: String },
    email_address: { type: String } // Payer email from payment provider
}, {_id: false});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    paymentMethod: {
        type: String,
        required: [true, "Payment method is required"],
        default: "Stripe" // Example, can be extended
    },
    paymentResult: paymentResultSchema,
    itemsPrice: { // Subtotal for items
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalAmount: { // Grand total
        type: Number,
        required: true,
        default: 0.0
    },
    orderStatus: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Pending"
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
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
orderSchema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;


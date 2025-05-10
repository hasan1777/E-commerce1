const Order = require("../models/Order.js");
const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js"); // To update stock

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res, next) => {
    const { shippingAddressId, paymentMethod } = req.body; // Assuming shippingAddressId is passed or a new address object
    const userId = req.user._id;

    try {
        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            res.status(400);
            throw new Error("No items in cart to order");
        }

        let userShippingAddress;
        if (shippingAddressId) {
            const user = await User.findById(userId);
            userShippingAddress = user.addresses.id(shippingAddressId);
            if (!userShippingAddress) {
                res.status(404);
                throw new Error("Shipping address not found");
            }
        } else if (req.body.shippingAddress) { // Allow passing a new address object directly
             userShippingAddress = req.body.shippingAddress;
             // Optionally, save this new address to user's addresses if needed
        } else {
            res.status(400);
            throw new Error("Shipping address is required");
        }

        const orderItems = cart.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            image: item.product.images[0] || "/images/sample.jpg",
            price: item.product.price,
            product: item.product._id,
        }));

        const itemsPrice = cart.totalPrice;
        // These can be dynamic based on location or cart value
        const shippingPrice = itemsPrice > 100 ? 0 : 10; // Example: free shipping over $100
        const taxPrice = Number((0.15 * itemsPrice).toFixed(2)); // Example: 15% tax
        const totalAmount = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

        const order = new Order({
            user: userId,
            orderItems,
            shippingAddress: userShippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalAmount,
            // paymentResult, isPaid, paidAt will be updated after payment processing
        });

        const createdOrder = await order.save();

        // After order creation, clear the user's cart
        // And potentially update product stock (can be complex, e.g., if payment fails)
        // For now, let's assume payment is processed separately or stock is reduced here
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            if (product) {
                product.stockQuantity -= item.quantity;
                await product.save();
            }
        }
        cart.items = [];
        cart.totalPrice = 0;
        cart.totalItems = 0;
        await cart.save();

        res.status(201).json(createdOrder);

    } catch (error) {
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email");

        if (order) {
            // Check if the user is an admin or the owner of the order
            if (req.user.role === "admin" || order.user._id.toString() === req.user._id.toString()) {
                res.json(order);
            } else {
                res.status(403); // Forbidden
                throw new Error("Not authorized to view this order");
            }
        } else {
            res.status(404);
            throw new Error("Order not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private (can be restricted further, e.g. payment gateway callback)
const updateOrderToPaid = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: req.body.id, // from payment provider (e.g., PayPal transaction ID)
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.email_address,
            };

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404);
            throw new Error("Order not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            order.orderStatus = "Delivered";

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404);
            throw new Error("Order not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res, next) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    let query = {};

    if (req.query.status) query.orderStatus = req.query.status;
    if (req.query.userId) query.user = req.query.userId;

    try {
        const count = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate("user", "id name email")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));
        
        res.json({ orders, page, pages: Math.ceil(count / pageSize), count });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status (by Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)){
        res.status(400);
        throw new Error("Invalid order status");
    }

    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.orderStatus = status;
            if (status === "Delivered" && !order.isDelivered) {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }
            if (status === "Cancelled") {
                // Potentially add logic to restock items if order is cancelled
            }
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404);
            throw new Error("Order not found");
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
    updateOrderStatus
};


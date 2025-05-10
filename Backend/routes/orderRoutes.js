const express = require("express");
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
    updateOrderStatus
} = require("../controllers/orderController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// All order routes are protected
router.use(protect);

router.route("/")
    .post(addOrderItems)
    .get(admin, getOrders); // Admin gets all orders

router.route("/myorders").get(getMyOrders);

router.route("/:id")
    .get(getOrderById);

router.route("/:id/pay")
    .put(updateOrderToPaid); // Could be restricted further, e.g. only payment gateway callback

router.route("/:id/deliver")
    .put(admin, updateOrderToDelivered);

router.route("/:id/status")
    .put(admin, updateOrderStatus);

module.exports = router;


const express = require("express");
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../controllers/cartController.js");
const { protect } = require("../middleware/authMiddleware.js");

// All cart routes are protected as they belong to a specific user
router.use(protect);

router.route("/")
    .get(getCart)
    .delete(clearCart);

router.route("/items")
    .post(addItemToCart);

router.route("/items/:productId") // :productId refers to the product ID within the cart items
    .put(updateCartItem)
    .delete(removeCartItem);

module.exports = router;


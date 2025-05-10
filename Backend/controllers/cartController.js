const Cart = require("../models/Cart.js");
const Product = require("../models/Product.js");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name price image stockQuantity");

        if (!cart) {
            // If no cart exists for the user, create one
            cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0, totalItems: 0 });
        }
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart/items
// @access  Private
const addItemToCart = async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }

        if (product.stockQuantity < quantity) {
            res.status(400);
            throw new Error("Not enough stock available");
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            // Product exists in cart, update quantity
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Product does not exist in cart, add new item
            cart.items.push({
                product: productId,
                name: product.name,
                image: product.images[0] || "/images/sample.jpg", // Use first image or a default
                price: product.price,
                quantity: quantity
            });
        }

        // Recalculate totals (also handled by pre-save hook, but good for immediate response)
        cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        cart.totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

        const updatedCart = await cart.save();
        // Populate product details for the response
        await updatedCart.populate("items.product", "name price image stockQuantity"); 
        res.status(200).json(updatedCart);

    } catch (error) {
        next(error);
    }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateCartItem = async (req, res, next) => {
    const { quantity } = req.body;
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        if (quantity <= 0) {
            // If quantity is 0 or less, effectively remove the item
            return removeCartItem(req, res, next); 
        }

        const product = await Product.findById(productId);
        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }

        if (product.stockQuantity < quantity) {
            res.status(400);
            throw new Error("Not enough stock available");
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].price = product.price; // Ensure price is up-to-date
        } else {
            res.status(404);
            throw new Error("Item not found in cart");
        }
        
        const updatedCart = await cart.save();
        await updatedCart.populate("items.product", "name price image stockQuantity");
        res.status(200).json(updatedCart);

    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeCartItem = async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
        } else {
            res.status(404);
            throw new Error("Item not found in cart");
        }

        const updatedCart = await cart.save();
        await updatedCart.populate("items.product", "name price image stockQuantity");
        res.status(200).json(updatedCart);

    } catch (error) {
        next(error);
    }
};

// @desc    Clear all items from cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
    const userId = req.user._id;
    try {
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            // If no cart, effectively it's already clear
            return res.status(200).json({ message: "Cart is already empty", items: [], totalPrice: 0, totalItems: 0 });
        }

        cart.items = [];
        const updatedCart = await cart.save();
        res.status(200).json(updatedCart);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};


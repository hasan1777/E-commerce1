const Product = require("../models/Product.js");
const User = require("../models/User.js"); // Needed for associating product with user (admin)

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
    const pageSize = 10; // Number of products per page
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword ? {
        name: {
            $regex: req.query.keyword,
            $options: "i", // Case-insensitive
        },
    } : {};

    // Additional filters from query params as per design doc
    const filters = { ...keyword };
    if (req.query.category) filters.category = req.query.category;
    if (req.query.brand) filters.brand = req.query.brand;
    if (req.query.minPrice) filters.price = { ...filters.price, $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) filters.price = { ...filters.price, $lte: Number(req.query.maxPrice) };

    // Sorting
    let sortOptions = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split("_"); // e.g., price_asc, createdAt_desc
        if (parts.length === 2) {
            sortOptions[parts[0]] = parts[1] === "desc" ? -1 : 1;
        }
    } else {
        sortOptions = { createdAt: -1 }; // Default sort by newest
    }

    try {
        const count = await Product.countDocuments({ ...filters });
        const products = await Product.find({ ...filters })
            .populate("user", "name email") // Populate user who created it
            .sort(sortOptions)
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            count
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate("reviews.user", "name");

        if (product) {
            res.json(product);
        } else {
            res.status(404);
            throw new Error("Product not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
    const { name, price, description, images, brand, category, stockQuantity } = req.body;

    try {
        const product = new Product({
            name,
            price,
            user: req.user._id, // Admin user creating the product
            images: images && images.length > 0 ? images : ["/images/sample.jpg"], // Default image if none provided
            brand: brand || "Sample brand",
            category: category || "Sample category",
            stockQuantity: stockQuantity || 0,
            numReviews: 0,
            description: description || "Sample description",
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    const { name, price, description, images, brand, category, stockQuantity } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.price = price === undefined ? product.price : price; // Allow setting price to 0
            product.description = description || product.description;
            product.images = images || product.images;
            product.brand = brand || product.brand;
            product.category = category || product.category;
            product.stockQuantity = stockQuantity === undefined ? product.stockQuantity : stockQuantity;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404);
            throw new Error("Product not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne(); // or product.remove() in older mongoose
            res.json({ message: "Product removed" });
        } else {
            res.status(404);
            throw new Error("Product not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res, next) => {
    const { rating, comment } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                res.status(400);
                throw new Error("Product already reviewed by this user");
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);
            product.numReviews = product.reviews.length;
            product.averageRating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: "Review added" });
        } else {
            res.status(404);
            throw new Error("Product not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate("reviews.user", "name");
        if (product) {
            res.json(product.reviews);
        } else {
            res.status(404);
            throw new Error("Product not found");
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductReviews
};


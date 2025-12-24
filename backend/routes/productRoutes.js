// /backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// 1. Configure Multer for File Storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Save files to the 'uploads' folder
    },
    filename(req, file, cb) {
        // Create a unique filename: fieldname-timestamp.extension
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// 2. Initialize Upload Middleware
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// Helper to check file type (Images only)
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

// --- ROUTES ---

// @desc    Fetch all products (with optional category filter)
// @route   GET /api/products
router.get('/', async (req, res) => {
    try {
        // 1. Capture the 'category' slug from the query string (e.g., ?category=backpacks)
        const categorySlug = req.query.category; 
        
        // 2. Build the MongoDB query object
        let query = {};
        // Only apply a filter if a slug is present and it's not the default 'all'
        if (categorySlug && categorySlug !== 'all') { 
            query.category = categorySlug; // Mongoose will filter by the slug field
        }
        
        // 3. Fetch products based on the query filter
        const products = await Product.find(query);

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching products' });
    }
});

// @desc    Create a product (With Image Upload)
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image_file'), async (req, res) => {
    // 'image_file' must match the name attribute in your HTML form input

    try {
        // 1. Get the image path from Multer (if a file was uploaded)
        let imagePath = '';
        if (req.file) {
            // Convert backslashes (Windows) to forward slashes for URLs
            imagePath = req.file.path.replace(/\\/g, "/"); 
            // Ensure path starts with a slash for the browser
            if (!imagePath.startsWith('/')) {
                imagePath = '/' + imagePath;
            }
        } else {
            // Fallback placeholder if upload fails/is missing
            imagePath = 'https://via.placeholder.com/300x200?text=No+Image';
        }

        // 2. Create Product with data from req.body and the new image path
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            countInStock: 10, // Default stock
            imageUrl: imagePath, // SAVING THE ACTUAL UPLOAD PATH
            user: req.user._id,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);

    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Invalid product data or image upload failed' });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await Product.deleteOne({ _id: product._id });
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
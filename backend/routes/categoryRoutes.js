const express = require('express');
const router = express.Router();
const Category = require('../models/Category'); // The model you created above
const { protect, admin } = require('../middleware/authMiddleware'); // Re-use existing auth

// Helper to convert 'Curtain' to 'curtain'
const createSlug = (name) => name.toLowerCase().replace(/\s/g, '_'); 

// @desc    Create a new category
// @route   POST /api/categories
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name } = req.body;
        const slug = createSlug(name);

        const category = new Category({ name, slug });
        const createdCategory = await category.save();
        
        res.status(201).json(createdCategory);
    } catch (error) {
        // This will catch unique constraint errors and general server errors
        console.error(error);
        res.status(400).json({ message: 'Failed to create new category. Name might already exist.' });
    }
});

// @desc    Get all categories
// @route   GET /api/categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching categories' });
    }
});

module.exports = router;
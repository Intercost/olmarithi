// /backend/models/Category.js

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    // Store the display name, e.g., "Curtain"
    name: {
        type: String,
        required: true,
        unique: true, // Categories should be unique
        trim: true,
    },
    // Store a URL-friendly slug, e.g., "curtain" (for 'shop.html?category=curtain')
    slug: { 
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
}, {
    timestamps: true,
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
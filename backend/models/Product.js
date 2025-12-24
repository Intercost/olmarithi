// /backend/models/Product.js

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // Corresponds to the input fields in admin.html
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        
    },
    price: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    // This will store the image URL (e.g., from Cloudinary or a local path)
    imageUrl: {
        type: String,
        required: true,
    },
    countInStock: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
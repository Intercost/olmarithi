// /backend/models/Order.js

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // --- 1. Client Details (from checkout.html form) ---
    customerName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        // Essential for M-Pesa payment and delivery
        type: String, 
        required: true,
    },
    deliveryLocation: {
        type: String,
        required: true,
    },
    
    // --- 2. Products Purchased ---
    items: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product', // Links to the Product model
            },
        },
    ],

    // --- 3. Financial & Status Details ---
    totalAmount: {
        type: Number,
        required: true,
        default: 0.0,
    },
    deliveryFee: {
        type: Number,
        required: true,
        default: 0.0,
    },
    paymentMethod: {
        type: String,
        default: 'M-Pesa',
    },
    paymentStatus: {
        // Key field: This will be updated by the M-Pesa callback
        type: String, 
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending',
    },
    transactionId: {
        // M-Pesa transaction ID (e.g., NFQ1ABC2D3)
        type: String, 
    },

}, {
    timestamps: true, // Includes createdAt/updatedAt for tracking
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
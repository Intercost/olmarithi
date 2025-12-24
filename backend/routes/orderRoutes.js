// /backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');
const { sendAdminNotificationEmail, sendClientThankYouEmail } = require('../utils/emailService');

// --- CLIENT ROUTE ---

// @desc    Create new order (This route is called after M-Pesa confirms payment)
// @route   POST /api/orders
// @access  Public
// NOTE: The M-Pesa callback will typically update the order status from 'Pending' to 'Paid'.
// For simplicity here, we assume the frontend only calls this AFTER payment.
router.post('/', async (req, res) => {
    const { 
        customerName, 
        email, 
        phone, 
        deliveryLocation, 
        items, 
        totalAmount, 
        deliveryFee,
        transactionId // Passed from M-Pesa successful response
    } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in cart' });
    }

    try {
        const order = new Order({
            customerName,
            email,
            phone,
            deliveryLocation,
            items,
            totalAmount,
            deliveryFee,
            transactionId,
            paymentStatus: 'Paid', // Assuming this is post-payment confirmation
        });

        const createdOrder = await order.save();
        
        // --- CRITICAL STEP: Trigger Email Notifications ---
        if (createdOrder.paymentStatus === 'Paid') {
            await sendAdminNotificationEmail(createdOrder);
            await sendClientThankYouEmail(createdOrder);
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error creating order:', error.message);
        res.status(500).json({ message: 'Server Error: Could not create order' });
    }
});


// --- ADMIN ROUTES ---

// @desc    Get all orders (for Admin management)
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        // Populate the items' 'product' field to easily see product details
        const orders = await Order.find({}).sort({ createdAt: -1 }); 
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: Could not fetch orders' });
    }
});

// @desc    Get order details by ID (for admin to check a specific order)
// @route   GET /api/orders/:id
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: Could not fetch order' });
    }
});


module.exports = router;

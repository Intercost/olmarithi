// /backend/routes/feedbackRoutes.js

const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect, admin } = require('../middleware/authMiddleware'); // Re-use existing auth

// @desc    Submit new feedback (Public route)
// @route   POST /api/feedback
router.post('/', async (req, res) => {
    try {
        const { customerName, email, message } = req.body;
        
        const feedback = new Feedback({
            customerName: customerName || 'Anonymous User',
            email: email || '',
            message: message,
        });

        const createdFeedback = await feedback.save();
        res.status(201).json({ 
            message: 'Feedback submitted successfully!', 
            feedback: createdFeedback 
        });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(400).json({ message: 'Failed to submit feedback.' });
    }
});

// @desc    Get all feedback (Admin protected)
// @route   GET /api/feedback
router.get('/', protect, admin, async (req, res) => {
    try {
        // Sort by creation date, newest first
        const feedback = await Feedback.find({}).sort({ createdAt: -1 }); 
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching feedback' });
    }
});

// @desc    Delete a feedback item (Admin protected)
// @route   DELETE /api/feedback/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (feedback) {
            await Feedback.deleteOne({ _id: feedback._id });
            res.json({ message: 'Feedback removed' });
        } else {
            res.status(404).json({ message: 'Feedback not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting feedback' });
    }
});

module.exports = router;
// /backend/models/Feedback.js

const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: false,
        trim: true,
        default: 'Anonymous User'
    },
    email: {
        type: String,
        required: false, // Optional, but useful for contact
        trim: true,
        lowercase: true
    },
    message: {
        type: String,
        required: true,
    },
    isReviewed: {
        type: Boolean,
        default: false, // Helps admin track unread/unreviewed feedback
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

module.exports = Feedback;
// /backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate the JSON Web Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Find the user by email
    const user = await User.findOne({ email });

    // 2. Check if the user exists AND if the password matches
    if (user && (await user.matchPassword(password))) {
        // 3. Success: Send back user info and the JWT token
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id), // Generate the token
        });
    } else {
        // 4. Failure
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

module.exports = router;

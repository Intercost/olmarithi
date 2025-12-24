// /backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Library for secure password hashing

const UserSchema = new mongoose.Schema({
    // We only need one admin, but it's good practice to structure it this way
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    // We can use a flag to confirm this user is an Admin
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// --- CRITICAL SECURITY STEP: Hash the password before saving to the database ---

UserSchema.pre('save', async function () {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) {
        return;
    }
    
    // Generate a salt (random value) for hashing
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password using the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    
});

// --- Method to compare login password with the hashed database password ---

UserSchema.methods.matchPassword = async function (enteredPassword) {
    // Compare the entered password with the hashed password in the database
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
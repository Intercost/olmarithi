// /backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Import configuration and utilities
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

// Initialize the Express application
const app = express();

// Middleware Setup
// 1. CORS: Allows your frontend (running on one URL/Port) to talk to your backend (running on another)
//    NOTE: For development, we allow all origins. For production, restrict this.
app.use(cors());

// 2. Body Parser: Allows Express to read JSON data sent in the request body
app.use(express.json());

// 3. Serve Frontend Static Files
// This is important: tells Express to look for your index.html, script.js, etc., in the /public folder
app.use(express.static('public'));

// 4. Serve Uploaded Product Image
// This makes the 'uploads' folder publicly accessible via the /uploads URL prefix
app.use('/uploads', express.static('uploads'));

// ------------------------------------
// 5. Define Routes (API Endpoints)
// ------------------------------------

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const mpesaRoutes = require('./routes/mpesaRoutes');
const eventsRoutes = require('./routes/events.routes');
const categoryRoutes = require('./routes/categoryRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// Use Routes
app.use('/api/auth', authRoutes);         // For admin login
app.use('/api/products', productRoutes);  // For product management and fetching
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);      // For order creation and fetching
app.use('/api/mpesa', mpesaRoutes);  
app.use('/api/events', eventsRoutes);
app.use('/api/feedback', feedbackRoutes);
     // For M-Pesa integration

// Basic Route for testing
app.get('/api/status', (req, res) => {
    res.json({ message: 'Olmarithi Backend is running!' });
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Access the status check at http://localhost:${PORT}/api/status`);


});
// /backend/createAdmin.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Assuming your admin user model is named User

// Load environment variables
dotenv.config({ path: './.env' }); // Adjust path if .env is not in the project root

// --- ADMIN CREATION DATA ---
const ADMIN_EMAIL = 'olmarithi@gmail.com'; // Use the same email from your .env file for consistency
const ADMIN_PASSWORD = 'olmarithi112025'; // **CHANGE THIS to your desired password!**
// ----------------------------

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createAdminUser = async () => {
    // 1. Connect to the database
    await connectDB();

    try {
        // 2. Check and delete existing admin to ensure a fresh start
        await User.deleteOne({ email: ADMIN_EMAIL });
        console.log(`\n🗑️ Existing admin user (${ADMIN_EMAIL}) deleted for recreation.`);


        // 3. Create the new admin user
        // The User.create() call will automatically trigger the hashing logic in User.js
        await User.create({
            name: 'Admin Olmarithi',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD, // Pass the plain-text password
            isAdmin: true, // IMPORTANT: Mark as admin
        });

        console.log('\n🌟 Admin user created successfully!');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD} (REMEMBER THIS!)`);

    } catch (error) {
        console.error('\n❌ Error creating admin user:', error);
    } finally {
        // 4. Disconnect from the database
        mongoose.disconnect();
    }
};
createAdminUser();
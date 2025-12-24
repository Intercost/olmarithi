// /backend/utils/emailService.js

const nodemailer = require('nodemailer');

// 1. Configure the transporter (how emails are sent)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail as the service
    auth: {
        user: process.env.EMAIL_USER, // olmarithi@gmail.com
        pass: process.env.EMAIL_PASS, // App Password
    },
});


// 2. Function to send the "Thank You" email to the Client
const sendClientThankYouEmail = async (order) => {
    const mailOptions = {
        from: `Olmarithi <${process.env.EMAIL_USER}>`,
        to: order.email, // Client's email
        subject: `Order #${order._id.toString().substring(18)} Confirmation - Olmarithi`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4ade80;">Thank You for Your Order!</h2>
                <p>Dear ${order.customerName},</p>
                <p>We have successfully received your order and payment for KSH ${order.totalAmount.toFixed(2)}.</p>
                <p>Your order details and delivery location (${order.deliveryLocation}) have been passed to our team.</p>
                <p style="font-weight: bold; color: #ef4444;">We will get back to you within 24 hours to confirm the exact delivery time.</p>
                <p>Thank you for choosing Olmarithi.</p>
                <p>Best Regards,</p>
                <p>The Olmarithi Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Client email successfully sent to ${order.email}`);
    } catch (error) {
        console.error(`Error sending client email: ${error.message}`);
    }
};

// 3. Function to send the "New Order" notification to the Admin (olmarithi@gmail.com)
const sendAdminNotificationEmail = async (order) => {
    const orderItemsList = order.items.map(item => 
        `<li>${item.qty} x ${item.name} (KSH ${item.price.toFixed(2)})</li>`
    ).join('');

    const mailOptions = {
        from: `Order System <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Sends to olmarithi@gmail.com
        subject: `NEW PAID ORDER RECEIVED: #${order._id.toString().substring(18)}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #4ade80;">New Paid Order Details</h2>
                <p style="font-size: 1.1em; font-weight: bold;">ORDER ID: ${order._id}</p>
                
                <hr style="border: 1px solid #eee;">
                
                <h3>CLIENT DETAILS</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.email}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Delivery Location:</strong> ${order.deliveryLocation}</p>
                
                <hr style="border: 1px solid #eee;">
                
                <h3>ORDER SUMMARY</h3>
                <p><strong>Total Paid:</strong> KSH ${order.totalAmount.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                <p><strong>M-Pesa ID:</strong> ${order.transactionId || 'N/A'}</p>
                
                <h3>ITEMS</h3>
                <ul style="list-style: none; padding-left: 0;">
                    ${orderItemsList}
                </ul>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Admin notification email successfully sent.');
    } catch (error) {
        console.error(`Error sending admin notification email: ${error.message}`);
    }
};

module.exports = {
    sendClientThankYouEmail,
    sendAdminNotificationEmail,
};
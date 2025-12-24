// /backend/routes/mpesaRoutes.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const moment = require('moment'); // Helps with M-Pesa's timestamp format

// Utility function to generate the M-Pesa Access Token
const generateAccessToken = async (req, res, next) => {
    try {
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64');

        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', // Use production URL when live
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );

        // Attach the token to the request object for the next middleware/route
        req.access_token = response.data.access_token; 
        next(); // Proceed to the STK push function

    } catch (error) {
        console.error('Error generating M-Pesa access token:', error.message);
        res.status(500).json({ message: 'Payment initiation failed. Please try again.' });
    }
};

// @desc    Initiate STK Push
// @route   POST /api/mpesa/stk-push
// @access  Public
router.post('/stk-push', generateAccessToken, async (req, res) => {
    const { amount, phone, orderId } = req.body;
    const shortCode = process.env.MPESA_BUSINESS_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL; // Must be HTTPS

    // 1. Generate Timestamp and Password (required by M-Pesa)
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');
    
    try {
        const stkPushResponse = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', // Use production URL when live
            {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: phone, // Customer's phone number
                PartyB: shortCode,
                PhoneNumber: phone,
                CallBackURL: callbackUrl, // Safaricom sends payment status here
                AccountReference: `OlmarithiOrder-${orderId}`, // Unique reference
                TransactionDesc: 'Olmarithi Online Payment',
            },
            {
                headers: {
                    Authorization: `Bearer ${req.access_token}`,
                },
            }
        );
        
        // Respond to the client with the M-Pesa request status
        res.json(stkPushResponse.data);

    } catch (error) {
        console.error('STK Push Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to prompt M-Pesa PIN. Check phone number format.' });
    }
});

// @desc    M-Pesa Confirmation/Callback URL
// @route   POST /api/mpesa/callback
// @access  Public (Called only by Safaricom)
router.post('/callback', async (req, res) => {
    // Safaricom sends the payment confirmation/failure data here
    const data = req.body;
    console.log('M-Pesa Callback Received:', JSON.stringify(data, null, 2));

    const resultCode = data.Body.stkCallback.ResultCode;
    const merchantRequestID = data.Body.stkCallback.MerchantRequestID;
    const checkoutRequestID = data.Body.stkCallback.CheckoutRequestID;
    
    // Check if the transaction was successful
    if (resultCode === 0) {
        const transactionDetails = data.Body.stkCallback.CallbackMetadata.Item;
        const mpesaReceiptNumber = transactionDetails.find(item => item.Name === 'MpesaReceiptNumber').Value;
        const amount = transactionDetails.find(item => item.Name === 'Amount').Value;
        const phoneNumber = transactionDetails.find(item => item.Name === 'PhoneNumber').Value;
        
        // **In a production system, you would now use the orderId to update the Order model in your database**
        // Since the STK Push is non-blocking, you must have stored a pending order earlier
        
        // --- IMPORTANT: Update Order Status in DB ---
        // 1. Find the pending order using the CheckoutRequestID or AccountReference
        // 2. Update its `paymentStatus` to 'Paid'
        // 3. Update its `transactionId` with `mpesaReceiptNumber`

        console.log(`Payment SUCCESS for KSH ${amount} from ${phoneNumber}. Mpesa ID: ${mpesaReceiptNumber}`);
        
        // Always respond with a 200 OK status to Safaricom
        return res.status(200).json({ message: 'Callback received and processed successfully.' });
    } else {
        // Payment failed or was cancelled
        console.log(`Payment FAILED. Result Code: ${resultCode}. Message: ${data.Body.stkCallback.ResultDesc}`);

        // --- IMPORTANT: Update Order Status in DB ---
        // 1. Find the pending order
        // 2. Update its `paymentStatus` to 'Failed'
        
        return res.status(200).json({ message: 'Callback received, transaction failed.' });
    }
});


module.exports = router;
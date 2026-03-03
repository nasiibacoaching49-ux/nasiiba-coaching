const fetch = require('node-fetch');

/**
 * Vercel Serverless Function: Process Waafi (EVC Plus / eDahab) Payment
 * Using WAAFI (ASM) API
 */
module.exports = async (req, res) => {
    // Vercel handles method check via configuration or simple check
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { amount, phone, courseTitle, orderId } = req.body;

        // API Configuration (From environment variables)
        const MERCHANT_UID = process.env.WAAFI_MERCHANT_UID;
        const API_USER_ID = process.env.WAAFI_API_USER_ID;
        const API_KEY = process.env.WAAFI_API_KEY;

        if (!MERCHANT_UID || !API_USER_ID || !API_KEY) {
            throw new Error('Waafi API configuration missing on server.');
        }

        const requestId = orderId || `req_${Date.now()}`;
        const timestamp = Date.now().toString();

        const formattedAmount = parseFloat(amount).toFixed(2);
        const formattedPhone = phone.replace(/\D/g, '').slice(-9);

        // Waafi (ASM) API Request Structure
        const waafiBody = {
            schemaVersion: "1.0",
            requestId: requestId,
            timestamp: timestamp,
            channelName: "WEB",
            serviceName: "API_PURCHASE",
            serviceParams: {
                merchantUid: MERCHANT_UID,
                apiUserId: API_USER_ID,
                apiKey: API_KEY,
                paymentMethod: "MWALLET_ACCOUNT",
                payerInfo: {
                    accountNo: formattedPhone
                },
                transactionInfo: {
                    amount: formattedAmount,
                    currency: "USD",
                    description: `Enrollment: ${courseTitle.substring(0, 30)}` // Limit length
                }
            }
        };

        console.log(`[Waafi Request] ID: ${requestId}, Phone: ${formattedPhone}, Amount: ${formattedAmount}`);

        const response = await fetch('https://api.waafi.com/asm', {
            method: 'POST',
            body: JSON.stringify(waafiBody),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Waafi Gateway HTTP Error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        console.log('Waafi Response:', JSON.stringify(data, null, 2));

        // Return the response to frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('Waafi API Error:', error);
        return res.status(500).json({
            error: error.message,
            hint: "Ensure environment variables WAAFI_MERCHANT_UID, WAAFI_API_USER_ID, and WAAFI_API_KEY are set in Vercel."
        });
    }
};

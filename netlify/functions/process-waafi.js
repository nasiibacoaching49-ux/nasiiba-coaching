const fetch = require('node-fetch');

/**
 * Netlify Function: Process Waafi (EVC Plus / eDahab) Payment
 * Using WAAFI (ASM) API
 */
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, phone, courseTitle, orderId } = JSON.parse(event.body);

        // API Configuration (From environment variables)
        const MERCHANT_UID = process.env.WAAFI_MERCHANT_UID;
        const API_USER_ID = process.env.WAAFI_API_USER_ID;
        const API_KEY = process.env.WAAFI_API_KEY;

        if (!MERCHANT_UID || !API_USER_ID || !API_KEY) {
            throw new Error('Waafi API configuration missing on server.');
        }

        const requestId = orderId || `req_${Date.now()}`;
        const timestamp = Date.now().toString();

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
                    // Only use 9 digits Somali format
                    accountNo: phone.length >= 9 ? phone.slice(-9) : phone
                },
                transactionInfo: {
                    amount: amount.toString(),
                    currency: "USD",
                    description: `Enrollment: ${courseTitle}`
                }
            }
        };

        console.log('Requesting Waafi:', JSON.stringify(waafiBody, null, 2));

        const response = await fetch('https://api.waafi.com/asm', {
            method: 'POST',
            body: JSON.stringify(waafiBody),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        console.log('Waafi Response:', JSON.stringify(data, null, 2));

        // Return the response to frontend
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Waafi Netlify Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                hint: "Ensure environment variables WAAFI_MERCHANT_UID, WAAFI_API_USER_ID, and WAAFI_API_KEY are set in Netlify."
            })
        };
    }
};

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
                    accountNo: phone.startsWith('252') ? phone : `252${phone.replace(/^0+/, '')}`
                },
                transactionInfo: {
                    amount: amount.toString(),
                    currency: "USD",
                    description: `Enrollment: ${courseTitle}`
                }
            }
        };

        const response = await fetch('https://api.waafi.com/asm', {
            method: 'POST',
            body: JSON.stringify(waafiBody),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        // Return the response to frontend
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Waafi Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

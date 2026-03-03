// Using native fetch available in Node.js 18+ on Vercel

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

        // API Configuration (From environment variables with provided fallbacks)
        const MERCHANT_UID = process.env.WAAFI_MERCHANT_UID || "M0914117";
        const API_USER_ID = process.env.WAAFI_API_USER_ID || "1008567";
        const API_KEY = process.env.WAAFI_API_KEY || "API-s7xzTgLFJY0NfRtxrXwD0NZ9T0";

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
                    referenceId: requestId,
                    amount: formattedAmount,
                    currency: "USD",
                    description: `Enrollment: ${courseTitle.substring(0, 30)}` // Limit length
                }
            }
        };

        console.log(`[Waafi Request] ID: ${requestId}, Phone: ${formattedPhone}, Amount: ${formattedAmount}`);

        const response = await fetch('https://api.waafipay.com/asm', {
            method: 'POST',
            body: JSON.stringify(waafiBody),
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => {
            console.error('[Waafi Fetch Error]:', err);
            throw new Error(`Connection to Waafi API failed: ${err.message}`);
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Waafi Gateway HTTP Error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        console.log('Waafi Response Full:', JSON.stringify(data, null, 2));

        // Normalize for frontend (script.js expects errorCode and description)
        // In Waafi ASM, responseCode '2001' is Success.
        const normalizedResponse = {
            ...data,
            errorCode: data.responseCode === '2001' ? '0' : (data.errorCode || data.responseCode),
            description: data.responseMsg || data.description || (data.params ? data.params.description : null)
        };

        console.log('Returning Normalized:', JSON.stringify(normalizedResponse, null, 2));

        // Return the normalized response to frontend
        return res.status(200).json(normalizedResponse);

    } catch (error) {
        console.error('Final Waafi Error:', error);
        return res.status(500).json({
            error: error.message,
            errorCode: '500',
            description: error.message,
            details: error.stack
        });
    }
};

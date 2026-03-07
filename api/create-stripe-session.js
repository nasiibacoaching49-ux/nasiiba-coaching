// Stripe is initialized from the STRIPE_SECRET_KEY environment variable set in Vercel
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 * Supports: Visa, Mastercard, Amex, Apple Pay, Google Pay, and all enabled methods
 */
module.exports = async (req, res) => {
    // Allow CORS from same origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            console.error('Failed to parse request body:', e);
        }
    }

    const { amount, courseTitle, successUrl, cancelUrl } = body || {};

    if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Missing or invalid amount parameter.' });
    }
    if (!courseTitle) {
        return res.status(400).json({ error: 'Missing courseTitle parameter.' });
    }

    const unitAmount = Math.round(parseFloat(amount) * 100); // Convert to cents
    if (unitAmount < 50) { // Stripe minimum is $0.50
        return res.status(400).json({ error: 'Amount is below the minimum charge of $0.50.' });
    }

    const origin = req.headers.origin || req.headers.referer || 'https://nasiibacoaching.com';

    try {
        const session = await stripe.checkout.sessions.create({
            // automatic_payment_methods enables: Visa, Mastercard, Amex, Apple Pay, Google Pay, etc.
            automatic_payment_methods: {
                enabled: true,
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: courseTitle,
                            description: 'Nasiiba Coaching - Course Enrollment',
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl || `${origin}/student.html?tab=courses&payment=success`,
            cancel_url: cancelUrl || `${origin}/course.html?payment=cancelled`,
            // Allow promotion codes entered at checkout
            allow_promotion_codes: true,
            // Collect billing address for card verification
            billing_address_collection: 'auto',
        });

        console.log(`[Stripe] Session created: ${session.id} for "${courseTitle}" - $${amount}`);
        return res.status(200).json({ id: session.id, url: session.url });

    } catch (error) {
        console.error('Stripe Error:', error);
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
};

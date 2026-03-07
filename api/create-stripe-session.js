const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 */
module.exports = async (req, res) => {
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

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: courseTitle,
                        },
                        unit_amount: Math.round(parseFloat(amount) * 100), // In cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl || `${req.headers.origin}/success`,
            cancel_url: cancelUrl || `${req.headers.origin}/course.html`,
        });

        return res.status(200).json({ id: session.id, url: session.url });

    } catch (error) {
        console.error('Stripe Error:', error);
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
};

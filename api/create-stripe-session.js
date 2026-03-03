const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 */
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { amount, courseTitle, successUrl, cancelUrl } = req.body;

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
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return res.status(200).json({ id: session.id, url: session.url });

    } catch (error) {
        console.error('Stripe Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

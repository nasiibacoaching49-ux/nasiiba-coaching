const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Netlify Function: Create Stripe Checkout Session
 */
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, courseTitle, successUrl, cancelUrl } = JSON.parse(event.body);

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

        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id, url: session.url })
        };

    } catch (error) {
        console.error('Stripe Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

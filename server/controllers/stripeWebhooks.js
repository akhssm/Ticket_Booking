import Stripe from "stripe";
import Booking from '../models/Booking.js'

export const stripeWebhooks = async (req, res) => {
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        // Stripe requires raw body for webhook signature verification
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook error: ${error.message}`);
    }

    try {
        switch (event.type) {

            // Checkout session completed (Stripe Checkout)
            case "checkout.session.completed": {
                const session = event.data.object;
                const bookingId = session.metadata?.bookingId;

                if (bookingId) {
                    await Booking.findByIdAndUpdate(bookingId, {
                        isPaid: true,
                        paymentLink: ""
                    });
                    console.log(`Booking ${bookingId} marked as paid via checkout.session.completed`);
                }
                break;
            }

            // Payment Intent succeeded (alternative event Stripe may send)
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const bookingId = paymentIntent.metadata?.bookingId;

                if (bookingId) {
                    await Booking.findByIdAndUpdate(bookingId, {
                        isPaid: true,
                        paymentLink: ""
                    });
                    console.log(`Booking ${bookingId} marked as paid via payment_intent.succeeded`);
                }
                break;
            }

            default:
                console.log('Unhandled event type: ', event.type);
        }

        // Respond to Stripe
        res.json({ received: true });

    } catch (err) {
        console.error("Webhook processing error:", err);
        res.status(500).send("Internal Server Error");
    }
};

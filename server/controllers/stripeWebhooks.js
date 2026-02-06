import Stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // req.body MUST be the raw Buffer for Vercel/Stripe to work
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("❌ Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  try {
    let bookingId;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        bookingId = session.metadata?.bookingId;
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        // Check metadata first
        bookingId = paymentIntent.metadata?.bookingId;
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
        return res.json({ received: true });
    }

    if (!bookingId) {
      console.log("⚠️ bookingId not found in event metadata");
      return res.json({ received: true });
    }

    // Update booking in DB
    // We clear the paymentLink so the "Pay Now" button disappears
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { isPaid: true, paymentLink: "" },
      { new: true }
    );

    if (!booking) {
      console.log(`⚠️ Booking with ID ${bookingId} not found in database`);
    } else {
      console.log(`✅ Booking ${bookingId} marked as paid successfully`);
    }

    // Always return a 200 to Stripe to stop retries
    res.status(200).json({ received: true });

  } catch (err) {
    console.error("❌ Webhook processing error:", err.message);
    // Returning 500 tells Stripe to try again later
    res.status(500).send("Internal Server Error");
  }
};
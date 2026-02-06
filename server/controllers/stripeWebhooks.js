// controllers/stripeWebhooks.js
import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Webhook Handler
 */
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  // Step 1: Verify Stripe webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Stripe signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Step 2: Helper to mark booking as paid
  const markPaid = async (bookingId, stripePaymentIntentId) => {
    if (!bookingId) {
      console.warn("⚠️ No bookingId in Stripe metadata");
      return;
    }

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        console.error(`⚠️ Booking not found for ID: ${bookingId}`);
        return;
      }

      if (booking.isPaid) {
        console.log(`ℹ️ Booking already marked paid: ${bookingId}`);
        return;
      }

      booking.isPaid = true;
      booking.paymentLink = ""; // Clear payment link
      if (stripePaymentIntentId) booking.stripePaymentIntent = stripePaymentIntentId; // optional debug
      await booking.save();

      console.log(`✅ Booking marked as paid: ${bookingId}`);
    } catch (err) {
      console.error(`❌ Error marking booking paid: ${bookingId}`, err);
    }
  };

  // Step 3: Handle different Stripe events
  try {
    switch (event.type) {
      // Checkout Session Completed
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(
          `💰 Stripe Checkout Session completed. Booking ID: ${session.metadata?.bookingId}`
        );

        // Some sessions may not have payment_intent if using automatic payments
        const paymentIntentId = session.payment_intent || null;

        await markPaid(session.metadata?.bookingId, paymentIntentId);
        break;
      }

      // Payment Intent Succeeded
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        console.log(
          `💳 Stripe PaymentIntent succeeded. Booking ID: ${intent.metadata?.bookingId}`
        );

        await markPaid(intent.metadata?.bookingId, intent.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.status(500).send({ error: "Webhook processing failed" });
  }
};

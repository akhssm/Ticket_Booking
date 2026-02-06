import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const markBookingPaid = async (bookingId) => {
      if (!bookingId) return;

      // ✅ idempotent update (VERY IMPORTANT)
      const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, isPaid: false },
        { isPaid: true, paymentLink: "" },
        { new: true }
      );

      if (booking) {
        console.log("✅ Booking marked paid:", bookingId);
      }
    };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await markBookingPaid(session.metadata?.bookingId);
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      await markBookingPaid(intent.metadata?.bookingId);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.status(500).send("Internal Server Error");
  }
};

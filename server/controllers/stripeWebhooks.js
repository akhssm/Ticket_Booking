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
    console.error("❌ Stripe signature failed:", err.message);
    return res.status(400).send();
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const bookingId = intent.metadata?.bookingId;

      if (!bookingId) return res.status(200).send();

      await Booking.findOneAndUpdate(
        { _id: bookingId, isPaid: false },
        { isPaid: true, paymentLink: "" }
      );

      console.log("✅ Booking marked paid:", bookingId);
    }

    // Stripe expects 200 no matter what
    res.status(200).send();
  } catch (err) {
    console.error("❌ Webhook DB error:", err);
    res.status(200).send(); // important: still return 200
  }
};

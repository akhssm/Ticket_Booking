import Stripe from "stripe";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js"; // ✅ ADD THIS

export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
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
    switch (event.type) {

      // ✅ PAYMENT SUCCESS
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            status: "PAID",
            paymentLink: ""
          });
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    res.json({ received: true });

  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.status(500).send("Internal Server Error");
  }
};

import Stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Stripe requires RAW body
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

      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentLink: ""
          });

          // Send Confirmation Email
          await inngest.send({
            name: "app/show.booked",
            data: {bookingId}
          })
          
          console.log(`✅ Booking ${bookingId} paid (checkout.session.completed)`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // 🔥 FIX: bookingId comes from payment_details.order_reference
        const bookingId =
          paymentIntent.metadata?.bookingId ||
          paymentIntent.payment_details?.order_reference;

        if (!bookingId) {
          console.log("⚠️ bookingId not found in payment_intent");
          break;
        }

        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: ""
        });

        console.log(`✅ Booking ${bookingId} paid (payment_intent.succeeded)`);
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

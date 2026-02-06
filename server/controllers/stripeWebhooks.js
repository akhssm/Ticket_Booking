import Stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Construct the event using the raw body for verification
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

    // Extract bookingId from metadata provided during checkout creation
    if (event.type === "checkout.session.completed") {
      bookingId = event.data.object.metadata?.bookingId;
    } else if (event.type === "payment_intent.succeeded") {
      bookingId = event.data.object.metadata?.bookingId;
    }

    if (bookingId) {
      /**
       * We update isPaid to true. 
       * In your frontend: {!item.isPaid && ...} will now hide the button.
       */
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { isPaid: true }, 
        { new: true }
      );

      if (updatedBooking) {
        console.log(`✅ Success: Booking ${bookingId} is now marked as Paid.`);
      } else {
        console.log(`⚠️ Warning: Booking ${bookingId} not found in database.`);
      }
    }

    // Acknowledge receipt of the event
    res.status(200).json({ received: true });

  } catch (err) {
    console.error("❌ Webhook Database Error:", err.message);
    res.status(500).send("Internal Server Error");
  }
};
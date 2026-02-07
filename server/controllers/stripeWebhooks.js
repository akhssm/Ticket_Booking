import express from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("STRIPE_WEBHOOK_SECRET exists:", !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log("Body is buffer:", Buffer.isBuffer(req.body));

    const sig = req.headers["stripe-signature"];
    let event;

    // 1️⃣ Verify signature
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Stripe signature verification failed:", err.message);
      return res.status(400).send("Invalid signature");
    }

    // 2️⃣ Process successful payment
    try {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
          console.log("❌ Invalid bookingId:", bookingId);
        } else {
          const booking = await Booking.findById(bookingId);

          if (!booking) {
            console.log("❌ Booking not found:", bookingId);
          } else if (!booking.isPaid) {
            booking.isPaid = true;
            booking.paymentLink = ""; // 🔥 KEY FIX
            await booking.save();

            console.log(`✅ Booking ${bookingId} marked as PAID`);
          } else {
            console.log("⚠️ Booking already paid:", bookingId);
          }
        }
      }
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
    }

    // 3️⃣ ACK Stripe LAST
    return res.status(200).json({ received: true });
  }
);

export default router;

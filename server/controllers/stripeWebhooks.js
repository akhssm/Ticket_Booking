import express from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // 🔍 DEBUG LOGS (very important)
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("STRIPE_WEBHOOK_SECRET exists:", !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log("Body is buffer:", Buffer.isBuffer(req.body));

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];

    let event;

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

    // ✅ ACK Stripe immediately (prevents retries)
    res.sendStatus(200);

    // 🔁 Process only successful payments
    if (event.type !== "payment_intent.succeeded") return;

    try {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata?.bookingId;

      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        console.log("❌ Invalid bookingId:", bookingId);
        return;
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        console.log("❌ Booking not found:", bookingId);
        return;
      }

      if (booking.isPaid) {
        console.log("⚠️ Booking already paid:", bookingId);
        return;
      }

      booking.isPaid = true;
      await booking.save();

      console.log(`✅ Booking ${bookingId} marked as PAID`);
    } catch (err) {
      console.error("❌ Webhook async error:", err);
    }
  }
);

export default router;

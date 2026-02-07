import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import Stripe from "stripe";

import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import Booking from "./models/Booking.js";

const app = express();
const port = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

await connectDB();

/* =====================================================
   🚨 STRIPE WEBHOOK — MUST BE FIRST
===================================================== */
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("STRIPE_WEBHOOK_SECRET exists:", !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log("Body is buffer:", Buffer.isBuffer(req.body));

    const sig = req.headers["stripe-signature"];
    let event;

    // ✅ Verify signature
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

    try {
      // ✅ RECOMMENDED EVENT FOR CHECKOUT
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;

        if (mongoose.Types.ObjectId.isValid(bookingId)) {
          const booking = await Booking.findById(bookingId);

          if (booking && !booking.isPaid) {
            booking.isPaid = true;
            booking.paymentLink = ""; // 🔥 CRITICAL FIX
            await booking.save();

            console.log(`✅ Booking ${bookingId} marked as PAID`);
          }
        }
      }
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
    }

    // ✅ ACK STRIPE LAST
    return res.status(200).json({ received: true });
  }
);

/* =====================================================
   🌍 GLOBAL MIDDLEWARE (AFTER WEBHOOK)
===================================================== */
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

/* =====================================================
   📦 ROUTES
===================================================== */
app.get("/", (req, res) => {
  res.send(`✅ Server live at http://localhost:${port}`);
});

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/show", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

/* =====================================================
   🚀 START SERVER
===================================================== */
app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});

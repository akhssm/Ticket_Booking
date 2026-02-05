import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Stripe Webhook (must come before express.json)
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Inngest webhook route
app.use("/api/inngest", serve({ client: inngest, functions }));

// API Routes
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

// Root route
app.get('/', (req, res) => res.send('Server is Live!'));

// Start server
app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);

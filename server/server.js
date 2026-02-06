import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = process.env.PORT || 3000;

// Connect to Database
await connectDB();

// 1. STRIPE WEBHOOK ROUTE (Must be BEFORE express.json)
// We use express.raw to ensure the body remains a Buffer for signature verification
app.post(
  "/api/stripe", 
  express.raw({ type: "application/json" }), 
  stripeWebhooks
);

// 2. GLOBAL MIDDLEWARES (Applied after the webhook route)
app.use(cors());
app.use(express.json()); // This will now only parse JSON for other routes
app.use(clerkMiddleware());

// 3. API ROUTES
app.get('/', (req, res) => res.send('Server is Live!'));

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
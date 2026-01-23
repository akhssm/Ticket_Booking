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

const app = express();
const port = 3000;

await connectDB()

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())

// API Routes
app.get('/', (req, res) => res.send('server is Live!'));
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));

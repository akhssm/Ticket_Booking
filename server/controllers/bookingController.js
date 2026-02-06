import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Stripe from 'stripe';
import { inngest } from "../inngest/index.js"; 

/**
 * Helper to check if selected seats are available.
 * Returns true if all selected seats are free.
 */
const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId);
        if (!showData) return false;

        const occupiedSeats = showData.occupiedSeats || {};

        // Returns true if ANY seat in selectedSeats is already in the occupiedSeats object
        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;
    } catch (error) {
        console.error("Availability Check Error:", error.message);
        return false;
    }
}

/**
 * Creates a booking, reserves seats, and generates a Stripe payment link.
 */
export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { showId, selectedSeats } = req.body;
        const { origin } = req.headers;

        // 1. Availability check
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
        if (!isAvailable) {
            return res.json({ success: false, message: "Selected Seats are not available." });
        }

        // 2. Fetch Show details to get price and movie title
        const showData = await Show.findById(showId).populate('movie');
        if (!showData) {
            return res.json({ success: false, message: "Show not found" });
        }

        // 3. Create the booking record
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        });

        // 4. Update Show document to occupy the seats
        selectedSeats.forEach((seat) => {
            showData.occupiedSeats[seat] = userId;
        });
        showData.markModified('occupiedSeats');
        await showData.save();

        // 5. Initialize Stripe
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

        // 6. Create Stripe Checkout Session
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { 
                        name: showData.movie.title,
                        description: `Seats: ${selectedSeats.join(', ')}`
                    },
                    // unit_amount must be in cents. Use Math.round to avoid floating point errors.
                    unit_amount: Math.round(booking.amount * 100) 
                },
                quantity: 1
            }],
            mode: 'payment',
            // Metadata is vital for your Webhook to find this booking later
            metadata: { bookingId: booking._id.toString() }, 
            payment_intent_data: {
                metadata: { bookingId: booking._id.toString() } 
            },
        });

        // 7. Store the Stripe URL and save
        booking.paymentLink = session.url;
        await booking.save();

        // 8. Trigger Inngest to auto-release seats if payment isn't finished in 10 mins
        await inngest.send({
            name: "app/checkpayment",
            data: { bookingId: booking._id.toString() }
        });

        res.json({ success: true, url: session.url });

    } catch (error) {
        console.error("Create Booking Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Fetches all occupied seats for a specific show.
 */
export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const showData = await Show.findById(showId);

        if (!showData) {
            return res.json({ success: false, message: "Show not found" });
        }

        const occupiedSeats = Object.keys(showData.occupiedSeats || {});
        res.json({ success: true, occupiedSeats });

    } catch (error) {
        console.error("Get Occupied Seats Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
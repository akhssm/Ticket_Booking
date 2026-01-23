import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    User: {type: String, required: true, re: 'User'},
    Show: {type: String, required: true, re: 'Show'},
    amount: {type: Number, required: true},
    bookedSeats: {type: Array, required: true},
    isPaid: {type: Boolean, default: false},
    paymentLink: {type: String},
},{ timestamps: true })

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
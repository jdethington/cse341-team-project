import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }, // Prevents Mongoose from creating an _id field for each passenger
);

const bookingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    createdAt: {
      type: String,
      required: true,
    },
    scheduleId: {
      type: String,
      required: true,
      trim: true,
    },
    tripId: {
      type: String,
      required: true,
      trim: true,
    },
    ticketClass: {
      type: String,
      required: true,
      trim: true,
    },
    selectedDay: {
      type: String,
      required: true,
      trim: true,
    },
    passengers: {
      type: [passengerSchema],
      required: true,
    },
  },
  {
    collection: "bookings",
  },
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

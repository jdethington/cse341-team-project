import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
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
    schedulerId: {
      type: String,
      required: true,
      trim: true,
    },
    tripId: {
      type: String,
      required: true,
    },
    ticketClass: {
      type: String,
      required: true,
    },
    selectedDay: {
      type: String,
      required: true,
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

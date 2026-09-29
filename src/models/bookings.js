import Booking from "./schemas/bookings.js";

const createBooking = async (bookingData) => {
  const booking = await Booking.create(bookingData);
  return booking.toObject();
};

const getAllBookings = () => {
  return Booking.find({}).lean();
};

const getBookingById = async (id) => {
  return Booking.findOne({ id }).lean();
};

const getBookingsByUserEmail = (email) => {
  return Booking.find({ "passengers.email": email }).lean();
};

export { createBooking, getAllBookings, getBookingById, getBookingsByUserEmail, };

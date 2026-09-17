import Booking from "./schemas/bookings";

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

export { createBooking, getAllBookings, getBookingById };

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

const getBookingsByPassengerEmail = async (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special regex characters
  return Booking.find({
    "passengers.email": { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
  }).lean();
};

const updateBooking = async (id, updates) => {
  const { id: _ignoreId, _id, ...safeUpdates } = updates;

  if (safeUpdates.passengers && !Array.isArray(safeUpdates.passengers)) {
    safeUpdates.passengers = Object.values(safeUpdates.passengers);
  }

  return Booking.findOneAndUpdate(
    { id },
    { $set: safeUpdates },
    { returnDocument: "after", runValidators: true },
  ).lean();
};

const deleteBooking = async (id) => {
  return Booking.findOneAndDelete({ id }).lean();
};

export {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByPassengerEmail,
  updateBooking,
  deleteBooking,
};

import { getBookingById } from "../models/bookings.js";

export default async (req, res) => {
  const { confirmationId } = req.params;

  const confirmation = await getBookingById(confirmationId);
  res.render("trips/confirm", {
    title: "Trip Confirmation",
    confirmation,
  });
};

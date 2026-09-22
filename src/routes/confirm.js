import { getBookingById } from "../models/bookings.js";

export default async (req, res) => {
  try {
    const { confirmationId } = req.params;

    const booking = await getBookingById(confirmationId);

    if (!booking) {
      return res.status(404).json("errors/404", {
        title: "Booking Not Found",
        error: "The booking confirmation ID provided does not exist.",
      });
    }

    return res.render("trips/confirm", {
      title: "Trip Confirmation",
      booking,
    });

  } catch (error) {
    // console.error("Error rendering confirmation page:", error);
    return res.status(500).json("errors/500", {
      title: "Server Error",
      error: "Failed to render confirmation page",
    });
  }
};


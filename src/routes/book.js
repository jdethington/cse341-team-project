import { getDb } from "../db/connect.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";

const bookingPage = async (req, res) => {
  const { scheduleId } = req.params;

  const db = getDb();
  const schedule = await db
    .collection("schedules")
    .findOne({ id: Number(scheduleId) });
  const trip = await db.collection("trips").findOne({ id: schedule.tripId });

  const ticketClasses = await getAllTicketClasses();
  const ticketOptions = ticketClasses.map((ticketClass) => ({
    class: ticketClass.class,
    name: ticketClass.name,
    price: trip.distance * ticketClass.pricePerKm,
    amenities: ticketClass.amenities,
    description: ticketClass.description,
  }));

  res.render("trips/book", {
    title: "Book Trip",
    schedule,
    ticketOptions,
  });
};

// export {
//   bookingPage,
//   // processBookingRequest
// };

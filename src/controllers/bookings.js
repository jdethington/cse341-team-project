import {
  createBooking as createNewBooking,
  getAllBookings as findAllBookings,
  getBookingById as findBookingById,
} from "../models/bookings.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";
import { generateBookingCode } from "../includes/helpers.js";
import { getDb } from "../db/connect.js";

export async function processBookingRequest(req, res) {
  try {
    const booking = {
      id: generateBookingCode(),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    await createNewBooking(booking);

    return res.redirect(`/trips/confirmation/${booking.id}`);
  } catch (error) {
    console.error("Error processing booking request:", error);

    return res.status(500).json({
      error: "Failed to process booking request",
    });
  }
}

export async function getAllBookings(req, res) {
  try {
    const bookings = await findAllBookings();

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);

    return res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
}

export async function bookingPage(req, res) {
  try {
    const { scheduleId } = req.params;
    // Change to use Mongoose model instead of the database connection directly
    // Might need to wait until after Feature Set 1: Trips is implemented to use the Mongoose model for schedules and trips
    const db = getDb();
    const schedule = await db
      .collection("schedules")
      .findOne({ id: Number(scheduleId) });
    // console.log("Schedule:", schedule);
    const trip = await db.collection("trips").findOne({ id: schedule.tripId });

    // console.log("Trip:", trip);

    const ticketClasses = await getAllTicketClasses();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
      class: ticketClass.class,
      name: ticketClass.name,
      price: trip.distance * ticketClass.pricePerKm,
      amenities: ticketClass.amenities,
      description: ticketClass.description,
    }));

    return res.render("trips/book", {
      title: "Book Trip",
      schedule,
      ticketOptions,
    });
  } catch (error) {
    console.error("Error rendering booking page:", error);

    return res.status(500).json({
      error: "Failed to render booking page",
    });
  }
}

export function bookingsAdminPage(req, res) {
  return res.render("bookings", {
    title: "Bookings Administration",
  });
}

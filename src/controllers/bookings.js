import {
  createBooking as createNewBooking,
  getAllBookings as findAllBookings,
  getBookingById as findBookingById,
  getBookingsByPassengerEmail,
  updateBooking as updateBookingRecord,
  deleteBooking as deleteBookingRecord,
} from "../models/bookings.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";
// import { getTripById } from "../models/trips.js"; // Uncomment this line when the getTripById function is implemented in the trips model
// import { getScheduleById } from "../models/schedules.js"; // Uncomment this line when the getScheduleById function is implemented in the schedules model
import { generateBookingCode } from "../includes/helpers.js";
import { getDb } from "../db/connect.js";

// Helper functions
function userIsAdmin(user) {
  return user?.role === "admin";
}

function userIsPassengerOnBooking(user, booking) {
  if (!user?.email || !booking?.passengers) {
    return false;
  }
  const email = String(user.email).trim().toLowerCase();
  const passengers = Array.isArray(booking.passengers)
    ? booking.passengers
    : Object.values(booking.passengers || {});
  return passengers.some(
    (passenger) => String(passenger.email).trim().toLowerCase() === email,
  );
}

function canManageBooking(user, booking) {
  return userIsAdmin(user) || userIsPassengerOnBooking(user, booking);
}

// Controller functions for handling booking-related requests

export async function processBookingRequest(req, res) {
  try {
    const booking = {
      id: generateBookingCode(),
      createdAt: new Date().toISOString(),
      ...req.body,
    };
    if (booking.passengers && !Array.isArray(booking.passengers)) {
      booking.passengers = Object.values(booking.passengers);
    }

    await createNewBooking(booking);

    return res.redirect(`/trips/confirmation/${booking.id}`);
  } catch (error) {
    console.error("Error processing booking request:", error);

    return res.status(500).json("errors/500", {
      title: "Booking Error",
      error: "Failed to process booking request",
    });
  }
}

/**
 * GET /api/bookings
 * Admin: all bookings
 * Non-admin: only bookings where their email is a passenger
 */
export async function getAllBookings(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    let bookings;
    if (userIsAdmin(req.user)) {
      bookings = await findAllBookings();
    } else {
      bookings = await getBookingsByPassengerEmail(req.user.email);
    }
    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);

    // return res.status(500).json("errors/500", {
    //   title: "Server Error",
    //   error: "Failed to fetch bookings",
    // });
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
}

/**
 * PUT /api/bookings/:id
 */
export async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const existing = await findBookingById(id);

    if (!existing) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!canManageBooking(req.user, existing)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await updateBookingRecord(id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ booking: updated });
  } catch (error) {
    console.error("Error updating booking:", error);
    return res.status(500).json({ message: "Failed to update booking" });
  }
}

/**
 * DELETE /api/bookings/:id
 */
export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const existing = await findBookingById(id);

    if (!existing) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!canManageBooking(req.user, existing)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await deleteBookingRecord(id);
    return res.status(200).json({ message: "Booking deleted", id });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ message: "Failed to delete booking" });
  }
}

export async function bookingPage(req, res) {
  try {
    const { scheduleId } = req.params;
    // Change to use Mongoose model instead of the database connection directly
    // Will need to wait until after Feature Set 1 & 2 are implemented to use the Mongoose model for schedules and trips
    const db = getDb();
    const schedule = await db
      .collection("schedules")
      .findOne({ id: Number(scheduleId) });
    // const schedule = await getScheduleById(scheduleId); // Assuming getScheduleById is a function that retrieves a schedule by its ID
    if (!schedule) {
      // return res.status(404).json("errors/404", {
      //   title: "Schedule Not Found",
      //   error: "The requested schedule does not exist.",
      // });
      return res.status(404).json({ message: "Schedule not found" });
    }

    const trip = await db.collection("trips").findOne({ id: schedule.tripId });
    // const trip = await getTripById(schedule.tripId); // Assuming getTripById is a function that retrieves a trip by its ID
    if (!trip) {
      return res.status(404).json("errors/404", {
        title: "Trip Not Found",
        error: "The requested trip does not exist.",
      });
    }

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

    return res.status(500).json("errors/500", {
      title: "Server Error",
      error: "Failed to render booking page",
    });
  }
}

export function bookingsAdminPage(req, res) {
  return res.render("bookings", {
    title: "Bookings Administration",
  });
}

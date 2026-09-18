//src/controllers/ticket-classes.js
import {
  getAllTicketClasses as findAllTicketClasses,
  getTicketClassesForDay as findTicketClassesForDay,
} from "../models/ticket-classes.js";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export async function getAllTicketClasses(req, res) {
  try {
    const ticketClasses = await findAllTicketClasses();

    return res.status(200).json({ ticketClasses });
  } catch (error) {
    console.error("Error fetching ticket classes:", error);

    return res.status(500).json({
      error: "Failed to fetch ticket classes",
    });
  }
}

export async function getTicketClassesForDay(req, res) {
  try {
    const { day } = req.query;

    if (!WEEKDAYS.includes(day)) {
      return res.status(400).json({
        error: "Invalid day. Use one of: " + WEEKDAYS.join(", "),
      });
    }

    const ticketClasses = await findTicketClassesForDay(day);

    return res.status(200).json({ ticketClasses });
  } catch (error) {
    console.error("Error fetching ticket classes for day:", error);

    return res.status(500).json({
      error: "Failed to fetch ticket classes",
    });
  }
}

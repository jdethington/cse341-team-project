import { Router } from "express";
import { getAllTicketClasses, getTicketClassesForDay } from "../controllers/ticket-classes.js";

const router = Router();

// Ticket classes
router.get("/api/ticket-classes", (req, res, next) => {
  if (req.query.day !== undefined) {
    return getTicketClassesForDay(req, res, next);
  }
  return getAllTicketClasses(req, res, next);
});

export default router;

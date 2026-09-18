import { Router } from "express";
import {
  getAllTicketClasses,
  getTicketClassesForDay,
} from "../controllers/ticket-classes.js";
import { getAllBookings } from "../controllers/bookings.js";

const router = Router();

// /api/ticket-classes
/**
 * @openapi
 * /api/ticket-classes:
 *   get:
 *     summary: List ticket classes
 *     description: >
 *       Returns every ticket class. Optionally filter to the classes
 *       available on a specific day with the `day` query parameter.
 *     tags:
 *       - Ticket Classes
 *     parameters:
 *       - in: query
 *         name: day
 *         required: false
 *         description: >
 *           Day of week to filter by, such as `monday`. Invalid values
 *           return 400.
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *     responses:
 *       200:
 *         description: Ticket classes (all, or filtered by day)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketClasses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TicketClass'
 *       400:
 *         description: The `day` query parameter was invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Unable to retrieve ticket classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *   components:
 *     schemas:
 *       TicketClass:
 *         type: object
 *         properties:
 *           class:
 *             type: string
 *             example: premium
 *           name:
 *             type: string
 *             example: Premium Class
 *           pricePerKm:
 *             type: number
 *             example: 150
 *           amenities:
 *             type: array
 *             items:
 *               type: string
 *           description:
 *             type: string
 *           availableDays:
 *             type: array
 *             items:
 *               type: string
 */
router.get("/api/ticket-classes", (req, res, next) => {
  if (req.query.day !== undefined) {
    return getTicketClassesForDay(req, res, next);
  }
  return getAllTicketClasses(req, res, next);
});

// /api/bookings
/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: List bookings
 *     description: Returns all bookings.
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Unable to retrieve bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: JRIXB6XMB6
 *         createdAt:
 *           type: string
 *           example: "2026-09-17T19:47:23.048Z"
 *         scheduleId:
 *           type: string
 *           example: "1"
 *         tripId:
 *           type: string
 *           example: alpine-panorama
 *         ticketClass:
 *           type: string
 *           example: premium
 *         selectedDay:
 *           type: string
 *           example: monday
 *         passengers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 *     Passenger:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: William
 *         lastName:
 *           type: string
 *           example: Clark
 *         email:
 *           type: string
 *           example: william.clark16@example.com
 *         phone:
 *           type: string
 *           example: "+1 555-0159-8714"
 */
router.get("/api/bookings", getAllBookings);

export default router;

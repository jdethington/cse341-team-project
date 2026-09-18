import { Router } from "express";
import { getAllTicketClasses, getTicketClassesForDay } from "../controllers/ticket-classes.js";

const router = Router();

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

export default router;

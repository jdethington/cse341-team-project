import { Router } from "express";
import { getAllTicketClasses, getTicketClassesForDay } from "../controllers/ticket-classes.js";
import { getAllStations, getStationById } from "../controllers/stations.js";

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
 * components:
 *   schemas:
 *     TicketClass:
 *       type: object
 *       properties:
 *         class:
 *           type: string
 *           example: premium
 *         name:
 *           type: string
 *           example: Premium Class
 *         pricePerKm:
 *           type: number
 *           example: 150
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         description:
 *           type: string
 *         availableDays:
 *           type: array
 *           items:
 *             type: string
 */
router.get("/api/ticket-classes", (req, res, next) => {
  if (req.query.day !== undefined) {
    return getTicketClassesForDay(req, res, next);
  }
  return getAllTicketClasses(req, res, next);
});


/**
 * @openapi
 * /api/stations:
 *   get:
 *     summary: List all stations
 *     tags:
 *       - Stations
 *     responses:
 *       200:
 *         description: Stations returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Station'
 *       500:
 *         description: Unable to retrieve stations
 */
router.get("/api/stations", getAllStations);

/**
 * @openapi
 * /api/stations/{id}:
 *   get:
 *     summary: Get one station by id
 *     tags:
 *       - Stations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The station id, such as nagoya
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Station'
 *       404:
 *         description: Station not found
 *       500:
 *         description: Unable to retrieve station
 */
router.get("/api/stations/:id", getStationById);

/**
 * @openapi
 * components:
 *   schemas:
 *     Station:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: nagoya
 *         name:
 *           type: string
 *           example: Nagoya Station
 *         prefecture:
 *           type: string
 *           example: Aichi
 *         region:
 *           type: string
 *           example: central
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["restaurant", "shop", "restroom"]
 *         description:
 *           type: string
 *           example: Major transportation hub in central Japan.
 */


export default router;

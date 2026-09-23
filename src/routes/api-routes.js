import { Router } from "express";
import {
  getAllTicketClasses,
  getTicketClassesForDay,
} from "../controllers/ticket-classes.js";
import { getAllStations, getStationById } from "../controllers/stations.js";
import { getAllTrips, getTripById } from "../controllers/trips.js";
import { getAllBookings } from "../controllers/bookings.js";
import {
  getAllSchedules,
  getSchedulesForTrip,
} from "../controllers/schedules.js";

const router = Router();

// /api/ticket-classes
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
 *     Trip:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         region:
 *           type: string
 *         startStation:
 *           type: string
 *         endStation:
 *           type: string
 *         duration:
 *           type: string
 *         distance:
 *           type: number
 *         bestSeason:
 *           type: string
 *         operatingMonths:
 *           type: array
 *           items:
 *             type: number
 *         imageUrl:
 *           type: string
 *         description:
 *           type: string
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "JRKSR10P53"
 *         createdAt:
 *           type: string
 *           example: "2026-09-17T19:47:23.048Z"
 *         scheduleId:
 *           type: string
 *           example: "1"
 *         tripId:
 *           type: string
 *           example: "alpine-panorama"
 *         ticketClass:
 *           type: string
 *           example: "premium"
 *         selectedDay:
 *           type: string
 *           example: "thursday"
 *         passengers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 *     Passenger:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           example: "123-456-7890"
 *     Schedule:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6aad538fb32652d06b5deae0"
 *         id:
 *           type: string
 *           example: "1"
 *         tripId:
 *           type: string
 *           example: "alpine-panorama"
 *         departureTime:
 *           type: string
 *           example: "08:30"
 *         arrivalTime:
 *           type: string
 *           example: "13:00"
 *         daysOfWeek:
 *           type: array
 *           items:
 *             type: string
 *           example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *         status:
 *           type: boolean
 *           example: true
 */

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Unable to retrieve station
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/api/stations/:id", getStationById);

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: List all trips
 *     description: Returns every scenic trip in the database.
 *     tags:
 *       - Trips
 *     responses:
 *       200:
 *         description: All trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Unable to retrieve trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/api/trips", getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get a single trip by ID
 *     description: Returns one trip matching the given id.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The trip id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The matching trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Unable to retrieve trip
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/api/trips/:id", getTripById);

// /api/bookings
/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: List bookings
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
 */
router.get("/api/bookings", getAllBookings);

// Schedules API
/**
 * @openapi
 * /api/schedules:
 *   get:
 *     summary: Retrieve all schedules
 *     tags:
 *       - Schedules
 *     responses:
 *       200:
 *         description: A list of all schedules in the database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Failed to fetch schedules
 */
router.get("/api/schedules", getAllSchedules);

/**
 * @openapi
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Retrieve schedules for a specific trip (optionally filtered by month)
 *     tags:
 *       - Schedules
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip identifier (e.g., alpine-panorama)
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional month value to filter schedule results
 *     responses:
 *       200:
 *         description: A list of schedules matching the trip ID and optional month
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Schedules not found
 *       500:
 *         description: Failed to fetch schedules
 */
router.get("/api/trips/:id/schedules", getSchedulesForTrip);

export default router;

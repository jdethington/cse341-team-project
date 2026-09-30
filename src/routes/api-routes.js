import { Router } from "express";
import {
  getAllTicketClasses,
  getTicketClassesForDay,
} from "../controllers/ticket-classes.js";
import { getAllStations, getStationById } from "../controllers/stations.js";
import { getAllTrips, getTripById } from "../controllers/trips.js";
import {
  getAllBookings,
  getMyBookings,
  updateBooking,
  deleteBooking,
} from "../controllers/bookings.js";
import {
  getAllSchedules,
  getSchedulesForTrip,
} from "../controllers/schedules.js";
import { requireApiLogin } from "../middleware/auth.js";
import { getUsers, updateUserById, deleteUser } from "../controllers/users.js";
import { getTrainById, getAllTrains } from "../controllers/trains.js";

const router = Router();

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     sessionCookie:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *       description: Express session cookie set after POST /login
 */

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
 *     security:
 *       - sessionCookie: []
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
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Unable to retrieve bookings
 */
router.get("/api/bookings", requireApiLogin, getAllBookings);

/**
 * @openapi
 * /api/bookings/me:
 *   get:
 *     summary: List the signed-in user's bookings
 *     tags:
 *       - Bookings
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: The signed-in user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Unable to retrieve bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/api/bookings/me", requireApiLogin, getMyBookings);

/**
 * @openapi
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Booking updated
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put("/api/bookings/:id", requireApiLogin, updateBooking);

/**
 * @openapi
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Booking deleted
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete("/api/bookings/:id", requireApiLogin, deleteBooking);

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

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6ab13aac590626137e2cdfea"
 *         name:
 *           type: string
 *           example: "Pam Christison"
 *         username:
 *           type: string
 *           example: "pamchristison"
 *         email:
 *           type: string
 *           example: "pam@example.com"
 *         role:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "admin"
 */
/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List users
 *     description: >
 *       Returns all users for admins, or only the signed-in user's
 *       own record for customers.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: User list returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/api/users", requireApiLogin, getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user
 *     description: >
 *       Admins can update any user. Customers can only update
 *       their own record. Updatable fields are name, username,
 *       and email only.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden — cannot update another user's record
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete a user
 *     description: >
 *       Admins can delete any user. Customers can only delete
 *       their own record.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB ObjectId
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden — cannot delete another user's record
 *       404:
 *         description: User not found
 */
// API routes - require login
router.patch("/api/users/:id", requireApiLogin, updateUserById);
router.delete("/api/users/:id", requireApiLogin, deleteUser);

// Trains API
/**
 * @openapi
 * components:
 *   schemas:
 *     Train:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: series-e353
 *         name:
 *           type: string
 *           example: Series E353 Limited Express
 *         operator:
 *           type: string
 *           example: JR East
 *         type:
 *           type: string
 *           example: Limited Express
 *         maxSpeedKmh:
 *           type: number
 *           example: 130
 *         capacity:
 *           type: number
 *           example: 360
 *         powerSource:
 *           type: string
 *           example: Electric
 *         bestFor:
 *           type: string
 *         description:
 *           type: string
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalItems:
 *           type: integer
 *           example: 4
 *         totalPages:
 *           type: integer
 *           example: 1
 *         hasNextPage:
 *           type: boolean
 *         hasPreviousPage:
 *           type: boolean
 *     ValidationError:
 *       type: object
 *       properties:
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: limit
 *               message:
 *                 type: string
 *                 example: limit must be a number between 1 and 50.
 */
/**
 * @openapi
 * /api/trains:
 *   get:
 *     summary: List trains (paginated)
 *     description: >
 *       Returns trains in smaller, page-sized result sets. Results are
 *       sorted by name (ascending) so page order is stable.
 *     tags:
 *       - Trains
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number to return (starting at 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of trains per page (1 to 50)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: A page of trains with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Train'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid page or limit value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: The requested page is past the last page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Page 3 does not exist. The last page is 2.
 *       500:
 *         description: Failed to fetch trains
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch trains
 */
router.get("/api/trains", getAllTrains);

/**
 * @openapi
 * /api/trains/{id}:
 *   get:
 *     summary: Retrieve a single train by id
 *     description: Returns one train by its id (e.g., series-e353).
 *     tags:
 *       - Trains
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The train identifier (e.g., series-e353)
 *     responses:
 *       200:
 *         description: The train
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Train'
 *       404:
 *         description: Train not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Train not found
 *       500:
 *         description: Failed to fetch train
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch train
 */
router.get("/api/trains/:id", getTrainById);

export default router;

import railTripsRouter from "./trips.js";
import { trainsPage, getTrainById, getAllTrains } from "./trains.js";
import { Router } from "express";
import { homePage, aboutPage, testErrorPage } from "./index.js";

const router = Router();

// Home page
router.get("/", homePage);

// About page
router.get("/about", aboutPage);

// Trains page
router.get("/trains", trainsPage);

// Trains API
/**
 * @openapi
 * /api/trains:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Get all trains
 *     description: Returns a list of all trains in the system.
 *     responses:
 *       200:
 *         description: Successful response with an array of trains
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trains:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Train'
 *       500:
 *         description: Server error
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
 *     tags:
 *       - Trains
 *     summary: Get a train by ID
 *     description: Returns a single train matching the given ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique train ID
 *         example: series-e353
 *     responses:
 *       200:
 *         description: Successful response with the train object
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
 *         description: Server error
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

// Rail trips
router.use("/trips", railTripsRouter);

// Test 500 error page
router.get("/500", testErrorPage);

export default router;

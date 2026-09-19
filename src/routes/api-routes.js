import express from 'express';
import { getAllTrips, getTripById } from '../controllers/trips.js';

const router = express.Router();

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Retrieve a list of all trips
 *     tags: [Trips]
 *     responses:
 *       200:
 *         description: A list of trips
 *       500:
 *         description: Server error
 */
router.get('/trips', getAllTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a single trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     responses:
 *       200:
 *         description: Trip data found
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.get('/trips/:id', getTripById);

export default router;
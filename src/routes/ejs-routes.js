import express from 'express';
import { renderTripList, renderTripDetails } from '../controllers/trips.js';

const router = express.Router();

// Trip view routes
router.get('/trips', renderTripList);
router.get('/trips/:id', renderTripDetails);

export default router;
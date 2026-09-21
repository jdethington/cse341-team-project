import { getAllTrips as fetchAllTrips, getTripById as fetchTripById } from '../models/trips.js';

// Get all trips
export async function getAllTrips(req, res) {
    try {
        const trips = await fetchAllTrips();
        return res.status(200).json(trips);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve trips', error: error.message });
    }
}

// Get a single trip by ID
export async function getTripById(req, res) {
    try {
        const tripId = req.params.id;
        const trip = await fetchTripById(tripId);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        return res.status(200).json(trip);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve trip', error: error.message });
    }
}
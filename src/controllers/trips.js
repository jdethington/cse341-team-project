import { getAllTrips as fetchAllTrips, getTripById as fetchTripById } from '../models/trips.js';
import { getDb } from '../db/connect.js';

// Page Controller: Render EJS Trip Details page
export async function renderTripDetails(req, res) {
    try {
        const tripId = req.params.id;
        const db = getDb();

        // Fetch trip from database (schedules are handled client-side via API)
        const details = await db.collection('trips').findOne({ id: tripId });

        if (!details) {
            return res.status(404).render('errors/404', { title: 'Trip Not Found' });
        }

        // Render EJS view with trip details only
        return res.render('trips/details', {
            title: details.name || 'Trip Details',
            details: details
        });
    } catch (error) {
        console.error('Error rendering trip details page:', error);
        return res.status(500).render('errors/500', { error: error.message });
    }
}

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
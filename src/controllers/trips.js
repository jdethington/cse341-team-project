import { getAllTrips as fetchAllTrips, getTripById as fetchTripById } from '../models/trips.js';

// ==========================================
// 1. API CONTROLLERS (Returns JSON)
// ==========================================

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

// ==========================================
// 2. EJS PAGE CONTROLLERS (Renders Views)
// ==========================================

// Render the trip list page 
export function renderTripList(req, res) {
    try {
        return res.render('trips/list', { title: 'Scenic Train Trips' });
    } catch (error) {
        return res.status(500).render('500', { error: error.message });
    }
}

// Render the trip details page
export async function renderTripDetails(req, res) {
    try {
        const tripId = req.params.id;
        const trip = await fetchTripById(tripId);
        
        if (!trip) {
            return res.status(404).render('404', { message: 'Trip not found' });
        }
        
        return res.render('trips/details', { title: trip.title, trip });
    } catch (error) {
        return res.status(500).render('500', { error: error.message });
    }
}
import mongoose from 'mongoose';
import tripSchema from './schemas/trips.js';

// Bind to the 'trips' collection in MongoDB
const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema, 'trips');

// Get all trips from the database
export async function getAllTrips() {
    try {
        const trips = await Trip.find({});
        return trips;
    } catch (error) {
        throw new Error(`Failed to fetch trips: ${error.message}`);
    }
}

// Get a single trip by its MongoDB _id
export async function getTripById(id) {
    try {
        const trip = await Trip.findOne({ id });
        return trip;
    } catch (error) {
        throw new Error(`Failed to fetch trip with id ${id}: ${error.message}`);
    }
}
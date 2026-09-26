// src/models/schedules.js
import mongoose from 'mongoose';
import Schedule from "./schemas/schedules.js";
import tripSchema from './schemas/trips.js';

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema, 'trips');

export async function getSchedulesByTripId(tripId, month) {
    // 1. IF a month was requested in the query parameter (e.g. ?month=5):
    if (month) {
        const monthNum = Number(month);

        // Look up the trip in the 'trips' collection.
        // match MongoDB's 'id' field against our 'tripId' variable ("alpine-panorama").
        const trip = await Trip.findOne({ id: tripId }).lean();

        // If the trip doesn't exist, OR if month is NOT in its operatingMonths array:
        if (!trip || !trip.operatingMonths?.some(m => Number(m) === monthNum)) {
            // Return an empty list because the trip doesn't run in this month
            return [];
        }
    }

    // 2. Look up the schedules in the 'schedules' collection - 'tripId' variable ("alpine-panorama")
    return Schedule.find({ tripId: tripId }).lean();
}

export async function getAllSchedules() {
    return Schedule.find({}).lean();
}


// Helper function to create a query for finding a schedule by its id
const getScheduleIdQuery = (id) => {
    const value = String(id).trim();
    const numericValue = Number(value);
    const ids = [value];

    if (Number.isInteger(numericValue) && String(numericValue) === value) {
        ids.push(numericValue);
    }

    if (ids.length === 1) {
        return { id: value };
    }

    return { $or: ids.map((scheduleId) => ({ id: scheduleId })) };
};

export async function getScheduleById(id) {
    return Schedule.collection.findOne(getScheduleIdQuery(id));
}

export async function assignScheduleToTrip(scheduleId, tripId) {
    const query = getScheduleIdQuery(scheduleId);
    const result = await Schedule.collection.updateOne(
        query,
        { $set: { tripId: String(tripId) } }
    );

    if (!result.matchedCount) {
        return null;
    }

    return Schedule.collection.findOne(query);
}

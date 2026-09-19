//src/models/schedules.js.
import Schedule from "./schemas/schedules.js";

export async function getScheduleByTripId(tripId, month) {
    // start with the base query matching the tripId
    const query = { tripId };

    // if month is provided, filter by month IF the field exists in the document
    if (month) {
        query.month = month;
    };

    // find all matching schedules and return plain js objects using lean
    return Schedule.find(query).lean();
}

export async function getAllSchedules() {
    return Schedule.find({}).lean();
}
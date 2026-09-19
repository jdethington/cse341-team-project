// src/controllers/schedules.js
import {
    getScheduleByTripId as findScheduleById,
    getAllSchedules as findAllSchedules,
} from "../models/schedules.js"

export async function getSchedulesForTrip(req, res) {
    try {
        const tripId = req.params.id;

        const schedules = await findScheduleById(tripId);

        if (!schedules || schedules.length === 0) {
            return res.status(404).json({
                error: "Schedule not found",
            });
        }

        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            error: "Failed to fetch schedules",
        });
    }
}

export async function getSchedulesForTripAndMonth(req, res) {
    try {
        const tripId = req.params.id;
        const month = req.query.month;

        const schedules = await findScheduleById(tripId, month);

        if (!schedules || schedules.length === 0) {
            return res.status(404).json({
                error: "Schedules not found",
            });
        }

        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            error: "Failed to fetch schedules",
        });
    }
}

export async function getAllSchedules(req, res) {
    try {
        const schedules = await findAllSchedules();

        return res.status(200).json({ schedules });
    } catch (error) {
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            error: "Failed to fetch schedules",
        });
    }
}
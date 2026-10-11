// src/controllers/schedules.js
import {
  getSchedulesByTripId as findSchedulesByTrip,
  getAllSchedules as findAllSchedules,
  getScheduleById as findScheduleById,
} from "../models/schedules.js";

export async function getSchedulesForTrip(req, res) {
  try {
    const tripId = req.params.id;
    const { month } = req.query;
    if (month !== undefined && month !== "") {
      const monthNum = Number(month);
      if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
        return res
          .status(400)
          .json({ error: "month must be an integer from 1 to 12" });
      }
    }
    const schedules = await findSchedulesByTrip(tripId, month);
    // schedules is always an array - return it directly
    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ error: "Failed to fetch schedules" });
  }
}

// formerly I had getSchedulesForTripAndMonth but now I'm doing the assignment a different way and it's a little cleaner
// hopefully that is OK

export async function getAllSchedules(req, res) {
  try {
    const schedules = await findAllSchedules();

    return res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ error: "Failed to fetch schedules" });
  }
}

export async function getScheduleById(req, res) {
  try {
    const { id } = req.params;
    const schedule = await findScheduleById(id);

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
}
import { getAllTrips, getTripById, updateTrip, deleteTrip } from "../models/trips.js";
import { getAllStations } from "../models/stations.js";
import {
  getAllSchedules,
  getScheduleById,
  assignScheduleToTrip,
} from "../models/schedules.js";

const tripFields = [
  "name",
  "region",
  "startStation",
  "endStation",
  "duration",
  "distance",
  "bestSeason",
  "imageUrl",
  "description",
  "highlights",
];

const sanitizeTripData = (body) => {
    const data = {};
    for (const field of tripFields) {
        if (body[field] !== undefined) {
            data[field] = body[field];
        }
    }
    if (data.distance !== undefined && typeof data.distance !== "number") {
        data.distance = Number(data.distance);
    }
    return data;
};

const sanitizeScheduleId = (value) => {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string" && typeof value !== "number") {
        throw new Error("scheduleId must be a string or number");
    }

    const scheduleId = String(value).trim();
    if (!scheduleId) {
        throw new Error("scheduleId is required");
    }

    return scheduleId;
};

// Render the Protected Trip Admin Page
export async function getTripAdminPage(req, res) {
  try {
    const stations = await getAllStations();
    const schedules = await getAllSchedules();

    return res.status(200).render("admin/trips", {
      title: "Manage Trips - Admin",
      stations,
      schedules,
      user: req.session?.user,
    });
  } catch (err) {
    console.error("Error loading trip admin page:", err);
    return res.status(500).render("errors/500", {
      title: "Server Error",
      error: "Failed to load trip admin page",
    });
  }
}

// API: Get all trips
export async function getAllTripsApi(req, res) {
  try {
    const trips = await getAllTrips();
    return res.status(200).json({ trips });
  } catch (err) {
    console.error("Error fetching trips:", err);
    return res.status(500).json({ error: "Failed to retrieve trips" });
  }
}

// API: Update an existing trip by its string id
export async function updateTripController(req, res) {
    try {
        const { id } = req.params;
        const body = req.body ?? {};
        const data = sanitizeTripData(body);
        const scheduleId = sanitizeScheduleId(body.scheduleId);

        if (Object.keys(data).length === 0 && scheduleId === undefined) {
            return res.status(400).json({ error: "No trip fields provided" });
        }

        const existingTrip = await getTripById(id);
        if (!existingTrip) {
            return res.status(404).json({ error: "Trip not found" });
        }

        if (scheduleId !== undefined) {
            const schedule = await getScheduleById(scheduleId);
            if (!schedule) {
                return res.status(400).json({ error: "Schedule not found" });
            }
        }

        const trip = Object.keys(data).length > 0
            ? await updateTrip(id, data)
            : existingTrip;
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }

        if (scheduleId !== undefined) {
            const schedule = await assignScheduleToTrip(scheduleId, id);
            if (!schedule) {
                return res.status(400).json({ error: "Schedule not found" });
            }
        }

        return res.status(200).json({ message: "Trip updated successfully", trip });
    } catch (err) {
        console.error("Error updating trip:", err);
        return res.status(400).json({ error: err.message });
    }
}

// API: Delete a trip by its string id
export async function deleteTripController(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteTrip(id);

    if (!result.deletedCount) {
      return res.status(404).json({ error: "Trip not found" });
    }

    return res.status(200).json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error("Error deleting trip:", err);
    return res.status(500).json({ error: "Failed to delete trip" });
  }
}

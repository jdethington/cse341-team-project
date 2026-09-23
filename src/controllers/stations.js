// src/controllers/stations.js
import {
  getStationById as findStationById,
  getAllStations as findAllStations,
} from "../models/stations.js";

export async function getStationById(req, res) {
  try {
    const { id } = req.params;

    const station = await findStationById(id);

    if (!station) {
      return res.status(404).json({
        error: "Station not found",
      });
    }

    return res.status(200).json(station);
  } catch (error) {
    console.error("Error fetching station:", error);

    return res.status(500).json({
      error: "Failed to fetch station",
    });
  }
}

export async function getAllStations(req, res) {
  try {
    const stations = await findAllStations();

    return res.status(200).json({ stations });
  } catch (error) {
    console.error("Error fetching stations:", error);

    return res.status(500).json({
      error: "Failed to fetch stations",
    });
  }
}

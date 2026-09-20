// src/models/stations.js
import Station from "./schemas/stations.js";

export async function getStationById(id) {
  return Station.findOne({ id }).lean();
}

export async function getAllStations() {
  return Station.find({}).lean();
}
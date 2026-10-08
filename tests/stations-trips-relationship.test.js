import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";

// The relationship is a read-only one: a trip carries startStation and
// endStation station ids, and GET /api/trips/:id/stations resolves those ids
// to full station records. Every test is self-contained and only reads the
// seeded data, so the test database is left untouched.

const TRIP_STATIONS_URL = (tripId) => `/api/trips/${tripId}/stations`;

describe("GET /api/trips/:id/stations", () => {
  test("returns the two stations connected to a known trip", async () => {
    const response = await request(app).get(TRIP_STATIONS_URL("alpine-panorama"));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toHaveProperty("tripId", "alpine-panorama");
    expect(response.body).toHaveProperty("stations");
    expect(response.body.stations).toHaveLength(2);

    const [start, end] = response.body.stations;
    expect(start).toMatchObject({
      id: "nagoya",
      name: "Nagoya Station",
      prefecture: "Aichi",
    });
    expect(end).toMatchObject({
      id: "toyama",
      name: "Toyama Station",
      prefecture: "Toyama",
    });
  });

  test("returns stations in start-then-end order", async () => {
    const response = await request(app).get(TRIP_STATIONS_URL("coastal-breeze"));

    expect(response.status).toBe(200);
    expect(response.body.stations.map((station) => station.id)).toEqual([
      "aomori",
      "akita",
    ]);
  });

  test("returns 404 when the trip does not exist", async () => {
    const response = await request(app).get(TRIP_STATIONS_URL("doesnotexist"));

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "Trip not found");
  });
});

describe("trip-to-station relationship integrity", () => {
  test("resolves both stations for every seeded trip", async () => {
    const listResponse = await request(app).get("/api/trips");

    expect(listResponse.status).toBe(200);
    const trips = listResponse.body.data;
    expect(trips.length).toBeGreaterThan(0);

    for (const trip of trips) {
      const response = await request(app).get(TRIP_STATIONS_URL(trip.id));

      expect(response.status).toBe(200, `expected a 200 for trip ${trip.id}`);
      expect(response.body).toHaveProperty("tripId", trip.id);
      expect(response.body.stations).toHaveLength(2);

      const ids = response.body.stations.map((station) => station.id);
      expect(ids).toContain(trip.startStation);
      expect(ids).toContain(trip.endStation);
    }
  });

  test("references real stations that are not the same station", async () => {
    const listResponse = await request(app).get("/api/trips");

    const trips = listResponse.body.data;

    for (const trip of trips) {
      const response = await request(app).get(TRIP_STATIONS_URL(trip.id));

      expect(response.status).toBe(200, `expected a 200 for trip ${trip.id}`);

      for (const station of response.body.stations) {
        // Each returned station is a full record, resolved to a real id.
        expect(station).toHaveProperty("id");
        expect(station).toHaveProperty("name");
        expect(station).toHaveProperty("prefecture");
      }

      // A trip must not start and end at the same station.
      expect(trip.startStation).not.toBe(trip.endStation);
      const ids = response.body.stations.map((station) => station.id);
      expect(new Set(ids).size).toBe(2);
    }
  });
});

import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";

describe("GET /api/stations", () => {
  test("returns a successful JSON response", async () => {
    const response = await request(app).get("/api/stations");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toHaveProperty("stations");
    expect(response.body.stations).toBeInstanceOf(Array);
  });

  test("returns all 12 stations from the starter data", async () => {
    const response = await request(app).get("/api/stations");

    expect(response.status).toBe(200);
    expect(response.body.stations).toHaveLength(12);
    expect(response.body.stations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "nagoya",
          name: "Nagoya Station",
          prefecture: "Aichi",
        }),
      ]),
    );
  });

  test("returns a station added to the test database", async () => {
    await getDb()
      .collection("stations")
      .insertOne({
        id: "test-station",
        name: "Test Station",
        prefecture: "Test Prefecture",
        region: "central",
        facilities: ["restroom"],
        description: "A station created by the test suite.",
      });

    const response = await request(app).get("/api/stations");

    expect(response.status).toBe(200);
    expect(response.body.stations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "test-station",
          name: "Test Station",
        }),
      ]),
    );
  });

  test("carries the full field set on every station", async () => {
    const response = await request(app).get("/api/stations");

    expect(response.status).toBe(200);
    expect(response.body.stations.length).toBeGreaterThan(0);

    for (const station of response.body.stations) {
      expect(station).toHaveProperty("id");
      expect(station).toHaveProperty("name");
      expect(station).toHaveProperty("prefecture");
      expect(station).toHaveProperty("region");
      expect(station).toHaveProperty("facilities");
      expect(station.facilities).toBeInstanceOf(Array);
      expect(station).toHaveProperty("description");
    }
  });

  test("returns the seeded values for a known station", async () => {
    const response = await request(app).get("/api/stations");

    const nagoya = response.body.stations.find(
      (station) => station.id === "nagoya"
    );

    expect(nagoya).toBeDefined();
    expect(nagoya).toMatchObject({
      id: "nagoya",
      name: "Nagoya Station",
      prefecture: "Aichi",
      region: "central",
      description: "Major transportation hub in central Japan.",
    });
    expect(nagoya.facilities).toEqual(
      expect.arrayContaining(["restaurant", "shop", "restroom"])
    );
  });
});

describe("GET /api/stations/:id", () => {
  test("returns one station by id with the full field set", async () => {
    const response = await request(app).get("/api/stations/nagoya");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toMatchObject({
      id: "nagoya",
      name: "Nagoya Station",
      prefecture: "Aichi",
      region: "central",
      description: "Major transportation hub in central Japan.",
    });
    expect(response.body.facilities).toEqual(
      expect.arrayContaining(["restaurant", "shop", "restroom"])
    );
  });

  test("returns the toyama station by id", async () => {
    const response = await request(app).get("/api/stations/toyama");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: "toyama",
      name: "Toyama Station",
      prefecture: "Toyama",
      region: "central",
    });
    expect(response.body.facilities).toEqual(
      expect.arrayContaining(["restaurant", "restroom"])
    );
  });

  test("returns 404 when the station does not exist", async () => {
    const response = await request(app).get("/api/stations/doesnotexist");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Station not found");
  });
});

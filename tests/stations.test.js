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
    await getDb().collection("stations").insertOne({
      id: "test-station",
      name: "Test Station",
      prefecture: "Test Prefecture",
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
});

describe("GET /api/stations/:id", () => {
  test("returns one station by id", async () => {
    const response = await request(app).get("/api/stations/nagoya");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toMatchObject({
      id: "nagoya",
      name: "Nagoya Station",
      prefecture: "Aichi",
    });
  });

  test("returns 404 when the station does not exist", async () => {
    const response = await request(app).get("/api/stations/doesnotexist");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Station not found");
  });
});

import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";

describe("GET /api/bookings", () => {
  test("returns a successful JSON response", async () => {
    const response = await request(app).get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toHaveProperty("bookings");
    expect(response.body.bookings).toBeInstanceOf(Array);
  });

  test("returns a booking added to the test database", async () => {
    await getDb()
      .collection("bookings")
      .insertOne({
        id: "JRTESTBOOK1",
        createdAt: new Date().toISOString(),
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            phone: "555-0100",
          },
        ],
      });

    const response = await request(app).get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "JRTESTBOOK1",
          ticketClass: "standard",
        }),
      ]),
    );
  });
});

describe("Bookings admin page", () => {
  test("GET /bookings-admin renders the admin shell", async () => {
    const response = await request(app).get("/bookings-admin");

    expect(response.status).toBe(200);
    expect(response.text).toContain("bookings-list");
  });
});

describe("Confirmation page", () => {
  test("returns 404 for an unknown booking id", async () => {
    const response = await request(app).get(
      "/trips/confirmation/DOES-NOT-EXIST",
    );

    expect(response.status).toBe(404);
  });
});

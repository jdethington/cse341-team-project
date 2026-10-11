// Import Vitest functions used to organize tests and verify expected results.
// describe() groups related tests, test() defines an individual test,
// and expect() checks whether the actual result matches the expected result.
import { describe, expect, test } from "vitest";

// Import Supertest so the tests can send HTTP requests to the Express application.
import request from "supertest";

// Import the Express application that the tests will send requests to.
import app from "../app.js";

// Import the database connection function for checking database records directly.
import { getDb } from "../src/db/connect.js";


// Create a reusable function that builds the URL for retrieving a trip's schedules.
// For example, passing "alpine-panorama" returns:
// "/api/trips/alpine-panorama/schedules"
const TRIP_SCHEDULES_URL = (tripId) => `/api/trips/${tripId}/schedules`;

// Group all tests that check the basic behavior of the trip-schedules endpoint.
describe("GET /api/trips/:id/schedules", () => {
  // Verify that requesting a trip with known schedules returns those schedules.
  test("returns the schedules connected to a known trip", async () => {
    // Send a GET request for the schedules belonging to alpine-panorama.
    // await pauses this test until the server responds.
    const response = await request(app).get(
      TRIP_SCHEDULES_URL("alpine-panorama"),
    );

    // Confirm the endpoint responds successfully with HTTP status 200.
    expect(response.status).toBe(200);

    // Confirm the response declares that its content is JSON.
    expect(response.headers["content-type"]).toContain("application/json");

    // Confirm that the response body is an array of schedules.
    expect(response.body).toBeInstanceOf(Array);

    // Confirm that exactly two schedules are returned for this trip.
    expect(response.body).toHaveLength(2);

    // Confirm that the returned array contains both expected schedules.
    // objectContaining() checks the specified properties without requiring
    // every property in each schedule object to be listed here.
    // arrayContaining() checks that both expected objects appear in the array.
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, tripId: "alpine-panorama" }),
        expect.objectContaining({ id: 2, tripId: "alpine-panorama" }),
      ]),
    );
  });

  // Verify that every schedule returned for a trip belongs to that trip.
  test("every returned schedule has the requested tripId", async () => {
    // Request the schedules for romantic-gorge.
    const response = await request(app).get(
      TRIP_SCHEDULES_URL("romantic-gorge"),
    );

    // Confirm that the request succeeded.
    expect(response.status).toBe(200);

    // Confirm that at least one schedule was returned.
    // This prevents the loop below from passing without checking any schedules.
    expect(response.body.length).toBeGreaterThan(0);

    // Loop through every schedule returned by the API.
    for (const schedule of response.body) {
      // Confirm that each schedule's tripId matches the requested trip.
      expect(schedule.tripId).toBe("romantic-gorge");
    }
  });

  // Verify the API's behavior when the requested trip does not exist.
  test("returns an empty array for an unknown trip id", async () => {
    // Request schedules for an ID that should not match any trip.
    const response = await request(app).get(TRIP_SCHEDULES_URL("doesnotexist"));

    // The request itself is valid, so the API is expected to return status 200.
    expect(response.status).toBe(200);

    // Confirm that no schedules are returned for the unknown trip.
    expect(response.body).toEqual([]);
  });
});

// Group tests that verify the optional month query parameter.
describe("month filter on trip schedules", () => {
  // Verify that the API returns schedules when the trip operates in the requested month.
  test("returns schedules for a month the trip operates in", async () => {
    // alpine-panorama operates in August.
    // The month query parameter uses numbers from 1 to 12, so August is 8.
    const response = await request(app)
      .get(TRIP_SCHEDULES_URL("alpine-panorama"))
      .query({ month: 8 });

    // Confirm the request succeeded.
    expect(response.status).toBe(200);

    // Confirm the response contains an array.
    expect(response.body).toBeInstanceOf(Array);

    // Confirm at least one schedule matches the requested month.
    expect(response.body.length).toBeGreaterThan(0);

    // Check that every returned schedule still belongs to alpine-panorama.
    for (const schedule of response.body) {
      expect(schedule.tripId).toBe("alpine-panorama");
    }
  });

  // Verify that a valid month with no schedules produces an empty array.
  test("returns an empty array for a month the trip does not operate in", async () => {
    // alpine-panorama does not operate in February.
    // February is represented by month number 2.
    const response = await request(app)
      .get(TRIP_SCHEDULES_URL("alpine-panorama"))
      .query({ month: 2 });

    // February is a valid month, so the request should not be rejected.
    expect(response.status).toBe(200);

    // Confirm that no schedules match this trip and month.
    expect(response.body).toEqual([]);
  });

  // Verify that the API rejects month numbers outside the valid range of 1–12.
  test("returns 400 when month is outside 1 to 12", async () => {
    // Send a request using month 13, which is invalid.
    const response = await request(app)
      .get(TRIP_SCHEDULES_URL("alpine-panorama"))
      .query({ month: 13 });

    // HTTP 400 indicates that the client supplied an invalid parameter.
    expect(response.status).toBe(400);

    // Confirm that the error response includes an error property.
    expect(response.body).toHaveProperty("error");
  });

  // Verify that the API rejects a month parameter that is not numeric.
  test("returns 400 when month is not a number", async () => {
    // Send "abc" instead of a valid numeric month.
    const response = await request(app)
      .get(TRIP_SCHEDULES_URL("alpine-panorama"))
      .query({ month: "abc" });

    // Confirm that invalid month input produces HTTP 400.
    expect(response.status).toBe(400);
  });
});

// Group tests that verify the relationship between schedules and trips.
// These tests check that schedule references are valid and that API results
// agree with the records stored in the database.
describe("schedule-to-trip relationship integrity", () => {
  // Verify that every schedule references a trip that actually exists.
  test("every schedule points to a real trip document", async () => {
    // Request all trips from the trips API.
    const tripsResponse = await request(app).get("/api/trips");

    // Confirm that the trips request succeeded.
    expect(tripsResponse.status).toBe(200);

    // Extract each trip's ID and place the IDs in a Set.
    // A Set allows efficient checks to determine whether an ID exists.
    // The API response is expected to store the trips in tripsResponse.body.data.
    const tripIds = new Set(tripsResponse.body.data.map((t) => t.id));

    // Request all schedules from the schedules API.
    const schedulesResponse = await request(app).get("/api/schedules");

    // Confirm that the schedules request succeeded.
    expect(schedulesResponse.status).toBe(200);

    // Check every schedule returned by the API.
    for (const schedule of schedulesResponse.body.schedules) {
      // Verify that the schedule's tripId exists in the Set of real trip IDs.
      // If the ID is missing, the assertion fails because the schedule points
      // to a trip that the trips API did not return.
      expect(tripIds.has(schedule.tripId)).toBe(true);
    }
  });

  // Verify that the schedules returned by the API match the database records.
  test("database cross-check: schedules for a trip match the API result", async () => {
    // Choose the trip whose schedules will be checked in both places.
    const tripId = "sakura-valley";

    // Query the MongoDB schedules collection directly.
    // find({ tripId }) selects only records whose tripId matches this value.
    // toArray() converts the database cursor into an array of documents.
    const dbSchedules = await getDb()
      .collection("schedules")
      .find({ tripId })
      .toArray();

    // Request the same trip's schedules through the public API endpoint.
    const response = await request(app).get(TRIP_SCHEDULES_URL(tripId));

    // Confirm that the API request succeeded.
    expect(response.status).toBe(200);

    // Confirm that the API returned the same number of schedules as the database.
    expect(response.body).toHaveLength(dbSchedules.length);

    // Extract the schedule IDs from the API response and sort them.
    // Sorting makes the comparison independent of the order in which records appear.
    const apiIds = response.body.map((s) => s.id).sort();

    // Extract and sort the schedule IDs returned directly from MongoDB.
    const dbIds = dbSchedules.map((s) => s.id).sort();

    // Confirm that both sources contain exactly the same schedule IDs.
    // This checks that the API result agrees with the underlying database records.
    expect(apiIds).toEqual(dbIds);
  });
});

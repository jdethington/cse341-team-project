// Import Vitest functions for grouping tests, defining individual tests,
// and checking whether actual results match expected results.
import { describe, expect, test } from "vitest";

// Import Supertest to send HTTP requests to the Express application during testing.
import request from "supertest";

// Import the Express application that will handle the test requests.
import app from "../app.js";

// Schedules are read-only for this feature set.
// Every test reads the existing seeded data and does not intentionally modify
// the temporary database.

// Store the URL for retrieving all schedules in a reusable constant.
const SCHEDULES_URL = "/api/schedules";

// Create a reusable function that builds the URL for retrieving one schedule.
// For example, passing 1 produces "/api/schedules/1".
const SCHEDULE_BY_ID_URL = (id) => `/api/schedules/${id}`;

// Group tests that check the GET /api/schedules endpoint.
// This endpoint should return the collection of schedules.
describe("GET /api/schedules", () => {
  // Verify that the endpoint returns a successful response containing JSON
  // and that the response includes a schedules array.
  test("returns a successful JSON response with a schedules array", async () => {
    // Send a GET request to retrieve all schedules.
    // await waits for the server to finish processing the request.
    const response = await request(app).get(SCHEDULES_URL);

    // Confirm that the server responded with HTTP 200 (success).
    expect(response.status).toBe(200);

    // Confirm that the response content type indicates JSON data.
    expect(response.headers["content-type"]).toContain("application/json");

    // Confirm that the response body has a property named "schedules".
    expect(response.body).toHaveProperty("schedules");

    // Confirm that the schedules property contains an array.
    expect(response.body.schedules).toBeInstanceOf(Array);
  });

  // Verify that all 14 schedules expected from the seeded test data are returned.
  test("returns all 14 schedules from the seeded data", async () => {
    // Request the complete collection of schedules.
    const response = await request(app).get(SCHEDULES_URL);

    // Confirm that the request succeeded.
    expect(response.status).toBe(200);

    // Confirm that exactly 14 schedules are present in the response.
    // This checks the expected quantity of seeded schedule records.
    expect(response.body.schedules).toHaveLength(14);
  });

  // Verify that a known seeded schedule exists and contains the expected data fields.
  test("includes the known seeded schedule with the expected fields", async () => {
    // Retrieve all schedules from the API.
    const response = await request(app).get(SCHEDULES_URL);

    // Confirm that the API successfully returned the schedules.
    expect(response.status).toBe(200);

    // Search the schedules array for the schedule whose ID is 1.
    // find() returns the first matching schedule object, or undefined
    // if no schedule with that ID exists.
    const sample = response.body.schedules.find((s) => s.id === 1);

    // Confirm that the schedule was found.
    expect(sample).toBeDefined();

    // Confirm that the schedule contains the expected ID, trip relationship,
    // departure time, and arrival time.
    // toMatchObject() checks the specified properties without requiring
    // the entire object to match only these properties.
    expect(sample).toMatchObject({
      id: 1,
      tripId: "alpine-panorama",
      departureTime: "08:30",
      arrivalTime: "13:00",
    });

    // Confirm that daysOfWeek is an array, such as an array of operating days.
    expect(sample.daysOfWeek).toBeInstanceOf(Array);

    // Confirm that month is an array containing the schedule's operating months.
    expect(sample.month).toBeInstanceOf(Array);

    // Confirm that the schedule includes a status property.
    // This checks that the property exists; it does not check its value.
    expect(sample).toHaveProperty("status");
  });
});

// Group tests that check the GET /api/schedules/:id endpoint.
// This endpoint should return a single schedule when given its ID.
describe("GET /api/schedules/:id", () => {
  // Verify that requesting an existing schedule ID returns that schedule.
  test("returns one schedule by its id", async () => {
    // Build the URL for schedule ID 1 and send a GET request.
    const response = await request(app).get(SCHEDULE_BY_ID_URL(1));

    // Confirm that the server successfully returned the schedule.
    expect(response.status).toBe(200);

    // Confirm that the returned content is JSON.
    expect(response.headers["content-type"]).toContain("application/json");

    // Confirm that the response contains the expected schedule details.
    // The test checks the ID, associated trip, departure time, and arrival time.
    expect(response.body).toMatchObject({
      id: 1,
      tripId: "alpine-panorama",
      departureTime: "08:30",
      arrivalTime: "13:00",
    });
  });

  // Verify that requesting a schedule ID that does not exist returns HTTP 404.
  test("returns 404 when the schedule id does not exist", async () => {
    // Request schedule ID 9999, which is expected not to exist in the seeded data.
    const response = await request(app).get(SCHEDULE_BY_ID_URL(9999));

    // Confirm that the API reports "Not Found" with HTTP status 404.
    expect(response.status).toBe(404);

    // Confirm that the error response contains the exact expected message.
    expect(response.body).toHaveProperty("error", "Schedule not found");
  });
});


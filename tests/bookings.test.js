import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";

async function loginAs(identifier, password) {
  const agent = request.agent(app);
  await agent.post("/login").type("form").send({ identifier, password });
  return agent;
}

// START FS3 Task 1: Bookings API — Read tests- #71 ************************
describe("Bookings API read tests", () => {
  test("GET /api/bookings returns 401 when not authenticated", async () => {
    const response = await request(app).get("/api/bookings");
    expect(response.status).toBe(401);
  });

  test("GET /api/bookings returns data for an admin", async () => {
    await getDb().collection("bookings").insertOne({
      id: "ME-MINE",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "John",
          lastName: "Doe",
          email: "customer@example.com",
          phone: "555-0100",
        },
      ],
    });

    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?limit=50");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ME-MINE",
          ticketClass: "standard",
        }),
      ]),
    );
  });

  test("GET /api/bookings limits a customer to their own bookings", async () => {
    await getDb().collection("bookings").insertMany([
      {
        id: "READ-MINE",
        createdAt: new Date().toISOString(),
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Cust",
            lastName: "Omer",
            email: "customer@example.com",
            phone: "555-0100",
          },
        ],
      },
      {
        id: "READ-OTHER",
        createdAt: new Date().toISOString(),
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Other",
            lastName: "Person",
            email: "someone-else@example.com",
            phone: "555-0200",
          },
        ],
      },
    ]);

    const agent = await loginAs("customer", "customer1#");
    const response = await agent.get("/api/bookings?limit=50");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "READ-MINE" }),
      ]),
    );
    expect(response.body.data.every((b) => b.id !== "READ-OTHER")).toBe(true);
  });

  test("GET /api/bookings/me returns 401 when not authenticated", async () => {
    const response = await request(app).get("/api/bookings/me");
    expect(response.status).toBe(401);
  });

  test("GET /api/bookings/me returns the signed-in customer's bookings", async () => {
    await getDb().collection("bookings").insertMany([
      {
        id: "ME-MINE",
        createdAt: new Date().toISOString(),
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Cust",
            lastName: "Omer",
            email: "customer@example.com",
            phone: "555-0100",
          },
        ],
      },
      {
        id: "ME-OTHER",
        createdAt: new Date().toISOString(),
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "premium",
        selectedDay: "tuesday",
        passengers: [
          {
            firstName: "Other",
            lastName: "Person",
            email: "other@example.com",
            phone: "555-0200",
          },
        ],
      },
    ]);

    const agent = await loginAs("customer", "customer1#");
    const response = await agent.get("/api/bookings/me");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ME-MINE" })]),
    );
    expect(response.body.data.every((b) => b.id !== "ME-OTHER")).toBe(true);
  });
});
// END**********************************************************************

// START FS3 Task 2: Bookings API — Write tests- #72 -----------------------
describe("Bookings API write tests", () => {
  test("PUT /api/bookings/:id returns 401 when not authenticated", async () => {
    const response = await request(app)
      .put("/api/bookings/any-id")
      .send({ ticketClass: "premium" });
    expect(response.status).toBe(401);
  });

  test("PUT /api/bookings/:id returns 404 for unknown id", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent
      .put("/api/bookings/unknown-id")
      .send({ ticketClass: "premium" });
    expect(response.status).toBe(404);
  });

  test("PUT /api/bookings/:id allows passenger to update; DB reflects change", async () => {
    await getDb().collection("bookings").insertOne({
      id: "ME-MINE",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "John",
          lastName: "Doe",
          email: "customer@example.com",
          phone: "555-0100",
        },
      ],
    });

    const agent = await loginAs("customer", "customer1#");
    const response = await agent
      .put("/api/bookings/ME-MINE")
      .send({ ticketClass: "premium" });

    expect(response.status).toBe(200);

    const updatedBooking = await getDb().collection("bookings").findOne({ id: "ME-MINE" });

    expect(updatedBooking).toBeTruthy();
    expect(updatedBooking.ticketClass).toBe("premium");
  });

  test("PUT /api/bookings/:id returns 403 for non-owner customer", async () => {
    await getDb().collection("bookings").insertOne({
      id: "ME-OTHER",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          phone: "555-0101",
        },
      ],
    });

    const agent = await loginAs("customer", "customer1#");
    const response = await agent
      .put("/api/bookings/ME-OTHER")
      .send({ ticketClass: "premium" });

    expect(response.status).toBe(403);

    const booking = await getDb().collection("bookings").findOne({ id: "ME-OTHER" });

    expect(booking.ticketClass).toBe("standard");
  });

  test("PUT /api/bookings/:id allows admin to update any booking", async () => {
    await getDb().collection("bookings").insertOne({
      id: "WRITE-PUT-ADMIN",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Any",
          lastName: "One",
          email: "not-admin@example.com",
          phone: "555-0300",
        },
      ],
    });

    const agent = await loginAs("admin", "password1#");
    const response = await agent
      .put("/api/bookings/WRITE-PUT-ADMIN")
      .send({ ticketClass: "first" });

    expect(response.status).toBe(200);

    const inDb = await getDb().collection("bookings").findOne({ id: "WRITE-PUT-ADMIN" });
    expect(inDb.ticketClass).toBe("first");
  });

  test("DELETE /api/bookings/:id returns 401 when not authenticated", async () => {
    const response = await request(app).delete("/api/bookings/any-id");
    expect(response.status).toBe(401);
  });

  test("DELETE /api/bookings/:id returns 404 for unknown id", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.delete("/api/bookings/unknown-id");
    expect(response.status).toBe(404);
  });

  test("DELETE /api/bookings/:id allows passenger to delete; gone from DB", async () => {
    await getDb().collection("bookings").insertOne({
      id: "WRITE-DELETE-PASS",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Any",
          lastName: "One",
          email: "customer@example.com",
          phone: "555-0300",
        },
      ],
    });

    const agent = await loginAs("customer", "customer1#");
    const response = await agent.delete("/api/bookings/WRITE-DELETE-PASS");

    expect(response.status).toBe(200);

    const inDb = await getDb().collection("bookings").findOne({ id: "WRITE-DELETE-PASS" });
    expect(inDb).toBeNull();
  });

  test("DELETE /api/bookings/:id returns 403 for non-owner customer", async () => {
    await getDb().collection("bookings").insertOne({
      id: "WRITE-DELETE-NON-OWNER",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Any",
          lastName: "One",
          email: "not-admin@example.com",
          phone: "555-0300",
        },
      ],
    });

    const agent = await loginAs("customer", "customer1#");
    const response = await agent.delete("/api/bookings/WRITE-DELETE-NON-OWNER");

    expect(response.status).toBe(403);

    const inDb = await getDb().collection("bookings").findOne({ id: "WRITE-DELETE-NON-OWNER" });
    expect(inDb).toBeTruthy();
  });

  test("DELETE /api/bookings/:id allows admin to delete any booking", async () => {
    await getDb().collection("bookings").insertOne({
      id: "WRITE-DEL-ADMIN",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Any",
          lastName: "One",
          email: "not-admin@example.com",
          phone: "555-0300",
        },
      ],
    });

    const agent = await loginAs("admin", "password1#");
    const response = await agent.delete("/api/bookings/WRITE-DEL-ADMIN");

    expect(response.status).toBe(200);

    const inDb = await getDb().collection("bookings").findOne({ id: "WRITE-DEL-ADMIN" });
    expect(inDb).toBeNull();
  });
});
// END----------------------------------------------------------------------

// START FS3 Task 3: Bookings API — Pagination and filtering tests- #72 ====
describe("Bookings API pagination and filtering tests", () => {
  test("returns pagination and at most limit items for admin", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?page=1&limit=10");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("pagination");
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 10 });
    expect(typeof response.body.pagination.totalItems).toBe("number");
    expect(typeof response.body.pagination.totalPages).toBe("number");
    expect(response.body.data.length).toBeLessThanOrEqual(10);
  });

  test("defaults to page 1 when page is omitted", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?limit=10");

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
  });

  test("rejects invalid page with 400", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?page=0&limit=10");

    expect(response.status).toBe(400);
  });

  test("rejects invalid limit with 400", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?page=1&limit=0");

    expect(response.status).toBe(400);
  });

  test("rejects limit above maximum with 400", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?page=1&limit=999");

    expect(response.status).toBe(400);
  });

  test("page 2 returns a different slice when enough data exists", async () => {
    const db = getDb();
    const docs = Array.from({ length: 15 }, (_, i) => ({
      id: `PAGEBOOK${String(i).padStart(2, "0")}`,
      createdAt: new Date(2026, 0, i + 1).toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Page",
          lastName: `User${i}`,
          email: `page${i}@example.com`,
          phone: "555-0100",
        },
      ],
    }));
    await db.collection("bookings").insertMany(docs);

    const agent = await loginAs("admin", "password1#");
    const page1 = await agent.get("/api/bookings?page=1&limit=10");
    const page2 = await agent.get("/api/bookings?page=2&limit=10");

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page2.body.pagination.page).toBe(2);
    expect(page1.body.data).not.toEqual(page2.body.data);
  });

  test("unknown ticketClass returns empty data with valid pagination", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?ticketClass=nonexistent&limit=10");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });

  test("filters by ticketClass (case-insensitive)", async () => {
    await getDb().collection("bookings").insertOne({
      id: "FILTER-TICKET-CLASS",
      createdAt: new Date().toISOString(),
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Ticket",
          lastName: "Class",
          email: "class@example.com",
          phone: "555-0111",
        },
      ],
    });

    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?ticketClass=STANDARD&limit=50");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "FILTER-TICKET-CLASS" }),
      ]),
    );
  });

  test("filters by dateFrom only", async () => {
    await getDb().collection("bookings").insertOne({
      id: "FILTER-DATE-FROM",
      createdAt: "2026-09-12T12:00:00.000Z",
      scheduleId: "1",
      tripId: "alpine-panorama",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "Date",
          lastName: "From",
          email: "datefrom@example.com",
          phone: "555-0122",
        },
      ],
    });

    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?dateFrom=2026-09-10&limit=50");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "FILTER-DATE-FROM" }),
      ]),
    );
    expect(response.body.filters.dateFrom).toBe("2026-09-10");
  });

  test("filters by dateTo only", async () => {
    await getDb().collection("bookings").insertMany([
      {
        id: "DATETO1",
        createdAt: "2026-09-05T10:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          { firstName: "A", lastName: "B", email: "a@ex.com", phone: "1" },
        ],
      },
      {
        id: "DATETO2",
        createdAt: "2026-09-25T10:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          { firstName: "C", lastName: "D", email: "c@ex.com", phone: "1" },
        ],
      },
    ]);

    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?dateTo=2026-09-15&limit=50");

    expect(response.status).toBe(200);
    expect(
      response.body.data.every(
        (b) => new Date(b.createdAt) <= new Date("2026-09-15T23:59:59.999Z"),
      ),
    ).toBe(true);
    expect(response.body.filters.dateTo).toBe("2026-09-15");
  });

  test("filters by date range (inclusive)", async () => {
    await getDb().collection("bookings").insertMany([
      {
        id: "RANGE1",
        createdAt: "2026-09-01T12:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Range",
            lastName: "Before",
            email: "range1@example.com",
            phone: "555-0133",
          },
        ],
      },
      {
        id: "RANGE2",
        createdAt: "2026-09-15T12:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Range",
            lastName: "Inside",
            email: "range2@example.com",
            phone: "555-0134",
          },
        ],
      },
      {
        id: "RANGE3",
        createdAt: "2026-09-21T12:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "standard",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Range",
            lastName: "After",
            email: "range3@example.com",
            phone: "555-0135",
          },
        ],
      },
    ]);

    const agent = await loginAs("admin", "password1#");
    const response = await agent.get(
      "/api/bookings?dateFrom=2026-09-10&dateTo=2026-09-20&limit=50",
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("filters");
    expect(response.body.filters).toHaveProperty("dateFrom", "2026-09-10");
    expect(response.body.filters).toHaveProperty("dateTo", "2026-09-20");
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "RANGE2" }),
      ]),
    );
    expect(response.body.data.every((b) => b.id !== "RANGE1")).toBe(true);
    expect(response.body.data.every((b) => b.id !== "RANGE3")).toBe(true);
  });

  test("rejects inverted date range with 400", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get(
      "/api/bookings?dateFrom=2026-09-30&dateTo=2026-09-01",
    );

    expect(response.status).toBe(400);
  });

  test("rejects invalid dateFrom with 400", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?dateFrom=not-a-date");

    expect(response.status).toBe(400);
  });

  test("rejects invalid dateTo with 400", async () => {
    const agent = await loginAs("admin", "password1#");
    const response = await agent.get("/api/bookings?dateTo=2026-13-40");

    expect(response.status).toBe(400);
  });

  test("combines ticketClass and date range filters", async () => {
    await getDb().collection("bookings").insertMany([
      {
        id: "FILTER-MINE",
        createdAt: "2026-09-15T12:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Cust",
            lastName: "Omer",
            email: "customer@example.com",
            phone: "555-0100",
          },
        ],
      },
      {
        id: "FILTER-OTHER",
        createdAt: "2026-09-15T12:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Other",
            lastName: "Person",
            email: "someone-else@example.com",
            phone: "555-0200",
          },
        ],
      },
    ]);

    const agent = await loginAs("customer", "customer1#");
    const response = await agent.get(
      "/api/bookings?ticketClass=premium&dateFrom=2026-09-01&dateTo=2026-09-30&limit=50",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "FILTER-MINE" }),
      ]),
    );
    expect(response.body.data.every((b) => b.id !== "FILTER-OTHER")).toBe(true);
  });

  test("customer only sees their own bookings when filters are applied", async () => {
    await getDb().collection("bookings").insertMany([
      {
        id: "FILTER-OWN-MINE",
        createdAt: "2026-09-15T12:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Cust",
            lastName: "Omer",
            email: "customer@example.com",
            phone: "555-0100",
          },
        ],
      },
      {
        id: "FILTER-OWN-OTHER",
        createdAt: "2026-09-15T12:00:00.000Z",
        scheduleId: "1",
        tripId: "alpine-panorama",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
          {
            firstName: "Other",
            lastName: "Person",
            email: "someone-else@example.com",
            phone: "555-0200",
          },
        ],
      },
    ]);

    const agent = await loginAs("customer", "customer1#");
    const response = await agent.get(
      "/api/bookings?ticketClass=premium&dateFrom=2026-09-01&dateTo=2026-09-30&limit=50",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "FILTER-OWN-MINE" }),
      ]),
    );
    expect(response.body.data.every((b) => b.id !== "FILTER-OWN-OTHER")).toBe(true);
  });
});
// END======================================================================

describe("Bookings admin page", () => {
  test("redirects to login when not authenticated", async () => {
    const response = await request(app).get("/bookings-admin");
    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/login/i);
  });

  test("renders the admin shell when signed in", async () => {
    const agent = await loginAs("customer", "customer1#");
    const response = await agent.get("/bookings-admin");
    expect(response.status).toBe(200);
    expect(response.text).toContain("bookings-list");
  });
});

describe("Confirmation page", () => {
  test("returns 404 for an unknown booking id", async () => {
    const response = await request(app).get("/trips/confirmation/DOES-NOT-EXIST");
    expect(response.status).toBe(404);
  });
});

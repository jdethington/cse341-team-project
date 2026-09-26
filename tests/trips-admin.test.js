import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";

const login = async (identifier, password) => {
    const agent = request.agent(app);
    const response = await agent.post("/login").send({ identifier, password });
    expect(response.status).toBe(302);
    return agent;
};

describe("Trip admin page authorization", () => {
    test("redirects signed-out users to login", async () => {
        const response = await request(app).get("/admin/trips");

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/login");
    });

    test("returns a forbidden page for customers", async () => {
        const agent = await login("customer", "customer1#");
        const response = await agent.get("/admin/trips");

        expect(response.status).toBe(403);
        expect(response.text).toContain("Forbidden");
    });

    test("renders the trip administration page for admins", async () => {
        const agent = await login("admin", "password1#");
        const response = await agent.get("/admin/trips");

        expect(response.status).toBe(200);
        expect(response.text).toContain("trip-table-body");
        expect(response.text).toContain("admin-trips-data");
        expect(response.text).toContain("No schedule change");
    });
});

describe("Trip admin API authorization", () => {
    test("keeps the public trip list available", async () => {
        const response = await request(app).get("/api/trips");

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.some((trip) => trip.id === "alpine-panorama")).toBe(true);
    });

    test("rejects signed-out trip updates", async () => {
        const response = await request(app)
            .put("/api/trips/alpine-panorama")
            .send({ name: "Blocked Update" });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored.name).toBe("Alpine Panorama Express");
    });

    test("rejects signed-out trip deletes", async () => {
        const response = await request(app).delete("/api/trips/alpine-panorama");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored).not.toBeNull();
    });

    test("rejects customer trip updates", async () => {
        const agent = await login("customer", "customer1#");
        const response = await agent
            .put("/api/trips/alpine-panorama")
            .send({ name: "Blocked Update" });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Forbidden");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored.name).toBe("Alpine Panorama Express");
    });

    test("rejects customer trip deletes", async () => {
        const agent = await login("customer", "customer1#");
        const response = await agent.delete("/api/trips/alpine-panorama");

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Forbidden");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored).not.toBeNull();
    });
});

describe("Trip admin CRUD", () => {
    test("updates a trip and assigns an existing schedule through Schedule.tripId", async () => {
        const agent = await login("admin", "password1#");
        const response = await agent
            .put("/api/trips/alpine-panorama")
            .send({
                name: "Updated Panorama",
                startStation: "nagoya",
                endStation: "aomori",
                scheduleId: 3
            });

        expect(response.status).toBe(200);
        expect(response.body.trip.name).toBe("Updated Panorama");
        expect(response.body.trip.endStation).toBe("aomori");

        const storedTrip = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        const assignedSchedule = await getDb().collection("schedules").findOne({ id: 3 });
        expect(storedTrip.name).toBe("Updated Panorama");
        expect(assignedSchedule.tripId).toBe("alpine-panorama");
        expect(storedTrip.scheduleId).toBeUndefined();
    });

    test("does not change schedules when no schedule is selected", async () => {
        const agent = await login("admin", "password1#");
        const before = await getDb().collection("schedules").findOne({ id: 2 });
        const response = await agent
            .put("/api/trips/alpine-panorama")
            .send({ name: "Panorama Renamed" });

        expect(response.status).toBe(200);
        const after = await getDb().collection("schedules").findOne({ id: 2 });
        expect(after.tripId).toBe(before.tripId);
    });

    test("rejects an unknown schedule without changing the trip", async () => {
        const agent = await login("admin", "password1#");
        const response = await agent
            .put("/api/trips/alpine-panorama")
            .send({ name: "Should Not Save", scheduleId: 9999 });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Schedule not found");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored.name).toBe("Alpine Panorama Express");
    });

    test("returns 404 when updating an unknown trip", async () => {
        const agent = await login("admin", "password1#");
        const response = await agent
            .put("/api/trips/DOES-NOT-EXIST")
            .send({ name: "Nope" });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Trip not found");
    });

    test("deletes a trip by its string id", async () => {
        const agent = await login("admin", "password1#");
        const response = await agent.delete("/api/trips/alpine-panorama");

        expect(response.status).toBe(200);
        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored).toBeNull();
    });

    test("returns 404 when deleting an unknown trip", async () => {
        const agent = await login("admin", "password1#");
        const response = await agent.delete("/api/trips/DOES-NOT-EXIST");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Trip not found");
    });
});
describe("Admin dashboard navigation", () => {
    test("links admins to the trip administration page", async () => {
        const agent = await login("admin", "password1#");
        const response = await agent.get("/admin/dashboard");

        expect(response.status).toBe(200);
        expect(response.text).toContain('href="/admin/trips"');
    });
});

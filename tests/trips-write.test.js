import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";

const loginUser = async (identifier, password) => {
    const agent = request.agent(app);
    const response = await agent.post("/login").send({ identifier, password });
    expect(response.status).toBe(302);
    return agent;
};

describe("PUT /api/trips/:id", () => {
    test("rejects signed-out trip updates", async () => {
        const response = await request(app)
            .put("/api/trips/alpine-panorama")
            .send({ name: "Blocked Update" });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored.name).toBe("Alpine Panorama Express");
    });

    test("rejects customer trip updates", async () => {
        const agent = await loginUser("customer", "customer1#");
        const response = await agent
            .put("/api/trips/alpine-panorama")
            .send({ name: "Blocked Update" });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Forbidden");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored.name).toBe("Alpine Panorama Express");
    });

    test("updates a trip as an admin and saves the change", async () => {
        const agent = await loginUser("admin", "password1#");
        const response = await agent
            .put("/api/trips/alpine-panorama")
            .send({ name: "Renamed Panorama", endStation: "aomori" });

        expect(response.status).toBe(200);
        expect(response.body.trip.name).toBe("Renamed Panorama");
        expect(response.body.trip.endStation).toBe("aomori");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored.name).toBe("Renamed Panorama");
        expect(stored.endStation).toBe("aomori");
    });

    test("returns 404 when updating an unknown trip", async () => {
        const agent = await loginUser("admin", "password1#");
        const response = await agent
            .put("/api/trips/DOES-NOT-EXIST")
            .send({ name: "Nope" });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Trip not found");
    });
});

describe("DELETE /api/trips/:id", () => {
    test("rejects signed-out trip deletes", async () => {
        const response = await request(app).delete("/api/trips/alpine-panorama");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Authentication required");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored).not.toBeNull();
    });

    test("rejects customer trip deletes", async () => {
        const agent = await loginUser("customer", "customer1#");
        const response = await agent.delete("/api/trips/alpine-panorama");

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Forbidden");

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored).not.toBeNull();
    });

    test("deletes a trip as an admin and removes it from the database", async () => {
        const agent = await loginUser("admin", "password1#");
        const response = await agent.delete("/api/trips/alpine-panorama");

        expect(response.status).toBe(200);

        const stored = await getDb().collection("trips").findOne({ id: "alpine-panorama" });
        expect(stored).toBeNull();

        const remaining = await getDb().collection("trips").findOne({ id: "coastal-breeze" });
        expect(remaining).not.toBeNull();
    });

    test("returns 404 when deleting an unknown trip", async () => {
        const agent = await loginUser("admin", "password1#");
        const response = await agent.delete("/api/trips/DOES-NOT-EXIST");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Trip not found");
    });
});

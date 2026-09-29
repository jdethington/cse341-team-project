import { describe, expect, test, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createUser } from "../src/models/auth.js";
import Role from "../src/models/schemas/roles.js";

let sessionCookie;

beforeAll(async () => {
    // The test database is empty - we need to create roles and a user first

    // Create the roles that the schema expects
    await Role.create({ name: "customer" });
    await Role.create({ name: "admin" });

    // Create an admin user
    // Note: createUser always assigns customer role
    // so we need to update the role after creation
    const adminRole = await Role.findOne({ name: "admin" });
    await createUser("Test Admin", "testadmin", "admin@test.com", "password123");

    // Update to admin role
    const User = (await import("../src/models/schemas/users.js")).default;
    await User.findOneAndUpdate(
        { username: "testadmin" },
        { role: adminRole._id }
    );

    // Now log in
    const loginResponse = await request(app)
        .post("/login")
        .send({
            identifier: "testadmin",
            password: "password123"
        });

    // Debug - let's see what we got back
    console.log("Login status:", loginResponse.status);
    console.log("Login headers:", loginResponse.headers["set-cookie"]);

    sessionCookie = loginResponse.headers["set-cookie"];
});

describe("GET /api/users", () => {
    test("returns 401 when not authenticated", async () => {
        const response = await request(app).get("/api/users");
        expect(response.status).toBe(401);
    });

    test("returns users when authenticated as admin", async () => {
        const response = await request(app)
            .get("/api/users")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });
});

describe("PATCH /api/users/:id", () => {
    test("returns 401 when not authenticated", async () => {
        const response = await request(app)
            .patch("/api/users/someid")
            .send({ name: "New Name" });

        expect(response.status).toBe(401);
    });

    test("returns 404 for non-existent user", async () => {
        const response = await request(app)
            .patch("/api/users/000000000000000000000000")
            .set("Cookie", sessionCookie)
            .send({ name: "New Name" });

        expect(response.status).toBe(404);
    });
});

describe("DELETE /api/users/:id", () => {
    test("returns 401 when not authenticated", async () => {
        const response = await request(app)
            .delete("/api/users/someid");

        expect(response.status).toBe(401);
    });

    test("returns 404 for non-existent user", async () => {
        const response = await request(app)
            .delete("/api/users/000000000000000000000000")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(404);
    });
});

describe("GET /users/admin page", () => {
    test("redirects to login when not authenticated", async () => {
        const response = await request(app).get("/users/admin");
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/login");
    });

    test("returns 200 when authenticated", async () => {
        const response = await request(app)
            .get("/users/admin")
            .set("Cookie", sessionCookie);

        expect(response.status).toBe(200);
    });
});
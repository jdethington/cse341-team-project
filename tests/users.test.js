// Write tests: Test the existing user creation or registration behavior and the API operations that update and delete users.
// Verify authorized and unauthorized behavior, response status codes, and the resulting records in the temporary database.
import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";
import mongoose from "mongoose";

async function loginAs(identifier, password) {
    const agent = request.agent(app);
    await agent.post("/login").type("form").send({ identifier, password });
    return agent;
}

describe("Users API write tests", () => {
    // PATCH tests
    test("PATCH /api/users/:id returns 401 when not authenticated", async () => {
        const response = await request(app)
            .patch("/api/users/000000000000000000000000")
            .send({ name: "New Name" });
        expect(response.status).toBe(401);
    });

    test("PATCH /api/users/:id returns 404 for non-existent user", async () => {
        const agent = await loginAs("admin", "password1#");
        const response = await agent
            .patch("/api/users/000000000000000000000000")
            .send({ name: "New Name" });
        expect(response.status).toBe(404);
    });

    test("PATCH /api/users/:id allows admin to update any user; DB reflects change", async () => {
        // get the customer user's id from the seeded data
        const db = getDb();
        const customer = await db.collection("users").findOne({ username: "customer" });

        const agent = await loginAs("admin", "password1#");
        const response = await agent
            .patch(`/api/users/${customer._id}`)
            .send({ name: "Updated By Admin" });

        expect(response.status).toBe(200);

        // verify the change actually happened in the database
        const updated = await db.collection("users").findOne({ username: "customer" });
        expect(updated.name).toBe("Updated By Admin");
    });

    test("PATCH /api/users/:id allows customer to update themselves; DB reflects change", async () => {
        const db = getDb();
        // get the customer's id from the seeded data
        const customer = await db.collection("users").findOne({ username: "customer" });

        const agent = await loginAs("customer", "customer1#");
        const response = await agent
            .patch(`/api/users/${customer._id}`)
            .send({ name: "Updated By Self" });

        expect(response.status).toBe(200);

        const updated = await db.collection("users").findOne({ username: "customer" });
        expect(updated.name).toBe("Updated By Self");
    });

    test("PATCH /api/users/:id returns 403 when customer updates another user; DB unchanged", async () => {
        const db = getDb();
        // get the admin user's id
        const admin = await db.collection("users").findOne({ username: "admin" });

        const agent = await loginAs("customer", "customer1#");
        const response = await agent
            .patch(`/api/users/${admin._id}`)
            .send({ name: "Hacked!" });

        expect(response.status).toBe(403);

        // verify the admin's name was NOT changed
        const unchanged = await db.collection("users").findOne({ username: "admin" });
        expect(unchanged.name).toBe("Admin");
    });

    describe("Users API delete tests", () => {
        // DELETE tests
        test("DELETE /api/users/:id returns 401 when not authenticated", async () => {
            const response = await request(app)
                .delete("/api/users/000000000000000000000000")
            expect(response.status).toBe(401);
        });

        test("DELETE /api/users/:id returns 404 for non-existent user", async () => {
            const agent = await loginAs("admin", "password1#");
            const response = await agent
                .delete("/api/users/000000000000000000000000");
            expect(response.status).toBe(404);
        });

        test("DELETE /api/users/:id allows admin to delete any user; DB reflects change", async () => {
            // get the customer user's id from the seeded data
            const db = getDb();
            const customer = await db.collection("users").findOne({ username: "customer" });

            const agent = await loginAs("admin", "password1#");
            const response = await agent
                .delete(`/api/users/${customer._id}`);

            expect(response.status).toBe(200);

            // verify the change actually happened in the database
            const updated = await db.collection("users").findOne({ username: "customer" });
            expect(updated).toBeNull();
        });

        test("DELETE /api/users/:id allows customer to delete themselves; DB reflects change", async () => {
            const db = getDb();
            // get the customer's id from the seeded data
            const customer = await db.collection("users").findOne({ username: "customer" });

            const agent = await loginAs("customer", "customer1#");
            const response = await agent
                .delete(`/api/users/${customer._id}`);

            expect(response.status).toBe(200);

            // verify the change actually happened in the database
            const updated = await db.collection("users").findOne({ username: "customer" });
            expect(updated).toBeNull();
        });

        test("DELETE /api/users/:id returns 403 when customer deletes another user; DB unchanged", async () => {
            const db = getDb();
            // get the admin user's id
            const admin = await db.collection("users").findOne({ username: "admin" });

            const agent = await loginAs("customer", "customer1#");
            const response = await agent
                .delete(`/api/users/${admin._id}`);

            expect(response.status).toBe(403);

            // verify the admin was NOT deleted
            const unchanged = await db.collection("users").findOne({ username: "admin" });
            expect(unchanged).not.toBeNull();
        });
    });

    describe("User registration tests", () => {
        test("POST /register creates a new user", async () => {
            const response = await request(app)
                .post("/register")
                .type("form")
                .send({
                    name: "New User",
                    username: "newuser",
                    email: "newuser@example.com",
                    password: "password123",
                    confirmPassword: "password123",
                });

            // registration redirects on success
            expect(response.status).toBe(302);

            // verify user exists in database
            const db = getDb();
            const user = await db.collection("users")
                .findOne({ username: "newuser" });
            expect(user).not.toBeNull();
            expect(user.username).toBe("newuser");
            expect(user).not.toHaveProperty("password");
        });

        test("POST /register rejects duplicate username", async () => {
            const response = await request(app)
                .post("/register")
                .type("form")
                .send({
                    name: "Another Admin",
                    username: "admin",
                    email: "other@example.com",
                    password: "password123",
                    confirmPassword: "password123",
                });

            expect(response.status).toBe(400);
        });

        test("POST /register rejects mismatched passwords", async () => {
            const response = await request(app)
                .post("/register")
                .type("form")
                .send({
                    name: "Test User",
                    username: "testuser",
                    email: "test@example.com",
                    password: "password123",
                    confirmPassword: "different123",
                });

            expect(response.status).toBe(400);
        });
    });
});
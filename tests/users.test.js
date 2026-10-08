import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";

async function loginAs(identifier, password) {
    const agent = request.agent(app);
    await agent.post("/login").type("form").send({ identifier, password });
    return agent;
}

// Read tests: Test the endpoint that returns users
describe("Users API read tests", () => {
    test("returns 401 when not authenticated", async () => {
        const response = await request(app).get("/api/users");
        expect(response.status).toBe(401);
    });

    test("returns users when authenticated as admin", async () => {
        const agent = await loginAs("admin", "password1#");
        const response = await agent.get("/api/users");
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toBeInstanceOf(Array);

        // verify no sensitive data fields are exposed
        response.body.data.forEach(user => {
            expect(user).not.toHaveProperty("password");
            expect(user).not.toHaveProperty("passwordHash");
        });
    });

    test("limits user to their own data when authenticated as a customer", async () => {
        const agent = await loginAs("customer", "customer1#");
        const response = await agent.get("/api/users");
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].username).toBe("customer");

        // verify sensitive fields not exposed
        expect(response.body[0]).not.toHaveProperty("passwordHash");
        expect(response.body[0]).not.toHaveProperty("password");
    });
});

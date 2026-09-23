//src/models/auth.js
import bcrypt from "bcrypt";
import Role from "./schemas/roles.js";
import User from "./schemas/users.js";

// Creates a new user with the customer role (assigned on the server, never from the request).
export async function createUser(name, username, email, password) {
    const customer = await Role.findOne({ name: "customer" });
    if (!customer) {
        throw new Error("Default role not found");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
        name,
        username,
        email,
        passwordHash,
        role: customer._id,
    });

    return user._id.toString();
}

// Finds a user by username or email, including their role.
export async function findUser(identifier) {
    return User.findOne({ $or: [{ username: identifier }, { email: identifier }] }).populate("role");
}

// Compares a supplied password with a stored hash.
export async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

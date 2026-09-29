// src/models/users.js
import User from "./schemas/users.js";

// update a user by their ID (used for account updates).
export async function updateUser(id, updates) {
    // only allow safe fields to be changed (never paswordHash or role)
    const allowedUpdates = {};
    if (updates.name) allowedUpdates.name = updates.name.trim();
    if (updates.username) allowedUpdates.username = updates.username.trim().toLowerCase();
    if (updates.email) allowedUpdates.email = updates.email.trim().toLowerCase();

    return User.findByIdAndUpdate(
        id,
        { $set: allowedUpdates },
        { returnDocument: 'after', runValidators: true } // returnDocument: 'after' returns the updated document, runValidators ensures schema validation even though this is an update
    ).populate("role").lean();             // populate gets the role from the Role collection instead of just the ObjectId
}

// delete a user by their ID 
export async function deleteUserById(id) {
    return User.findByIdAndDelete(id);
}

// Finds all users by their ID, including their role.
export async function getAllUsers() {
    return User.find({}).populate("role").lean();
}

// Finds a single user by their ID, including their role.
export async function getUserById(id) {
    return User.findById(id).populate("role").lean();
}
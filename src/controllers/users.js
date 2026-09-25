// src/controllers/users.js
import {
    updateUser,
    deleteUserById,
    getAllUsers,
    getUserById
} from "../models/users.js";

// Renders the user admin page
// - Admins can view all users
// - Regular users can only view themselves
export const userAdminPage = async (req, res, next) => {
    try {
        const currentUser = req.user;
        let users;

        // authorization check - if admin, get all users; if regular user, get only themselves
        if (currentUser.role !== "admin") {
            users = await getAllUsers();
        } else {
            const user = await getUserById(currentUser.id);
            users = user ? [user] : [];
        }

        return res.render("users/admin", {
            title: "User Administation",
            users,
            currentUser
        });
    } catch (error) {
        return next(error);
    }
};

// API: Returns all users (admin) or just the current user (customer)
export async function getUsers(req, res, next) {
    try {
        const currentUser = req.user;
        let users;

        if (currentUser.role === "admin") {
            users = await getAllUsers();
        } else {
            const user = await getUserById(currentUser.id);
            users = user ? [user] : [];
        }

        return res.status(200).json(users);
    } catch (error) {
        return next(error);
    }
};

// API: Updates a user by ID
// - Admins can update any user
// - Regular users can only update themselves
export async function updateUserById(req, res, next) {
    try {
        const currentUser = req.user;
        const targetId = req.params.id;

        // authorization check
        if (currentUser.role !== "admin" && currentUser.id !== targetId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // update the user
        const updated = await updateUser(targetId, req.body);

        if (!updated) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(updated);
    } catch (error) {
        return next(error);
    }
}

// API: Deletes a user by ID
// - Admins can delete any user
// - Regular users can only delete themselves   
export async function deleteUserById(req, res, next) {
    try {
        const currentUser = req.user;
        const targetId = req.params.id;

        // authorization check
        if (currentUser.role !== "admin" && currentUser.id !== targetId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // delete the user
        const deleted = await deleteUserById(targetId);

        if (!deleted) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return next(error);
    }
}

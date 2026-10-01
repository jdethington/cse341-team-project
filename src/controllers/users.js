// src/controllers/users.js
import {
    updateUser,
    deleteUserById,
    getUserById,
    getPaginatedUsers
} from "../models/users.js";

// Renders the user admin page
export const userAdminPage = async (req, res, next) => {
    try {
        return res.render("users/admin", {
            title: "User Administration",
            users: [],
            currentUser: req.user
        });
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
export async function deleteUser(req, res, next) {
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

// API: Returns all users (admin) or just the current user (customer)
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const allowedSortFields = ['username', 'name', 'email'];

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) return null;
    return parsed;
};

export async function getUsers(req, res, next) {
    try {
        const currentUser = req.user;
        // console.log('getUsers called, role:', currentUser.role); // for troubleshooting
        // console.log('query params:', req.query);


        // customers always get only their own record — no pagination needed
        if (currentUser.role !== "admin") {
            // console.log('returning customer view');
            const user = await getUserById(currentUser.id);
            const users = user ? [user] : [];
            return res.status(200).json(users);
        }
        // console.log('returning admin paginated view');       // for troubleshooting
        // admin gets paginated list of all users
        const errors = [];

        const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
        const requestedLimit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);

        if (page === null) {
            errors.push({
                field: 'page',
                message: 'page must be a whole number of 1 or greater.'
            });
        }

        if (requestedLimit === null) {
            errors.push({
                field: 'limit',
                message: 'limit must be a number between 1 and 50.'
            });
        } else if (requestedLimit > MAX_LIMIT) {
            errors.push({
                field: 'limit',
                message: 'limit must be a number between 1 and 50.'
            });
        }

        if (req.query.sort && !allowedSortFields.includes(req.query.sort)) {
            errors.push({
                field: 'sort',
                message: `sort must be one of: ${allowedSortFields.join(', ')}.`
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const limit = requestedLimit;
        const sort = req.query.sort || 'username';
        const order = req.query.order === 'desc' ? -1 : 1;

        const { users, totalItems } = await getPaginatedUsers({
            filter: {},
            page,
            limit,
            sort,
            order,
        });

        const totalPages = Math.ceil(totalItems / limit);

        if (page > totalPages && totalPages > 0) {
            return res.status(404).json({
                error: `Page ${page} does not exist. The last page is ${totalPages}.`,
            });
        }

        return res.status(200).json({
            data: users,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page * limit < totalItems,
                hasPreviousPage: page > 1,
            },
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
}
import { Router } from "express";
import {
    userAdminPage,
    getUsers,
    updateUserById,
    deleteUser,
} from "../controllers/users.js";
import {
    requireApiLogin,
    requirePageLogin,
} from "../middleware/auth.js";

const router = Router();
/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6ab13aac590626137e2cdfea"
 *         name:
 *           type: string
 *           example: "Pam Christison"
 *         username:
 *           type: string
 *           example: "pamchristison"
 *         email:
 *           type: string
 *           example: "pam@example.com"
 *         role:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "admin"
 */
/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List users
 *     description: >
 *       Returns all users for admins, or only the signed-in user's
 *       own record for customers.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: User list returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/api/users", requireApiLogin, getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user
 *     description: >
 *       Admins can update any user. Customers can only update
 *       their own record. Updatable fields are name, username,
 *       and email only.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden — cannot update another user's record
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete a user
 *     description: >
 *       Admins can delete any user. Customers can only delete
 *       their own record.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB ObjectId
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden — cannot delete another user's record
 *       404:
 *         description: User not found
 */
// API routes - require login
router.patch("/api/users/:id", requireApiLogin, updateUserById);
router.delete("/api/users/:id", requireApiLogin, deleteUser);

// Page routes (EJS responses for the browser)
router.get("/users/admin", requirePageLogin, userAdminPage);

export default router;
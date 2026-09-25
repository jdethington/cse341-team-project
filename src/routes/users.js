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

// API routes - require login
router.get("/api/users", requireApiLogin, getUsers);
router.patch("/api/users/:id", requireApiLogin, updateUserById);
router.delete("/api/users/:id", requireApiLogin, deleteUser);

// Page routes (EJS responses for the browser)
router.get("/users/admin", requirePageLogin, userAdminPage);

export default router;
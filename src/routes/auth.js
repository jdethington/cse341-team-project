//src/routes/auth.js
// Foundation routes that prove the auth guards work, plus the visible
// register/login/logout flow and the admin dashboard. They are intentionally
// left in place: the session/user API is also how other feature sets can tell
// who is signed in.
import { Router } from "express";
import {
    getSessionUser,
    adminApiAccess,
    accountPage,
    accountAdminPage,
    registerPage,
    processRegistration,
    loginPage,
    processLogin,
    processLogout,
    adminDashboard,
} from "../controllers/auth.js";
import {
    requireApiLogin,
    requireApiRole,
    requirePageLogin,
    requirePageRole,
} from "../middleware/auth.js";

const router = Router();

// API routes (JSON responses for client-side JavaScript)
router.get("/api/me", requireApiLogin, getSessionUser);
router.get("/api/admin-check", requireApiRole("admin"), adminApiAccess);

// Register / login pages and handlers (the visible auth flow)
router.get("/register", registerPage);
router.post("/register", processRegistration);
router.get("/login", loginPage);
router.post("/login", processLogin);
router.post("/logout", requirePageLogin, processLogout);

// Admin dashboard (signed in + admin role)
router.get("/admin/dashboard", requirePageLogin, requirePageRole("admin"), adminDashboard);

// Page routes (EJS responses for the browser)
router.get("/account", requirePageLogin, accountPage);
router.get("/account-admin", requirePageRole("admin"), accountAdminPage);

export default router;

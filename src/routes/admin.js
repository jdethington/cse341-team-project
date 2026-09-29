import { Router } from "express";
import { bookingsAdminPage } from "../controllers/bookings.js";
import { requirePageLogin } from "../middleware/auth.js";

const router = Router();

router.get("/bookings-admin", requirePageLogin, bookingsAdminPage);

export default router;

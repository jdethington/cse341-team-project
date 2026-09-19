import { Router } from "express";
import { bookingsAdminPage } from "../controllers/bookings.js";

const router = Router();

router.get("/bookings-admin", bookingsAdminPage);

export default router;

import { Router } from "express";
import { bookingsAdminPage } from "../controllers/bookings.js";

const router = Router();

router.get("/bookings", bookingsAdminPage);

export default router;

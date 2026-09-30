import { Router } from "express";
import {
  getTripAdminPage,
  updateTripController,
  deleteTripController,
} from "../controllers/tripController.js";
import {
  requirePageLogin,
  requirePageRole,
  requireApiLogin,
  requireApiRole,
} from "../middleware/auth.js";

const router = Router();

// Protected Page Route: Admin only
router.get(
  "/admin/trips",
  requirePageLogin,
  requirePageRole("admin"),
  getTripAdminPage,
);

// Protected API Routes (GET /api/trips stays public in api-routes.js)
router.put(
  "/api/trips/:id",
  requireApiLogin,
  requireApiRole("admin"),
  updateTripController,
);
router.delete(
  "/api/trips/:id",
  requireApiLogin,
  requireApiRole("admin"),
  deleteTripController,
);

export default router;

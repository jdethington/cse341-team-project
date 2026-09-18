import swaggerUi from "swagger-ui-express";
import apiRoutes from "./api-routes.js";
import openapi from "../docs/openapi.js";
import railTripsRouter from "./trips.js";
import {
  trainsPage,
  getTrainById,
  getAllTrains,
} from "./trains.js";
import { Router } from "express";
import { homePage, aboutPage, testErrorPage } from "./index.js";

const router = Router();

// Home page
router.get("/", homePage);

// About page
router.get("/about", aboutPage);

// Trains page
router.get("/trains", trainsPage);

// Trains API
router.get("/api/trains", getAllTrains);
router.get("/api/trains/:id", getTrainById);

// JSON API endpoints
router.use("/", apiRoutes);

// Interactive API documentation (Swagger UI)
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Rail trips
router.use("/trips", railTripsRouter);

// Test 500 error page
router.get("/500", testErrorPage);

export default router;

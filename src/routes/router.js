import railTripsRouter from "./trips.js";
import {
  trainsPage,
  getTrainById,
  getAllTrains,
} from "./trains.js";
import { Router } from "express";
import { homePage, aboutPage, testErrorPage } from "./index.js";
import { renderTripDetails } from "../controllers/trips.js";

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

// Trip Details page (e.g., /trips/alpine-panorama)
router.get("/trips/:id", renderTripDetails);

// Rail trips
router.use("/trips", railTripsRouter);

// Test 500 error page
router.get("/500", testErrorPage);

export default router;

//src/models/schemas/schedules.js.
import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        tripId: {
            type: String,
            required: true,
            trim: true,
        },
        departureTime: {
            type: String,
            required: true,
            trim: true,
        },
        arrivalTime: {
            type: String,
            required: true,
            trim: true,
        },
        daysOfWeek: {
            type: [String],
            default: [],
        },
        status: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    },
);

const Schedule = mongoose.model("Schedule", scheduleSchema, "schedules");

export default Schedule;
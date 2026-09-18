//src/models/schemas/ticket-classes.js
import mongoose from "mongoose";

const ticketClassSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerKm: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    availableDays: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const TicketClass = mongoose.model("TicketClass", ticketClassSchema, "ticketClasses");

export default TicketClass;

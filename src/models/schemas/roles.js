//src/models/schemas/roles.js
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ["customer", "admin"],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Role = mongoose.model("Role", roleSchema);

export default Role;

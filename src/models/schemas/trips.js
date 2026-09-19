import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  id: { type: String },
    title: { type: String, required: true },
    region: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    duration: { type: Number, required: true },
    distance: { type: Number, required: true },
    season: { type: String, required: true },
    description: { type: String },
    highlights: { type: [String] }
});

export default tripSchema;
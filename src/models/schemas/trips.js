import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  region: { type: String, required: true },
  startStation: { type: String, required: true },
  endStation: { type: String, required: true },
  duration: { type: String, required: true },
  distance: { type: Number, required: true },
  bestSeason: { type: String, required: true },
  operatingMonths: { type: [Number] },
  imageUrl: { type: String },
  description: { type: String },
  highlights: { type: [String] }
});

export default tripSchema;
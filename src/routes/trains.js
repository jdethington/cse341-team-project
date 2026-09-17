import { getTrainById, getAllTrains } from "../controllers/trains.js";

const trainsPage = (req, res) => {
  res.render("trains", { title: "Trains" });
};

export {
  trainsPage,
  getTrainById,
  getAllTrains,
};

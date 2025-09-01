const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  question: {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    hints: [{ type: String, required: true }],
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
  },
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Game", gameSchema);
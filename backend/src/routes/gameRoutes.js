const express = require("express");
const router = express.Router();
const GameController = require("../controllers/gameController");
const authMiddleware = require("../middleware/authMiddleware"); // Chemin correct

router.use(authMiddleware); // Appliquer le middleware à toutes les routes

router.get("/start", GameController.startGame);
router.post("/submit", GameController.submitAnswer);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
   getUserRewards,
   convertRewards,
   deleteReward,
   editReward  // ← Ajout de editReward dans les imports
} = require("../controllers/rewardController");

// GET /api/rewards?userId=<userId>
router.get("/", getUserRewards);

// POST /api/rewards/convert
router.post("/convert", convertRewards);

// DELETE /api/rewards/delete/:rewardId
router.delete("/delete/:rewardId", deleteReward);

// PUT /api/rewards/edit/:rewardId - ← Ajout de la route manquante
router.put("/edit/:rewardId", editReward);

module.exports = router;
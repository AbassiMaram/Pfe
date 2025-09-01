const mongoose = require('mongoose');
const Reward = require("../models/Reward");

// GET /api/rewards?userId=<userId>
const getUserRewards = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "UserId is required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format"
      });
    }

    const rewards = await Reward.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rewards,
      count: rewards.length
    });
  } catch (error) {
    console.error("Error fetching user rewards:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// POST /api/rewards/convert
const convertRewards = async (req, res) => {
  try {
    const { rewardId, userId } = req.body;

    if (!rewardId || !userId) {
      return res.status(400).json({
        success: false,
        message: "RewardId and userId are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(rewardId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const reward = await Reward.findById(rewardId);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found"
      });
    }

    if (reward.userId && reward.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to convert this reward"
      });
    }

    if (reward.claimed) {
      return res.status(400).json({
        success: false,
        message: "Reward already claimed"
      });
    }

    const now = new Date();
    if (now > reward.endDate) {
      return res.status(400).json({
        success: false,
        message: "Reward has expired"
      });
    }

    reward.claimed = true;
    reward.userId = userId;
    
    await reward.save();

    res.status(200).json({
      success: true,
      message: "Reward converted successfully",
      data: reward
    });
  } catch (error) {
    console.error("Error converting reward:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// DELETE /api/rewards/delete/:rewardId
const deleteReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const merchantId = req.user?.merchantId || req.body.merchantId || req.query.merchantId || req.headers['merchant-id'];
    const userId = req.body.userId || req.query.userId;

    if (!rewardId) {
      return res.status(400).json({
        success: false,
        message: "RewardId is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(rewardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rewardId format"
      });
    }

    const reward = await Reward.findById(rewardId);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found"
      });
    }

    const canDelete = (
      (userId && reward.userId && reward.userId.toString() === userId) ||
      (merchantId && reward.merchantId.toString() === merchantId.toString())
    );

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this reward"
      });
    }

    await Reward.findByIdAndDelete(rewardId);

    res.status(200).json({
      success: true,
      message: "Reward deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting reward:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// PUT /api/rewards/edit/:rewardId
const editReward = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid reward ID format" 
      });
    }

    const existingReward = await Reward.findById(id);
    if (!existingReward) {
      return res.status(404).json({ 
        success: false,
        message: "Reward not found" 
      });
    }

    // Validation des permissions
    const merchantId = req.user?.merchantId || req.body.merchantId;
    if (merchantId && existingReward.merchantId.toString() !== merchantId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to edit this reward" 
      });
    }

    const updatedFields = {
      ...updateData,
      // Protection contre la modification de certains champs
      userId: existingReward.userId,
      merchantId: existingReward.merchantId
    };

    // Gestion des dates
    if (updateData.startDate) updatedFields.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updatedFields.endDate = new Date(updateData.endDate);

    const updatedReward = await Reward.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Reward updated successfully",
      data: updatedReward
    });
  } catch (error) {
    console.error("Error updating reward:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// GET /api/rewards/merchant/:merchantId
const getMerchantRewards = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { type, activeOnly } = req.query;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "MerchantId is required"
      });
    }

    const query = { merchantId };
    
    if (type) {
      query.type = type;
    }
    
    if (activeOnly === 'true') {
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    const rewards = await Reward.find(query)
      .sort({ createdAt: -1 })
      .populate('productIds')
      .populate('items.productId');

    res.status(200).json({
      success: true,
      data: rewards,
      count: rewards.length
    });
  } catch (error) {
    console.error("Error fetching merchant rewards:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// POST /api/rewards/create
const createReward = async (req, res) => {
  try {
    const { merchantId, type, startDate, endDate } = req.body;

    if (!merchantId || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Required fields: merchantId, type, startDate, endDate"
      });
    }

    // Validation des dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    // Validation spécifique au type
    if (type === "promotion" && (!req.body.productIds || !req.body.discountValue)) {
      return res.status(400).json({
        success: false,
        message: "For promotions, productIds and discountValue are required"
      });
    }

    if (type === "specialOffer" && !req.body.specialOffer) {
      return res.status(400).json({
        success: false,
        message: "For special offers, specialOffer details are required"
      });
    }

    if (type === "customOffer" && (!req.body.customOffer.title || !req.body.customOffer.description)) {
      return res.status(400).json({
        success: false,
        message: "For custom offers, title and description are required"
      });
    }

    const reward = new Reward(req.body);
    await reward.save();

    res.status(201).json({
      success: true,
      message: "Reward created successfully",
      data: reward
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// GET /api/rewards/:rewardId
const getRewardById = async (req, res) => {
  try {
    const { rewardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rewardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reward ID format"
      });
    }

    const reward = await Reward.findById(rewardId)
      .populate('productIds')
      .populate('items.productId')
      .populate('userId');

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found"
      });
    }

    res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    console.error("Error fetching reward:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getUserRewards,
  convertRewards,
  deleteReward,
  editReward,
  getMerchantRewards,
  createReward,
  getRewardById
};
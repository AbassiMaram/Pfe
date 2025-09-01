const mongoose = require('mongoose');
const mongooseAutopopulate = require('mongoose-autopopulate');

const rewardSchema = new mongoose.Schema({
  merchantId: { type: String, required: true },
  type: {
    type: String,
    enum: ["promotion", "specialOffer", "seasonal_liquidation", "customOffer"],
    required: true,
  },
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: function () { return this.type === "promotion"; },
    autopopulate: { select: 'name price imageUrl' }
  }],
  discountValue: {
    type: Number,
    required: function () { return this.type === "promotion"; }
  },
  discountValues: [{
    type: Number,
    required: function () { return this.type === "promotion" && this.productIds.length > 1; }
  }],
  specialOffer: {
    type: {
      type: String,
      enum: ["multiplicationPoints", "buyOneGetOne", "custom"],
      required: function () { return this.type === "specialOffer"; },
    },
    multiplier: {
      type: Number,
      default: 2,
      required: function () {
        return this.type === "specialOffer" && this.specialOffer.type === "multiplicationPoints";
      }
    },
    buyProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.type === "specialOffer" && this.specialOffer.type === "buyOneGetOne";
      },
      autopopulate: { select: 'name price' }
    },
    customDescription: { type: String, default: null },
    getProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.type === "specialOffer" && this.specialOffer.type === "buyOneGetOne";
      },
      autopopulate: { select: 'name price' }
    },
    minPoints: { type: Number, default: 0 },
    description: { type: String },
  },
  customOffer: {
    title: { 
      type: String, 
      required: function () { return this.type === "customOffer"; }
    },
    description: { 
      type: String, 
      required: function () { return this.type === "customOffer"; }
    },
    terms: { type: String },
    minPoints: { type: Number, default: 0 },
    maxRedemptions: { type: Number, default: null },
    currentRedemptions: { type: Number, default: 0 }
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  items: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true,
      autopopulate: { select: 'name price imageUrl category' }
    },
    quantity: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discount: { type: Number, required: true },
    category: { type: String, required: true },
    discountedPrice: { type: Number, required: true },
  }],
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false,
    autopopulate: { select: 'name email' }
  },
  points: { type: Number, default: 0, required: false },
  history: {
    type: [
      {
        orderId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Order",
          autopopulate: { select: 'orderNumber totalAmount status' }
        },
        pointsEarned: { type: Number },
        date: { type: Date, default: Date.now },
      },
    ],
    default: [],
    required: false,
  },
  claimed: { type: Boolean, default: false },
}, {
  timestamps: true,
  strictPopulate: false
});

rewardSchema.plugin(mongooseAutopopulate);

module.exports = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);
const mongoose = require('mongoose');

// Schéma pour les articles échangeables
const redemptionItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
        maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
    },
    pointsRequired: {
        type: Number,
        required: [true, 'Le nombre de points requis est obligatoire'],
        min: [1, 'Le nombre de points doit être au moins 1']
    },
    category: {
        type: String,
        required: [true, 'La catégorie est requise'],
        enum: {
            values: ['FOOD_DRINK', 'MERCHANDISE', 'SERVICES', 'EXPERIENCES', 'GIFT_CARDS'],
            message: 'Catégorie invalide'
        }
    },
    imageUrl: {
        type: String,
        default: null,
        validate: {
            validator: function(v) {
                return v === null || /^(http|https):\/\/[^ "]+$/.test(v);
            },
            message: 'URL d\'image invalide'
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    maxRedemptions: {
        type: Number,
        default: null,
        min: [1, 'Le nombre maximum de récompenses doit être au moins 1']
    },
    currentRedemptions: {
        type: Number,
        default: 0,
        min: [0, 'Le nombre de récompenses actuelles ne peut pas être négatif']
    },
    expiryDate: {
        type: Date,
        default: null,
        validate: {
            validator: function(v) {
                return v === null || v > Date.now();
            },
            message: 'La date d\'expiration doit être dans le futur'
        }
    },
    termsAndConditions: {
        type: String,
        default: null,
        maxlength: [1000, 'Les conditions générales ne peuvent pas dépasser 1000 caractères']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Schéma pour les échanges de points
const pointExchangeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'ID utilisateur est requis'],
        index: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RedemptionItem',
        required: [true, 'L\'ID article est requis']
    },
    pointsUsed: {
        type: Number,
        required: [true, 'Le nombre de points utilisés est requis'],
        min: [1, 'Le nombre de points utilisés doit être au moins 1']
    },
    status: {
        type: String,
        required: [true, 'Le statut est requis'],
        enum: {
            values: ['PENDING', 'CONFIRMED', 'REDEEMED', 'EXPIRED', 'CANCELLED'],
            message: 'Statut invalide'
        },
        default: 'CONFIRMED'
    },
    redemptionCode: {
        type: String,
        required: [true, 'Le code de rachat est requis'],
        unique: true,
        uppercase: true,
        match: [/^[A-Z0-9]{8}$/, 'Code de rachat invalide']
    },
    exchangeDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: [true, 'La date d\'expiration est requise'],
        validate: {
            validator: function(v) {
                return v > Date.now();
            },
            message: 'La date d\'expiration doit être dans le futur'
        }
    },
    redeemedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: null,
        maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index pour optimiser les requêtes fréquentes
pointExchangeSchema.index({ userId: 1, status: 1 });
// Suppression de l'index en double sur redemptionCode (déjà défini dans le schéma avec unique: true)
pointExchangeSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

// Méthodes statiques pour le modèle RedemptionItem
redemptionItemSchema.statics.getAvailableItems = function() {
    return this.find({
        isAvailable: true,
        $or: [
            { maxRedemptions: null },
            { $expr: { $lt: ['$currentRedemptions', '$maxRedemptions'] } }
        ],
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    }).sort({ pointsRequired: 1 });
};

redemptionItemSchema.methods.canBeRedeemed = function() {
    if (!this.isAvailable) return false;
    if (this.expiryDate && this.expiryDate < new Date()) return false;
    if (this.maxRedemptions && this.currentRedemptions >= this.maxRedemptions) return false;
    return true;
};

// Méthodes statiques pour le modèle PointExchange
pointExchangeSchema.statics.getUserExchanges = function(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    return this.find({ userId })
        .populate('itemId', 'title pointsRequired imageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

pointExchangeSchema.statics.getExchangeStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $group: {
            _id: null,
            totalExchanges: { $sum: 1 },
            totalPointsUsed: { $sum: '$pointsUsed' },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
            confirmed: { $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] } },
            redeemed: { $sum: { $cond: [{ $eq: ['$status', 'REDEEMED'] }, 1, 0] } }
        }}
    ]);
    
    return stats[0] || {
        totalExchanges: 0,
        totalPointsUsed: 0,
        pending: 0,
        confirmed: 0,
        redeemed: 0
    };
};

// Méthodes d'instance
pointExchangeSchema.methods.generateRedemptionCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

pointExchangeSchema.methods.markAsRedeemed = async function(notes = null) {
    this.status = 'REDEEMED';
    this.redeemedAt = new Date();
    if (notes) this.notes = notes;
    return this.save();
};

pointExchangeSchema.methods.isExpired = function() {
    return this.expiryDate < new Date();
};

pointExchangeSchema.methods.isValid = function() {
    return this.status === 'CONFIRMED' && !this.isExpired();
};

// Middleware pour générer le code de rachat automatiquement
pointExchangeSchema.pre('save', function(next) {
    if (this.isNew && !this.redemptionCode) {
        this.redemptionCode = this.generateRedemptionCode();
    }
    next();
});

// Middleware pour définir la date d'expiration
pointExchangeSchema.pre('save', function(next) {
    if (this.isNew && !this.expiryDate) {
        this.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours
    }
    next();
});

// Middleware pour mettre à jour le statut si expiré
pointExchangeSchema.pre('find', function() {
    this.updateMany(
        { status: 'CONFIRMED', expiryDate: { $lt: new Date() } },
        { $set: { status: 'EXPIRED' } }
    ).exec();
});

const RedemptionItem = mongoose.model('RedemptionItem', redemptionItemSchema);
const PointExchange = mongoose.model('PointExchange', pointExchangeSchema);

module.exports = {
    RedemptionItem,
    PointExchange
};
const { RedemptionItem, PointExchange } = require('../models/PointRedemption');
const User = require('../models/User');
const mongoose = require('mongoose');

const pointExchangeController = {
    getAvailableItems: async (req, res) => {
        try {
            const items = await RedemptionItem.getAvailableItems();
            res.json({
                success: true,
                data: items,
                total: items.length
            });
        } catch (error) {
            console.error('Erreur getAvailableItems:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des articles',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    createRedemptionItem: async (req, res) => {
        try {
            const { title, description, pointsRequired, category } = req.body;
            
            if (!title || !description || !pointsRequired || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les champs obligatoires doivent être fournis'
                });
            }

            const newItem = new RedemptionItem({
                title,
                description,
                pointsRequired,
                category,
                imageUrl: req.body.imageUrl || null,
                maxRedemptions: req.body.maxRedemptions || null,
                expiryDate: req.body.expiryDate || null,
                termsAndConditions: req.body.termsAndConditions || null
            });

            await newItem.save();

            res.status(201).json({
                success: true,
                message: 'Article créé avec succès',
                data: newItem
            });
        } catch (error) {
            console.error('Erreur createRedemptionItem:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'article',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    exchangePoints: async (req, res) => {
        try {
            const { userId, itemId } = req.body;

            if (!userId || !itemId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID utilisateur et ID article requis'
                });
            }

            // Vérifier l'utilisateur et l'article
            const [user, item] = await Promise.all([
                User.findById(userId),
                RedemptionItem.findById(itemId)
            ]);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Article non trouvé'
                });
            }

            if (!item.canBeRedeemed()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cet article n\'est plus disponible à l\'échange'
                });
            }

            // Vérifier si l'utilisateur a assez de points
            if (user.loyaltyPoints < item.pointsRequired) {
                return res.status(400).json({
                    success: false,
                    message: 'Points insuffisants'
                });
            }

            // Générer un code de rachat (8 caractères alphanumériques)
            const generateRedemptionCode = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let code = '';
                for (let i = 0; i < 8; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return code;
            };

            // Créer l'échange avec tous les champs requis
            const exchange = new PointExchange({
                userId,
                itemId,
                pointsUsed: item.pointsRequired,
                status: 'CONFIRMED',
                redemptionCode: generateRedemptionCode(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expire dans 30 jours
            });

            // Mettre à jour les points de l'utilisateur
            user.loyaltyPoints -= item.pointsRequired;
            await user.save();

            // Mettre à jour le compteur de l'article
            item.currentRedemptions += 1;
            await item.save();

            // Populer itemId avec tous les champs nécessaires
            await exchange.populate('itemId', 'title pointsRequired imageUrl description category');

            res.json({
                success: true,
                message: 'Échange effectué avec succès!',
                data: exchange,
                remainingPoints: user.loyaltyPoints // Ajouter les points restants
            });

        } catch (error) {
            console.error('Erreur exchangePoints:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'échange',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },


    getUserExchangeHistory: async (req, res) => {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID utilisateur invalide'
                });
            }

            const [exchanges, stats, total] = await Promise.all([
                PointExchange.getUserExchanges(userId, page, limit),
                PointExchange.getExchangeStats(userId),
                PointExchange.countDocuments({ userId })
            ]);
            
            res.json({
                success: true,
                data: {
                    exchanges,
                    stats,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalExchanges: total
                    }
                }
            });
        } catch (error) {
            console.error('Erreur getUserExchangeHistory:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'historique',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getExchangeDetails: async (req, res) => {
        try {
            const { exchangeId } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(exchangeId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID échange invalide'
                });
            }

            const exchange = await PointExchange.findById(exchangeId)
                .populate('itemId', 'title pointsRequired imageUrl category')
                .populate('userId', 'name email');
            
            if (!exchange) {
                return res.status(404).json({
                    success: false,
                    message: 'Échange non trouvé'
                });
            }

            res.json({
                success: true,
                data: exchange
            });
        } catch (error) {
            console.error('Erreur getExchangeDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des détails',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    validateRedemptionCode: async (req, res) => {
        try {
            const { redemptionCode } = req.params;
            
            const exchange = await PointExchange.findOne({ redemptionCode })
                .populate('itemId', 'title pointsRequired imageUrl');
            
            if (!exchange) {
                return res.status(404).json({
                    success: false,
                    message: 'Code de rachat invalide'
                });
            }

            if (exchange.status === 'REDEEMED') {
                return res.status(400).json({
                    success: false,
                    message: 'Ce code a déjà été utilisé'
                });
            }

            if (exchange.isExpired()) {
                exchange.status = 'EXPIRED';
                await exchange.save();
                
                return res.status(400).json({
                    success: false,
                    message: 'Ce code a expiré'
                });
            }

            res.json({
                success: true,
                message: 'Code valide',
                data: exchange
            });
        } catch (error) {
            console.error('Erreur validateRedemptionCode:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la validation du code',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    redeemExchange: async (req, res) => {
        try {
            const { exchangeId } = req.params;
            const { notes } = req.body;
            
            const exchange = await PointExchange.findById(exchangeId);
            
            if (!exchange) {
                return res.status(404).json({
                    success: false,
                    message: 'Échange non trouvé'
                });
            }

            if (exchange.status === 'REDEEMED') {
                return res.status(400).json({
                    success: false,
                    message: 'Cet échange a déjà été utilisé'
                });
            }

            if (exchange.isExpired()) {
                exchange.status = 'EXPIRED';
                await exchange.save();
                
                return res.status(400).json({
                    success: false,
                    message: 'Cet échange a expiré'
                });
            }

            exchange.status = 'REDEEMED';
            exchange.redeemedAt = new Date();
            if (notes) exchange.notes = notes;
            
            await exchange.save();
            await exchange.populate('itemId', 'title pointsRequired imageUrl');

            res.json({
                success: true,
                message: 'Échange marqué comme utilisé avec succès',
                data: exchange
            });
        } catch (error) {
            console.error('Erreur redeemExchange:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la validation de l\'échange',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    cancelExchange: async (req, res) => {
        try {
            const { exchangeId } = req.params;
            const { reason } = req.body;
            
            const exchange = await PointExchange.findById(exchangeId);
            
            if (!exchange) {
                return res.status(404).json({
                    success: false,
                    message: 'Échange non trouvé'
                });
            }

            if (exchange.status === 'REDEEMED') {
                return res.status(400).json({
                    success: false,
                    message: 'Impossible d\'annuler un échange déjà utilisé'
                });
            }

            if (exchange.status === 'CANCELLED') {
                return res.status(400).json({
                    success: false,
                    message: 'Cet échange a déjà été annulé'
                });
            }

            // Rembourser les points à l'utilisateur
            const user = await User.findById(exchange.userId);
            if (user) {
                user.loyaltyPoints = (user.loyaltyPoints || 0) + exchange.pointsUsed;
                await user.save();
            }

            // Décrémenter le compteur de l'article
            const item = await RedemptionItem.findById(exchange.itemId);
            if (item) {
                item.currentRedemptions = Math.max(0, item.currentRedemptions - 1);
                await item.save();
            }

            // Marquer comme annulé
            exchange.status = 'CANCELLED';
            if (reason) exchange.notes = reason;
            await exchange.save();

            await exchange.populate('itemId', 'title pointsRequired imageUrl');

            res.json({
                success: true,
                message: 'Échange annulé avec succès',
                data: {
                    exchange,
                    refundedPoints: exchange.pointsUsed
                }
            });
        } catch (error) {
            console.error('Erreur cancelExchange:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'annulation',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = pointExchangeController;
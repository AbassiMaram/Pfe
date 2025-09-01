const express = require('express');
const router = express.Router();
const pointExchangeController = require('../controllers/pointExchangeController');

// Middleware de validation (optionnel)
const { body, param, query, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Erreurs de validation',
            errors: errors.array()
        });
    }
    next();
};

// Routes pour les articles échangeables

/**
 * GET /api/exchange/items
 * Récupérer tous les articles disponibles pour l'échange
 */
router.get('/items', pointExchangeController.getAvailableItems);

/**

// Routes pour les échanges

/**
 * POST /api/exchange
 * Échanger des points contre un article
 */
router.post('/', 
    [
        body('userId').notEmpty().withMessage('ID utilisateur requis'),
        body('itemId').notEmpty().withMessage('ID article requis')
    ],
    handleValidationErrors,
    pointExchangeController.exchangePoints
);

/**
 * GET /api/exchange/history/:userId
 * Récupérer l'historique des échanges d'un utilisateur
 */
router.get('/history/:userId',
    [
        param('userId').notEmpty().withMessage('ID utilisateur requis'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100')
    ],
    handleValidationErrors,
    pointExchangeController.getUserExchangeHistory
);

/**
 * GET /api/exchange/:exchangeId
 * Récupérer les détails d'un échange spécifique
 */
router.get('/:exchangeId',
    param('exchangeId').isMongoId().withMessage('ID échange invalide'),
    handleValidationErrors,
    pointExchangeController.getExchangeDetails
);

// Routes pour la validation des codes

/**
 * GET /api/exchange/validate/:redemptionCode
 * Valider un code de rachat
 */
router.get('/validate/:redemptionCode',
    param('redemptionCode').isLength({ min: 8, max: 8 }).withMessage('Code de rachat invalide'),
    handleValidationErrors,
    pointExchangeController.validateRedemptionCode
);

/**
 * PUT /api/exchange/:exchangeId/redeem
 * Marquer un échange comme utilisé
 */
router.put('/:exchangeId/redeem',
    [
        param('exchangeId').isMongoId().withMessage('ID échange invalide'),
        body('notes').optional().isString().withMessage('Notes doivent être une chaîne')
    ],
    handleValidationErrors,
    pointExchangeController.redeemExchange
);

/**
 * PUT /api/exchange/:exchangeId/cancel
 * Annuler un échange
 */
router.put('/:exchangeId/cancel',
    [
        param('exchangeId').isMongoId().withMessage('ID échange invalide'),
        body('reason').optional().isString().withMessage('Raison doit être une chaîne')
    ],
    handleValidationErrors,
    pointExchangeController.cancelExchange
);

// Routes administratives (optionnel)

/**
 * GET /api/exchange/admin/stats
 * Statistiques des échanges (pour les administrateurs)
 */
router.get('/admin/stats', async (req, res) => {
    try {
        const { PointExchange, RedemptionItem } = require('../models/PointRedemption');
        
        // Statistiques générales
        const totalExchanges = await PointExchange.countDocuments();
        const totalPointsUsed = await PointExchange.aggregate([
            { $group: { _id: null, total: { $sum: '$pointsUsed' } } }
        ]);
        
        const activeExchanges = await PointExchange.countDocuments({ 
            status: 'CONFIRMED' 
        });
        
        const redeemedExchanges = await PointExchange.countDocuments({ 
            status: 'REDEEMED' 
        });
        
        // Articles les plus populaires
        const popularItems = await PointExchange.aggregate([
            { $match: { status: { $in: ['CONFIRMED', 'REDEEMED'] } } },
            { $group: { 
                _id: '$itemId', 
                count: { $sum: 1 },
                totalPoints: { $sum: '$pointsUsed' }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'redemptionitems',
                localField: '_id',
                foreignField: '_id',
                as: 'item'
            }},
            { $unwind: '$item' }
        ]);
        
        res.json({
            success: true,
            data: {
                totalExchanges,
                totalPointsUsed: totalPointsUsed[0]?.total || 0,
                activeExchanges,
                redeemedExchanges,
                popularItems
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

// Middleware de gestion d'erreurs pour les routes
router.use((error, req, res, next) => {
    console.error('Erreur dans les routes d\'échange:', error);
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errors: Object.values(error.errors).map(e => e.message)
        });
    }
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID invalide'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
});


router.post('/items', 
    [
        body('title').notEmpty().withMessage('Titre requis'),
        body('description').notEmpty().withMessage('Description requise'),
        body('pointsRequired').isInt({ min: 1 }).withMessage('Points doivent être un entier positif'),
        body('category').isIn(['FOOD_DRINK', 'MERCHANDISE', 'SERVICES', 'EXPERIENCES', 'GIFT_CARDS']).withMessage('Catégorie invalide')
    ],
    handleValidationErrors,
    pointExchangeController.createRedemptionItem
);
module.exports = router;
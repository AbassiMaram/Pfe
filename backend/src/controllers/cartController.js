const mongoose = require("mongoose");
const Cart = require("../models/cart");

// Ajouter un produit au panier
exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        // Validation des données fournies
        if (!userId || !productId || typeof quantity !== "number" || quantity <= 0) {
            return res.status(400).json({
                message: "Données manquantes ou incorrectes (userId, productId, quantity > 0)."
            });
        }

        // Vérifiez si les ID sont valides
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "ID utilisateur invalide." });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "ID produit invalide." });
        }

        console.log("Validation des IDs réussie :", { userId, productId });

        // Convertir les ID en ObjectId avec "new"
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const productObjectId = new mongoose.Types.ObjectId(productId);

        // Récupérer ou créer le panier
        let cart = await Cart.findOne({ userId: userObjectId });
        if (!cart) {
            console.log(`Création d'un nouveau panier pour l'utilisateur ${userId}`);
            cart = new Cart({ userId: userObjectId, items: [] });
        }

        // Vérifier si le produit existe déjà dans le panier
        const existingItem = cart.items.find(item => item.productId.equals(productObjectId));
        if (existingItem) {
            console.log(`Produit ${productId} déjà présent dans le panier. Mise à jour de la quantité.`);
            existingItem.quantity += quantity; // Mettre à jour la quantité
        } else {
            console.log(`Ajout du produit ${productId} au panier avec la quantité ${quantity}.`);
            cart.items.push({ productId: productObjectId, quantity });
        }

        // Sauvegarder le panier mis à jour
        try {
            await cart.save();
        } catch (saveError) {
            console.error("Erreur lors de la sauvegarde du panier :", saveError);
            return res.status(500).json({
                message: "Erreur lors de la sauvegarde du panier.",
                details: saveError.message
            });
        }

        res.status(200).json({
            status: "success",
            message: "Produit ajouté au panier avec succès.",
            data: { cart }
        });
    } catch (error) {
        console.error("Erreur dans addToCart :", error);
        res.status(500).json({
            error: "Erreur interne lors de l'ajout au panier.",
            details: error.message
        });
    }
};


// Récupérer le panier
exports.getCart = async (req, res) => {
    try {
        const userId = req.query.userId; // Changement de req.params à req.query

        console.log("Requête getCart reçue avec userId:", userId); // Log pour débogage

        // Vérifiez si userId est fourni et valide
        if (!userId) {
            console.warn("userId manquant dans la requête");
            return res.status(400).json({ message: "userId manquant dans la requête." });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.warn("userId invalide:", userId);
            return res.status(400).json({ message: "ID utilisateur invalide." });
        }

        // Convertir userId en ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        console.log("userId converti en ObjectId:", userObjectId);

        // Récupérer le panier
        const cart = await Cart.findOne({ userId: userObjectId }).populate("items.productId");

        if (!cart || cart.items.length === 0) {
            console.log("Panier vide ou inexistant pour userId:", userId);
            return res.status(200).json({ message: "Le panier est vide.", items: [] });
        }

        console.log("Panier récupéré avec succès:", cart);
        res.status(200).json({ cart });
    } catch (error) {
        console.error("Erreur dans getCart:", error.message, error.stack); // Log détaillé avec stack trace
        res.status(500).json({
            error: "Erreur interne lors de la récupération du panier.",
            details: error.message
        });
    }
};


// Supprimer un produit du panier
exports.removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Vérifiez que les données nécessaires sont fournies
        if (!userId || !productId) {
            return res.status(400).json({ message: "Données manquantes (userId, productId)." });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "ID utilisateur ou produit invalide." });
        }

        // Récupérer le panier de l'utilisateur
        const cart = await Cart.findOne({ userId: mongoose.Types.ObjectId(userId) });
        if (!cart) {
            return res.status(404).json({ message: "Panier introuvable pour cet utilisateur." });
        }

        // Supprimer l'article du panier
        cart.items = cart.items.filter(item => !item.productId.equals(mongoose.Types.ObjectId(productId)));

        // Supprimer le panier s'il est vide
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({ message: "Produit retiré. Panier vide désormais." });
        }

        // Sauvegarder le panier mis à jour
        await cart.save();
        res.status(200).json({
            message: "Produit retiré du panier avec succès.",
            cart
        });
    } catch (error) {
        console.error("Erreur dans removeFromCart :", error);
        res.status(500).json({
            error: "Erreur interne lors de la suppression du produit.",
            details: error.message
        });
    }
};

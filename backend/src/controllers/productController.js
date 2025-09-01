const Product = require("../models/Product");
const Shop = require("../models/Shop");
const mongoose = require("mongoose");

// ✅ Créer un produit
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl, shopId, category } = req.body;

    if (!name || !price || price <= 0 || !stock || stock < 0 || !shopId || !category) {
      return res.status(400).json({ message: "Données du produit invalides ou incomplètes." });
    }

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "ID de la boutique invalide." });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable." });
    }

    const newProduct = new Product({ name, description, price, stock, imageUrl, shopId, category });
    await newProduct.save();

    shop.products.push(newProduct._id);
    await shop.save();

    res.status(201).json({ message: "Produit créé avec succès.", product: newProduct });
  } catch (error) {
    console.error("Erreur dans createProduct :", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Erreur de validation des données du produit.", details: error.message });
    }
    res.status(500).json({ message: "Erreur serveur lors de la création du produit." });
  }
};

// ✅ Récupérer tous les produits (avec filtre optionnel par catégorie)
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category: { $regex: `^${category}$`, $options: "i" } } : {};
    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (error) {
    console.error("Erreur dans getProducts :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des produits." });
  }
};

// ✅ Récupérer les produits d'une boutique par shopId
exports.getProductsByShop = async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: "shopId est requis." });
    }

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "ID de la boutique invalide." });
    }

    const products = await Product.find({ shopId });
    res.status(200).json(products);
  } catch (error) {
    console.error("Erreur dans getProductsByShop :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des produits." });
  }
};

// ✅ Récupérer le produit le plus vendu pour une boutique
exports.getBestSeller = async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: "shopId est requis." });
    }

    console.log("Recherche du best-seller pour shopId :", shopId);

    let merchantId = shopId;

    if (mongoose.Types.ObjectId.isValid(shopId)) {
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Boutique introuvable." });
      }
      merchantId = shop.merchantId || shop.name.toLowerCase();
    }

    console.log("Utilisation de merchantId pour l'agrégation :", merchantId);

    const bestSeller = await mongoose.connection.db.collection("orders")
      .aggregate([
        { $match: { merchantId: merchantId } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 1 },
      ])
      .toArray();

    if (bestSeller.length > 0) {
      res.json({ productId: bestSeller[0]._id.toString() });
    } else {
      console.log("Aucun best-seller trouvé pour merchantId :", merchantId);
      res.json({ productId: null });
    }
  } catch (error) {
    console.error("Erreur dans getBestSeller :", error);
    res.status(500).json({ error: "Erreur lors de la récupération du produit le plus vendu" });
  }
};

// ✅ Récupérer un produit par ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "L'ID du produit est requis." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID du produit invalide." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Erreur dans getProductById :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération du produit." });
  }
};

// ✅ Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;

    if (!id) {
      return res.status(400).json({ message: "L'ID du produit est requis." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID du produit invalide." });
    }

    if (price && price <= 0) {
      return res.status(400).json({ message: "Le prix doit être supérieur à 0." });
    }
    if (stock && stock < 0) {
      return res.status(400).json({ message: "Le stock ne peut pas être négatif." });
    }
    if (category && !category.trim()) {
      return res.status(400).json({ message: "La catégorie ne peut pas être vide." });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    res.status(200).json({ message: "Produit mis à jour avec succès.", product: updatedProduct });
  } catch (error) {
    console.error("Erreur dans updateProduct :", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Erreur de validation des données du produit.", details: error.message });
    }
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du produit." });
  }
};

// ✅ Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "L'ID du produit est requis." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID du produit invalide." });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    await Shop.updateOne(
      { _id: deletedProduct.shopId },
      { $pull: { products: deletedProduct._id } }
    );

    res.status(200).json({ message: "Produit supprimé avec succès." });
  } catch (error) {
    console.error("Erreur dans deleteProduct :", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du produit." });
  }
};
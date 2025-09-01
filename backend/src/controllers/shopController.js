// C:/Users/lenovo/Desktop/pfe/loyaltyhub-proBack/src/controllers/shopController.js
const Shop = require("../models/Shop");

const createShop = async (req, res) => {
  try {
    const { name, description, category, imageUrl, merchantId, contact } = req.body;

    if (!name || !category || !merchantId) {
      return res.status(400).json({ message: "Le nom, la catégorie et le merchantId sont requis." });
    }

    const newShop = new Shop({
      name,
      description,
      category,
      imageUrl,
      merchantId,
      contact: contact || { email: "", phone: "", address: "" },
    });

    await newShop.save();
    res.status(201).json({ message: "Boutique créée avec succès.", shop: newShop });
  } catch (error) {
    console.error("Erreur dans createShop :", error);
    res.status(500).json({ message: "Erreur lors de la création de la boutique.", error: error.message });
  }
};

const getShops = async (req, res) => {
  try {
    const shops = await Shop.find();
    res.status(200).json(shops);
  } catch (error) {
    console.error("Erreur dans getShops :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des boutiques.", error: error.message });
  }
};

const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "L'ID de la boutique est requis." });
    }

    const shop = await Shop.findById(id).populate("products");
    if (!shop) {
      return res.status(404).json({ message: "Boutique introuvable." });
    }

    res.status(200).json(shop);
  } catch (error) {
    console.error("Erreur dans getShopById :", error);
    res.status(500).json({ message: "Erreur lors de la récupération de la boutique.", error: error.message });
  }
};

const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, imageUrl, merchantId, contact } = req.body;

    if (!id) {
      return res.status(400).json({ message: "L'ID de la boutique est requis." });
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      id,
      { name, description, category, imageUrl, merchantId, contact },
      { new: true, runValidators: true }
    );
    if (!updatedShop) {
      return res.status(404).json({ message: "Boutique introuvable." });
    }

    res.status(200).json({ message: "Boutique mise à jour avec succès.", shop: updatedShop });
  } catch (error) {
    console.error("Erreur dans updateShop :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la boutique.", error: error.message });
  }
};

const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "L'ID de la boutique est requis." });
    }

    const deletedShop = await Shop.findByIdAndDelete(id);
    if (!deletedShop) {
      return res.status(404).json({ message: "Boutique introuvable." });
    }

    res.status(200).json({ message: "Boutique supprimée avec succès." });
  } catch (error) {
    console.error("Erreur dans deleteShop :", error);
    res.status(500).json({ message: "Erreur lors de la suppression de la boutique.", error: error.message });
  }
};

const getShopByMerchantId = async (req, res) => {
  try {
    const { merchantId } = req.query;
    if (!merchantId) {
      return res.status(400).json({ message: "merchantId est requis" });
    }

    const shop = await Shop.findOne({ merchantId }).populate("products");
    if (!shop) {
      return res.status(404).json({ message: "Boutique non trouvée pour ce merchantId" });
    }

    res.status(200).json(shop);
  } catch (error) {
    console.error("Erreur dans getShopByMerchantId :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  getShopByMerchantId,
};
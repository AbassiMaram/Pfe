// scripts/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User"); // ✅ Chemin corrigé
require("dotenv").config();

const createAdmin = async () => {
  try {
    // 🔗 Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/loyaltyhub");

    console.log("✅ Connexion à MongoDB réussie");

    // 🔍 Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️ Un admin existe déjà :", existingAdmin.email);
      process.exit(0);
    }

    // 🔐 Hasher le mot de passe
    const adminPassword = "123"; // ⚠️ À changer en production
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 👤 Créer l'utilisateur admin
    const adminUser = new User({
      nom: "Super Admin",
      email: "admin@app.com",
      motDePasse: hashedPassword,
      role: "admin",
      isActive: true,
      adminPermissions: ["users", "shops", "analytics", "settings", "all"],
      loyaltyPoints: 0,
      // Pas de QR code ni de fonctionnalités client pour l'admin
    });

    await adminUser.save();

    console.log("✅ Admin créé avec succès !");
    console.log("📧 Email:", adminUser.email);
    console.log("🔑 Mot de passe:", adminPassword);
    console.log("⚠️ ATTENTION: Changez ce mot de passe après la première connexion !");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin :", error.message);
    process.exit(1);
  }
};

createAdmin();
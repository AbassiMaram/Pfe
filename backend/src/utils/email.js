const nodemailer = require("nodemailer");
require("dotenv").config(); // Charger les variables d'environnement

// Configurer l'envoi d'email (exemple avec Gmail)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER, // Utilise GMAIL_USER depuis ton .env
    pass: process.env.GMAIL_PASS, // Utilise GMAIL_PASS depuis ton .env
  },
});

module.exports = transporter;
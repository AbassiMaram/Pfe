const User = require('../models/User');

exports.generateReferralCode = async (nom) => {
  const cleanNom = nom.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let referralCode = "";
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    referralCode = `${cleanNom.substring(0, 2)}${randomNum}`;

    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return referralCode;
};
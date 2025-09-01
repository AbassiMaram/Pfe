console.log("🔥 NOUVELLE INSTANCE - Port5000 uniquement");

const express = require('express');
const app = express();
const PORT = 5000;

app.get('/api/test', (req, res) => {
  console.log(`✅ Requête reçue sur ${PORT}`);
  res.send(`Réponse depuis ${PORT}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur EXPRESS démarré sur ${PORT}`);
}).on('error', (err) => {
  console.error("💥 ERREUR PORT:", err);
});

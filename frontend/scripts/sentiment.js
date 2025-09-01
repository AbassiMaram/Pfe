import * as tf from '@tensorflow/tfjs';

// Charger le modèle depuis le dossier public
const loadModel = async () => {
  const modelUrl = '/models/loyaltyhub_sentiment_model_tfjs/model.json'; // Ajuste selon le nom exact
  const model = await tf.loadLayersModel(modelUrl);
  console.log('Modèle chargé avec succès !');
  return model;
};

// Charger le tokenizer (simplifié, à adapter selon son format)
const loadTokenizer = () => {
  const tokenizerPath = '/models/loyaltyhub_tokenizer/tokenizer_config.json'; // Ajuste selon le nom exact
  return fetch(tokenizerPath)
    .then(response => response.json())
    .then(data => {
      console.log('Tokenizer chargé avec succès !');
      return data;
    });
};

// Fonction pour prédire le sentiment
const predictSentiment = async (text, model, tokenizer) => {
  // Tokeniser le texte (exemple simplifié, à adapter)
  const tokenized = text.split(' ').map(word => tokenizer[word] || 0);
  const inputTensor = tf.tensor2d([tokenized], [1, tokenized.length]);
  const prediction = model.predict(inputTensor);
  const score = prediction.dataSync()[0]; // Ajuste selon la sortie du modèle
  return score > 0.5 ? 'positif' : 'négatif'; // Exemple binaire
};

// Exporter les fonctions pour les utiliser ailleurs
export { loadModel, loadTokenizer, predictSentiment };
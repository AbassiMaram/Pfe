import axios from "axios";

const API_URL = "http://localhost:5000/api/auth"; // Ajuste si nécessaire

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data.showCustomCaptcha) {
      // Si le backend demande une vérification supplémentaire
      return { showCustomCaptcha: true };
    }
    throw new Error(error.response?.data?.message || "Erreur lors de l'inscription");
  }
};

export const loginUser = async (credentials) => {
  try {
    console.log("Données envoyées :", credentials);
    const response = await axios.post(`${API_URL}/login`, credentials);
    console.log("loginUser - Réponse brute :", response);
    console.log("loginUser - Données renvoyées :", response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Erreur lors de la connexion");
  }
};
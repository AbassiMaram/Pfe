import { useState, useEffect } from "react";
import Image from "next/image";
import { captchaImages } from "@/lib/captchaImages";

// Fonction pour mélanger un tableau (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const CustomCaptcha = ({ onVerify, showCaptcha }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [error, setError] = useState("");

  // Sélectionner 6 images aléatoires (3 sacs, 3 non-sacs)
  useEffect(() => {
    if (showCaptcha) {
      const bags = captchaImages.filter((img) => img.isBag);
      const nonBags = captchaImages.filter((img) => !img.isBag);
      const selectedBags = shuffleArray(bags).slice(0, 3);
      const selectedNonBags = shuffleArray(nonBags).slice(0, 3);
      const allSelected = shuffleArray([...selectedBags, ...selectedNonBags]);
      setDisplayedImages(allSelected);
    }
  }, [showCaptcha]);

  const handleImageClick = (index) => {
    if (selectedImages.includes(index)) {
      setSelectedImages(selectedImages.filter((i) => i !== index));
    } else {
      setSelectedImages([...selectedImages, index]);
    }
  };

  const handleVerify = () => {
    const correctBags = displayedImages
      .map((img, index) => (img.isBag ? index : -1))
      .filter((index) => index !== -1);

    const isCorrect =
      selectedImages.length === correctBags.length &&
      selectedImages.every((index) => correctBags.includes(index));

    if (isCorrect) {
      setError("");
      onVerify(true); // Informer le parent que le CAPTCHA est validé
    } else {
      setError("❌ Sélection incorrecte. Veuillez réessayer.");
      setSelectedImages([]);
      // Mélanger à nouveau les images pour une nouvelle tentative
      const bags = captchaImages.filter((img) => img.isBag);
      const nonBags = captchaImages.filter((img) => !img.isBag);
      const selectedBags = shuffleArray(bags).slice(0, 3);
      const selectedNonBags = shuffleArray(nonBags).slice(0, 3);
      const allSelected = shuffleArray([...selectedBags, ...selectedNonBags]);
      setDisplayedImages(allSelected);
      onVerify(false);
    }
  };

  if (!showCaptcha) {
    return null; // Ne pas afficher le CAPTCHA si reCAPTCHA v3 a validé l'utilisateur
  }

  return (
    <div className="captcha-container p-4 bg-gray-100 rounded-lg">
      <p className="text-center mb-4 font-semibold">
        Cliquez sur tous les sacs de shopping :
      </p>
      <div className="grid grid-cols-3 gap-4">
        {displayedImages.map((image, index) => (
          <div
            key={index}
            className={`relative cursor-pointer border-2 rounded-lg p-2 ${
              selectedImages.includes(index)
                ? "border-yellow-500"
                : "border-gray-300"
            }`}
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={image.src}
              alt="CAPTCHA image"
              width={100}
              height={100}
              className="object-cover rounded-lg"
            />
            {selectedImages.includes(index) && (
              <div className="absolute inset-0 flex items-center justify-center bg-yellow-500 bg-opacity-50 rounded-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleVerify}
        className="mt-4 w-full bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-all duration-300"
      >
        Vérifier
      </button>
      {error && <p className="mt-2 text-center text-red-500">{error}</p>}
    </div>
  );
};

export default CustomCaptcha;
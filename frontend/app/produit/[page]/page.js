"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import * as THREE from "three";

const stripePromise = loadStripe("pk_test_51PZC2YCjT7zmyc7u4ijqte1k2ak2KtVSS4l3M8ohpYjvZ4M5e3JAVPRConbXlmMDWcLkh7H9JF0tWzzfLynjBuDr00mNIwipzd");

const CheckoutForm = ({ productId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("⚠️ Stripe n'est pas encore chargé. Veuillez patienter, moussaillon !");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("⚠️ Élément de carte non trouvé. Vérifiez votre coffre !");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log("🏴‍☠️ Envoi au backend pour productId:", productId);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("🏴‍☠️ Capitaine ! Veuillez vous connecter pour débloquer la vue 3D premium !");
        router.push("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/order/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: 500, // 5€ pour la vue 3D
          productId,
          isPremiumView: true,
        }),
      });

      const responseText = await response.text();
      console.log("⚓ Réponse backend:", response.status, responseText);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("⚠️ Token expiré, redirection vers /login");
          localStorage.removeItem("token");
          router.push("/login");
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error(`Erreur serveur ${response.status}: ${responseText}`);
      }

      const { clientSecret } = JSON.parse(responseText);
      console.log("🔐 Client secret reçu:", clientSecret ? "✅" : "❌");

      if (!clientSecret) {
        throw new Error("🔐 Client secret manquant dans la réponse");
      }

      console.log("💳 Confirmation du paiement avec Stripe...");
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Chasseur de Trésors",
          },
        },
      });

      console.log("🎯 Résultat du paiement:", result);

      if (result.error) {
        console.error("❌ Erreur de paiement:", result.error);
        setError(`Erreur de paiement: ${result.error.message}`);
      } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        console.log("✅ Paiement réussi:", result.paymentIntent.id);
        setError(null);
        onSuccess(result.paymentIntent.id);
      } else {
        console.error("❌ Statut de paiement inattendu:", result.paymentIntent?.status);
        setError("Statut de paiement inattendu. Contactez le support, moussaillon !");
      }
    } catch (err) {
      console.error("💥 Erreur lors du processus de paiement:", err);
      setError(err.message || "Erreur lors du paiement. Veuillez réessayer, capitaine !");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-300">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💳</span>
        <h3 className="text-xl font-bold text-amber-900">Paiement Premium</h3>
      </div>
      <p className="text-amber-700 mb-4">Débloquez la vue 3D pour 5€</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border-2 border-amber-300 rounded-lg bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": { color: "#aab7c4" },
                },
                invalid: { color: "#9e2146" },
              },
            }}
          />
        </div>
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={!stripe || processing}
          className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-purple-900 font-bold py-3 px-4 rounded-lg shadow-lg transform transition-all duration-300 flex items-center justify-center gap-2 ${
            processing || !stripe
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-yellow-500 hover:to-yellow-700 hover:scale-105"
          }`}
        >
          <span className="text-xl">🔓</span>
          <span>{processing ? "Navigation en cours..." : "Payer 5€"}</span>
          <span className="text-xl">⚔️</span>
        </button>
      </form>
      <p className="text-amber-600 text-xs mt-2 flex items-center justify-center gap-1">
        <span>🔒</span>
        <span>Paiement sécurisé par Stripe</span>
      </p>
    </div>
  );
};

const Product3DViewer = ({ product }) => {
  // Vérification de l'accès premium
  if (!product.premiumAccess) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Vue 3D Premium Non Disponible
          </h2>
          <p className="text-gray-600">
            Ce produit n'a pas accès à la fonctionnalité de vue 3D premium.
          </p>
        </div>
      </div>
    );
  }

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    import('three/examples/jsm/loaders/GLTFLoader').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        '/models/j.glb',
        (gltf) => {
          console.log('✅ Modèle chargé avec succès:', gltf);
          const model = gltf.scene;

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          model.position.sub(center);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          scene.add(model);
          modelRef.current = model;
          setLoading(false);
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading model:', error);
          setError('Erreur lors du chargement du modèle 3D');
          setLoading(false);
        }
      );
    });

    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const handleMouseDown = () => { isMouseDown = true; };
    const handleMouseUp = () => { isMouseDown = false; };
    const handleMouseMove = (event) => {
      if (!isMouseDown || !modelRef.current) return;
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      modelRef.current.rotation.y += deltaX * 0.01;
      modelRef.current.rotation.x += deltaY * 0.01;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };
    const updateMousePosition = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };
    const handleWheel = (event) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      camera.position.z += direction * zoomSpeed;
      camera.position.z = Math.max(1, Math.min(10, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousemove', updateMousePosition);
    renderer.domElement.addEventListener('wheel', handleWheel);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (mountRef.current) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const resetView = () => {
    if (modelRef.current) {
      modelRef.current.rotation.set(0, 0, 0);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🌟 {product?.name ?? 'Produit'} - Vue 3D Premium</h2>
        <p className="text-gray-600">Faites glisser pour faire tourner • Molette pour zoomer</p>
      </div>

      <div className="relative">
        <div ref={mountRef} className="w-full h-96 border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du modèle 3D...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center text-red-600">
              <p className="font-semibold">❌ {error}</p>
              <p className="text-sm mt-2">Vérifie que le fichier j.glb est dans /public/models/</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={resetView}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          🔄 Remettre à zéro
        </button>
        <div className="text-sm text-gray-500">💎 Fonctionnalité Premium - Abonnement requis</div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">{product?.name ?? 'Produit inconnu'}</h3>
        <p className="text-gray-600 mb-2">Prix: {product?.price ?? 'N/A'} €</p>
        <p className="text-sm text-gray-500">
          Avec la vue 3D premium, explore chaque détail avant d'acheter !
        </p>
      </div>
    </div>
  );
};

const ProductPage = () => {
  const { page } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState({
    sentiment_based: [],
    similar: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    console.log("useEffect [page] déclenché, page :", page);
    if (page) {
      fetchProductData(page);
    } else {
      setError("Aucun produit sélectionné.");
      setLoading(false);
    }
  }, [page]);

  const fetchProductData = async (productId) => {
    setLoading(true);
    try {
      const productResponse = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const productData = await productResponse.json();
      if (!productData || !productData._id || !productData.shopId) {
        throw new Error("Données produit invalides ou boutique manquante.");
      }
      console.log("Produit trouvé :", productData);

      setProduct(productData);
      setIsPremium(productData.premiumAccess || false);
      await fetchRecommendations(productData);
    } catch (err) {
      setError(`Erreur de chargement : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (productData) => {
    try {
      const productId = productData._id;
      const shopId = productData.shopId;
      const category = productData.category;
      console.log("Boutique actuelle :", shopId);
      console.log("Catégorie actuelle :", category);

      const allProductsResponse = await fetch(`http://localhost:5000/api/products`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const allProductsData = await allProductsResponse.json();
      console.log("Tous les produits explorés (avant filtrage) :", allProductsData);

      if (!allProductsData || !Array.isArray(allProductsData)) {
        throw new Error("Données produits invalides.");
      }

      const interactionsResponse = await fetch("http://localhost:5000/api/interactions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const interactionsData = await interactionsResponse.json();
      console.log("Avis clients récupérés :", interactionsData);

      const analyzeSentiment = async (comment) => {
        const sentimentResponse = await fetch("http://localhost:5001/api/analyze-sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: comment || "" }),
        });
        const sentimentData = await sentimentResponse.json();
        console.log(`Analyse d'avis pour "${comment}":`, sentimentData);
        return sentimentData.sentiment === "positif";
      };

      const shopProducts = allProductsData
        .filter((prod) => prod.shopId === shopId && prod.shopId !== undefined && prod.shopId !== null)
        .filter((prod) => prod._id !== productId);

      if (shopProducts.length === 0) {
        console.log("Aucun autre produit trouvé dans cette boutique :", shopId);
      } else {
        console.log("Produits de la boutique filtrés :", shopProducts);
      }

      const recommendedProducts = await Promise.all(
        shopProducts.map(async (prod) => {
          const productInteractions = interactionsData.filter(
            (i) => i.targetId === prod._id && i.type === "review"
          );
          console.log(`Avis pour le produit ${prod._id} :`, productInteractions);
          let hasPositiveReview = false;
          for (const interaction of productInteractions) {
            if (interaction.comment) {
              hasPositiveReview = await analyzeSentiment(interaction.comment);
              if (hasPositiveReview) break;
            } else if (interaction.value && interaction.value >= 4) {
              hasPositiveReview = true;
              break;
            }
          }
          return { ...prod, hasPositiveReview };
        })
      ).then((results) => results.filter((prod) => prod.hasPositiveReview));

      const similarProducts = allProductsData
        .filter((prod) => 
          prod.shopId === shopId &&
          prod.category === category &&
          prod.shopId !== undefined &&
          prod.shopId !== null &&
          prod.category !== undefined
        )
        .filter((prod) => prod._id !== productId);

      if (similarProducts.length === 0) {
        console.log("Aucun produit similaire trouvé dans la même boutique :", shopId, category);
      } else {
        console.log("Produits similaires filtrés (même boutique et catégorie) :", similarProducts);
      }

      const popularProducts = similarProducts
        .map((prod) => {
          const productInteractions = interactionsData.filter(
            (i) => i.targetId === prod._id && i.type === "like"
          );
          const popularity = productInteractions.length;
          return { ...prod, popularity };
        })
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 3);

      setRecommendations({
        sentiment_based: recommendedProducts,
        similar: popularProducts,
      });
      console.log("Recommandations mises à jour :", {
        sentiment_based: recommendedProducts,
        similar: popularProducts,
      });
    } catch (err) {
      console.error("Erreur dans les recommandations :", err.message);
      setError(`Erreur lors du chargement des recommandations : ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🧭</div>
          <p className="text-amber-800 text-xl font-bold">Exploration en cours...</p>
          <p className="text-amber-700">Recherche de trésors cachés</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-100 to-red-200 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg border-4 border-red-400">
          <div className="text-6xl mb-4">💀</div>
          <p className="text-red-600 text-xl font-bold">Chargement échoué !</p>
          <p className="text-red-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-gray-600 text-xl">Produit introuvable...</p>
        </div>
      </div>
    );
  }

  const goldCoinsEarned = Math.round(product.price * 0.05);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white p-6 shadow-lg">
        <div className="container mx-auto flex items-center gap-4">
          <span className="text-3xl">🏴‍☠️</span>
          <h1 className="text-3xl font-bold">Détails du Produit</h1>
          <span className="text-2xl">✨</span>
          <div className="ml-auto bg-amber-700 px-4 py-2 rounded-full flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-bold">Votre Coffre au Trésor</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-xl shadow-2xl border-4 border-amber-600 mb-8 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-5"
            style={{
              backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='50' font-size='20'%3E🗺️%3C/text%3E%3C/svg%3E')",
              backgroundRepeat: "repeat",
            }}
          ></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">💎</span>
              <h2 className="text-4xl font-bold text-amber-900">{product.name}</h2>
              <div className="ml-auto bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                <span>🪙</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="relative">
                {product.imageUrl ? (
                  <div className="relative">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="object-cover rounded-xl shadow-lg border-4 border-amber-400"
                    />
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-1">
                      <span>⚡</span>
                      <span>DISPONIBLE</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-amber-200 to-amber-300 h-80 flex flex-col items-center justify-center rounded-xl border-4 border-amber-400 shadow-lg">
                    <span className="text-6xl mb-2">📦</span>
                    <p className="text-amber-800 font-bold text-lg">Image à venir</p>
                  </div>
                )}

                {product.premiumAccess ? (
                  <div className="mt-6 bg-gradient-to-r from-purple-600 to-purple-800 p-6 rounded-xl shadow-xl border-4 border-purple-400 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-purple-900 px-3 py-1 rounded-bl-lg font-bold text-sm">
                      <span className="flex items-center gap-1">
                        <span>👑</span>
                        <span>PREMIUM</span>
                      </span>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-3xl">🌟</span>
                        <h3 className="text-2xl font-bold text-white">Vision du Maître Chasseur</h3>
                        <span className="text-3xl">🔮</span>
                      </div>
                      
                      {!isPremium && !showPayment && (
                        <>
                          <p className="text-purple-100 mb-4 text-lg">
                            Explorez ce trésor sous tous les angles avec notre vision 3D mystique !
                          </p>
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-4xl animate-pulse">🏴‍☠️</span>
                            <span className="text-4xl animate-bounce">💎</span>
                            <span className="text-4xl animate-pulse">🗡️</span>
                          </div>
                          <div className="bg-purple-900/50 p-4 rounded-lg mb-4 border-2 border-purple-300">
                            <p className="text-purple-100 text-sm mb-2">
                              <span className="font-bold">🎯 Avantages Premium :</span>
                            </p>
                            <ul className="text-purple-200 text-sm space-y-1">
                              <li>• 📐 Visualisation 3D interactive</li>
                              <li>• 🔍 Zoom et rotation à 360°</li>
                              <li>• ⚡ Inspection détaillée du trésor</li>
                              <li>• 🗺️ Accès aux cartes secrètes</li>
                            </ul>
                          </div>
                          <button
                            onClick={() => setShowPayment(true)}
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-purple-900 font-bold py-4 px-6 rounded-lg shadow-lg hover:from-yellow-500 hover:to-yellow-700 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                          >
                            <span className="text-2xl">🔓</span>
                            <span>DÉBLOQUER LA VISION 3D</span>
                            <span className="text-2xl">⚔️</span>
                          </button>
                          <p className="text-purple-200 text-xs mt-2 flex items-center justify-center gap-1">
                            <span>💰</span>
                            <span>Rejoignez l'élite des chasseurs de trésors</span>
                            <span>🏆</span>
                          </p>
                        </>
                      )}

                      {showPayment && !isPremium && (
                        <Elements stripe={stripePromise}>
                          <CheckoutForm productId={product._id} onSuccess={() => setIsPremium(true)} />
                        </Elements>
                      )}

                      {isPremium && <Product3DViewer product={product} />}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 bg-gradient-to-r from-gray-400 to-gray-600 p-6 rounded-xl shadow-xl border-4 border-gray-300 relative overflow-hidden">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-3xl">🔒</span>
                        <h3 className="text-2xl font-bold text-white">Vision 3D Non Disponible</h3>
                      </div>
                      <p className="text-gray-100 mb-4 text-lg">
                        Ce produit n'a pas accès à la vision 3D premium.
                      </p>
                      <div className="bg-gray-700/50 p-4 rounded-lg mb-4 border-2 border-gray-400">
                        <p className="text-gray-200 text-sm">
                          Seuls les produits avec accès premium peuvent bénéficier de cette fonctionnalité.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white/70 p-6 rounded-lg border-2 border-amber-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💰</span>
                    <h3 className="text-2xl font-bold text-amber-900">Prix</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{product.price} €</p>
                  <p className="text-sm text-amber-700 mt-2 flex items-center gap-1">
                    <span>🪙</span>
                    <span>Gagnez {goldCoinsEarned} pièces d'or avec cet achat</span>
                  </p>
                </div>

                {product.category && (
                  <div className="bg-white/70 p-6 rounded-lg border-2 border-amber-300">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">⚔️</span>
                      <h3 className="text-xl font-bold text-amber-900">Catégorie</h3>
                    </div>
                    <p className="text-amber-800 font-semibold">{product.category}</p>
                  </div>
                )}

                <div className="bg-white/70 p-6 rounded-lg border-2 border-amber-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📜</span>
                    <h3 className="text-xl font-bold text-amber-900">Description</h3>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    {product.description || "Un produit exceptionnel qui mérite votre attention d'aventurier..."}
                  </p>
                </div>

                <button className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3">
                  <span className="text-2xl">🛒</span>
                  AJOUTER AU PANIER
                  <span className="text-xl">🪙</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {recommendations.sentiment_based.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⭐</span>
              <h2 className="text-3xl font-bold text-amber-900">Recommandés par nos Clients</h2>
              <span className="text-3xl">🗣️</span>
            </div>
            <p className="text-amber-700 mb-6 text-lg flex items-center gap-2">
              <span>🧭</span>
              <span>D'autres aventuriers ont eu de bonnes expériences avec ces produits...</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.sentiment_based.map((recProduct) => {
                const recGoldCoins = Math.round(recProduct.price * 0.05);
                return (
                  <div key={recProduct._id} className="bg-white p-6 rounded-xl shadow-lg border-3 border-green-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>👥</span>
                      <span>APPROUVÉ</span>
                    </div>
                    
                    {recProduct.imageUrl ? (
                      <div className="mb-4 relative">
                        <Image
                          src={recProduct.imageUrl}
                          alt={recProduct.name}
                          width={200}
                          height={200}
                          className="object-cover rounded-lg mx-auto border-2 border-green-200"
                        />
                        <div className="absolute -bottom-2 -right-2 text-2xl">💎</div>
                      </div>
                    ) : (
                      <div className="mb-4 bg-gradient-to-br from-green-100 to-green-200 h-48 flex flex-col items-center justify-center rounded-lg border-2 border-green-200">
                        <span className="text-4xl mb-2">🏺</span>
                        <p className="text-green-700 font-medium">Produit Recommandé</p>
                      </div>
                    )}
                    
                    <h3 className="text-lg font-bold text-amber-900 mb-2">{recProduct.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💰</span>
                      <p className="text-xl font-bold text-green-700">{recProduct.price} €</p>
                    </div>
                    <div className="flex items-center gap-1 mb-4 text-sm text-amber-700">
                      <span>🪙</span>
                      <span>+{recGoldCoins} pièces d'or</span>
                    </div>
                    
                    <Link href={`/produit/${recProduct._id}`}>
                      <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                        <span>🔍</span>
                        Voir ce Produit
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recommendations.similar.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🏆</span>
              <h2 className="text-3xl font-bold text-amber-900">Produits Similaires Populaires</h2>
              <span className="text-3xl">🔥</span>
            </div>
            <p className="text-amber-700 mb-6 text-lg flex items-center gap-2">
              <span>⚓</span>
              <span>Ces produits de la même catégorie sont très appréciés !</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.similar.map((recProduct) => {
                const recGoldCoins = Math.round(recProduct.price * 0.05);
                return (
                  <div key={recProduct._id} className="bg-white p-6 rounded-xl shadow-lg border-3 border-red-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>🔥</span>
                      <span>{recProduct.popularity}</span>
                    </div>
                    
                    {recProduct.imageUrl ? (
                      <div className="mb-4 relative">
                        <Image
                          src={recProduct.imageUrl}
                          alt={recProduct.name}
                          width={200}
                          height={200}
                          className="object-cover rounded-lg mx-auto border-2 border-red-200"
                        />
                        <div className="absolute -bottom-2 -right-2 text-2xl">🏆</div>
                      </div>
                    ) : (
                      <div className="mb-4 bg-gradient-to-br from-red-100 to-red-200 h-48 flex flex-col items-center justify-center rounded-lg border-2 border-red-200">
                        <span className="text-4xl mb-2">👑</span>
                        <p className="text-red-700 font-medium">Produit Populaire</p>
                      </div>
                    )}
                    
                    <h3 className="text-lg font-bold text-amber-900 mb-2">{recProduct.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💰</span>
                      <p className="text-xl font-bold text-green-700">{recProduct.price} €</p>
                    </div>
                    <div className="flex items-center gap-1 mb-2 text-sm text-amber-700">
                      <span>🪙</span>
                      <span>+{recGoldCoins} pièces d'or</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">❤️</span>
                      <p className="text-sm text-red-600 font-semibold">
                        {recProduct.popularity} client{recProduct.popularity > 1 ? 's' : ''} l'apprécient
                      </p>
                    </div>
                    
                    <Link href={`/produit/${recProduct._id}`}>
                      <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                        <span>⚔️</span>
                        Découvrir ce Produit
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
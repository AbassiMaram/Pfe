'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

export default function NewProductPage() {
  const router = useRouter();
  const { id: shopId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    stock: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');

      // Validation des champs obligatoires selon le modèle
      if (!formData.name.trim()) throw new Error('Le nom du produit est requis');
      
      const price = parseFloat(formData.price);
      if (isNaN(price)) throw new Error('Le prix doit être un nombre valide');
      if (price <= 0) throw new Error('Le prix doit être supérieur à 0');

      // Conversion du stock en nombre (optionnel avec valeur par défaut 0)
      const stock = formData.stock ? parseInt(formData.stock) : 0;

      // Préparation des données selon le modèle Product
      const productData = {
        name: formData.name.trim(),
        price: price,
        description: formData.description.trim(),
        category: formData.category.trim(),
        shopId: shopId,
        stock: stock
      };

      // Ajout optionnel de l'imageUrl si fournie
      if (formData.imageUrl.trim()) {
        productData.imageUrl = formData.imageUrl.trim();
      }

      const response = await fetch('http://localhost:5000/api/products/admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec de la création du produit");
      }

      router.push(`/admin/shops/${shopId}/products`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button onClick={() => router.push(`/admin/shops/${shopId}/products`)} className="p-2 rounded-full hover:bg-gray-100 mr-4">
          <FaArrowLeft className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold">Nouveau produit</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        {/* Champ Nom - Requis */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nom du produit <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Champ Prix - Requis */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Prix (€) <span className="text-red-500">*</span></label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            step="0.01"
            min="0.01"
            required
          />
        </div>

        {/* Champ Stock */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Stock initial</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            min="0"
          />
        </div>

        {/* Champ Description */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>

        {/* Champ Catégorie */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Catégorie</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Champ Image URL */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">URL de l'image</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="http://exemple.com/image.jpg"
          />
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => router.push(`/admin/shops/${shopId}/products`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Création...
              </span>
            ) : (
              <span className="flex items-center">
                <FaSave className="mr-2" />
                Créer le produit
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
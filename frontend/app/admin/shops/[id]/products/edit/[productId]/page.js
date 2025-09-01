'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaSave, FaTimes } from 'react-icons/fa';

export default function EditProductPage() {
  const router = useRouter();
  const { id: shopId, productId } = useParams();
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger le produit à éditer
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5000/api/products/${productId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!response.ok) throw new Error('Produit non trouvé');
        
        const data = await response.json();
        setProduct(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          category: data.category || '',
          imageUrl: data.imageUrl || ''
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Préparer seulement les données modifiées
      const updatedData = {};
      if (formData.name !== product.name) updatedData.name = formData.name;
      if (formData.description !== product.description) updatedData.description = formData.description;
      if (parseFloat(formData.price) !== product.price) updatedData.price = parseFloat(formData.price);
      if (formData.category !== product.category) updatedData.category = formData.category;
      if (formData.imageUrl !== product.imageUrl) updatedData.imageUrl = formData.imageUrl;

      // Ne pas envoyer de requête si rien n'a changé
      if (Object.keys(updatedData).length === 0) {
        router.push(`/admin/shops/${shopId}/products`);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/products/admin/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedData)
        }
      );

      if (!response.ok) throw new Error('Échec de la mise à jour');
      
      router.push(`/admin/shops/${shopId}/products`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => router.push(`/admin/shops/${shopId}/products`)}
            className="ml-4 bg-blue-500 text-white px-3 py-1 rounded"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.push(`/admin/shops/${shopId}/products`)} 
          className="p-2 rounded-full hover:bg-gray-100 mr-4"
        >
          <FaTimes className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold">Modifier le produit</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nom</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Laisser vide pour ne pas modifier"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="4"
            placeholder="Laisser vide pour ne pas modifier"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Prix (€)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            step="0.01"
            min="0"
            placeholder="Laisser vide pour ne pas modifier"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Catégorie</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Laisser vide pour ne pas modifier"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">URL de l'image</label>
          <input
            type="text"  // Changé de 'url' à 'text' pour plus de flexibilité
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Laisser vide pour ne pas modifier"
          />
        </div>

        {error && (
          <div className="mb-4 text-red-500">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push(`/admin/shops/${shopId}/products`)}
            className="mr-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FaSave className="mr-2" /> Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
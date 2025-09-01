export default function ProductCard({ product }) {
    return (
      <div className="p-4 border rounded-lg shadow-md">
        <img src={product.image} alt={product.name} className="h-40 w-full object-cover" />
        <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
        <p className="text-gray-600">${product.price}</p>
      </div>
    );
  }
  
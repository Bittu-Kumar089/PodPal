import React, { useState, useEffect } from 'react';
import { Leaf, Heart, ShoppingBag, ExternalLink } from 'lucide-react';
import { Product } from '../types';

interface ProductSearchProps {
  initialQuery: string;
  initialProducts: Product[];
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  serverAvailable: boolean;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  initialQuery,
  initialProducts,
  onSearch,
  isLoading,
  serverAvailable
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTip, setSearchTip] = useState<string | null>(null);
  
  // Material categories
  const popularMaterials = [
    'Bamboo', 'Organic Cotton', 'Hemp', 'Cork', 'Coconut', 
    'Wood', 'Tencel', 'Khadi', 'Jute', 'Steel'
  ];

  // Product categories
  const popularCategories = [
    'Personal Care', 'Home & Living', 'Fashion', 
    'Kitchen & Garden', 'Food & Drink', 'Wellness'
  ];

  useEffect(() => {
    // Random search tips
    const tips = [
      "Try searching for 'bamboo toothbrush' for plastic-free alternatives",
      "Looking for sustainable fashion? Try 'organic cotton clothing'",
      "Search 'zero waste kitchen' for eco-friendly kitchen essentials",
      "Try 'natural skincare' for chemical-free beauty products",
      "Search 'eco-friendly gifts' for sustainable present ideas"
    ];
    setSearchTip(tips[Math.floor(Math.random() * tips.length)]);
    
    // Update products when initialProducts changes
    setProducts(initialProducts);
  }, [initialProducts]);
  
  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !serverAvailable) return;
    
    await onSearch(query);
  };

  const handleCategoryClick = (category: string) => {
    if (!serverAvailable) return;
    
    setQuery(category);
    // Auto submit after setting query
    onSearch(category);
  };
  
  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
  };
  
  const handleCloseDetails = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-emerald-50 p-6 rounded-lg mb-8 text-center">
        <h2 className="text-2xl font-bold text-emerald-800 mb-2 flex items-center justify-center">
          <Leaf className="w-6 h-6 mr-2 text-emerald-600" />
          Eco-Product Finder
        </h2>
        <p className="text-emerald-700 mb-4">
          Discover verified sustainable products that are good for you and the planet
        </p>
        
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={serverAvailable ? "Search for eco-friendly products..." : "Server unavailable - search disabled"}
              className="flex-1 p-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
              disabled={!serverAvailable}
            />
            <button
              type="submit"
              disabled={isLoading || !serverAvailable}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {searchTip && (
          <div className="text-sm text-emerald-600 italic">
            Tip: {searchTip}
          </div>
        )}
        
        {!serverAvailable && (
          <div className="mt-2 bg-amber-50 p-3 rounded-lg text-amber-700 text-sm">
            Server connection unavailable. Product search is disabled. Please try again later.
          </div>
        )}
      </div>

      {serverAvailable && (
        <>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center">
              <Heart className="w-4 h-4 mr-2 text-emerald-600" />
              Popular Sustainable Materials
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularMaterials.map((material, index) => (
                <button
                  key={index}
                  onClick={() => handleCategoryClick(material)}
                  className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                  disabled={isLoading}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2 text-emerald-600" />
              Product Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => handleCategoryClick(category)}
                  className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                  disabled={isLoading}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center mt-8 mb-8 p-8 bg-emerald-50 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-emerald-700">Searching for planet-positive products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {products.map((product, index) => (
            <div
              key={index}
              className="block p-4 border border-emerald-200 rounded-lg hover:shadow-lg transition-shadow bg-white"
            >
              <div className="relative pb-[56.25%] mb-4">
                <img
                  src={product.image || 'https://via.placeholder.com/300x200?text=Eco-Friendly+Product'}
                  alt={product.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Eco-Friendly+Product';
                  }}
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-emerald-800">{product.title}</h3>
              {product.price && (
                <p className="text-emerald-600 font-bold mb-2">{product.price}</p>
              )}
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">{product.description || 'No description available'}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {product.sustainability && product.sustainability.map((feature: string, i: number) => (
                  <span key={i} className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">
                    {feature}
                  </span>
                ))}
                {(!product.sustainability || product.sustainability.length === 0) && (
                  <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">
                    Eco-friendly
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => handleViewDetails(product)}
                  className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
                >
                  View Details
                </button>
                
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-lg flex items-center hover:bg-emerald-700"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Visit Store
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : query && !isLoading ? (
        <div className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg">
          <p className="mb-3">No eco-friendly products found for "{query}".</p>
          <p>Try a different search term or browse the categories above.</p>
        </div>
      ) : null}
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-emerald-800">{selectedProduct.title}</h2>
                <button 
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✖
                </button>
              </div>
              
              <div className="mb-4">
                <img
                  src={selectedProduct.image || 'https://via.placeholder.com/600x400?text=Eco-Friendly+Product'}
                  alt={selectedProduct.title}
                  className="w-full h-64 object-contain rounded-lg mb-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Eco-Friendly+Product';
                  }}
                />
                
                {selectedProduct.price && (
                  <p className="text-emerald-600 font-bold text-xl mb-2">{selectedProduct.price}</p>
                )}
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-600">{selectedProduct.description || 'No description available'}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-1">Sold by</h3>
                  <p className="text-gray-600">{selectedProduct.merchant}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-1">Sustainability Features</h3>
                  {selectedProduct.sustainability && selectedProduct.sustainability.length > 0 ? (
                    <div className="mt-4 mb-3 flex flex-wrap gap-1">
                      {selectedProduct.sustainability.map((feature: string, i: number) => (
                        <span key={i} className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No specific sustainability features identified.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                
                <a
                  href={selectedProduct.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Product
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch; 
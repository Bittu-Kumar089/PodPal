import React, { useState } from 'react';
import { Search, Leaf } from 'lucide-react';

// Define the Google CSE types
declare global {
  interface Window {
    __gcse: {
      elements: {
        render: (element: string, options: { gname?: string }) => void;
        getElement: (element: string) => any;
      };
    };
  }
}

const EcoProductSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Open Google search in a popup window
    const width = 800;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      'GoogleSearch',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-emerald-50 p-6 rounded-lg mb-6 text-center">
        <h2 className="text-2xl font-bold text-emerald-800 mb-2 flex items-center justify-center">
          <Leaf className="w-6 h-6 mr-2 text-emerald-600" />
          Eco-Friendly Product Search
        </h2>
        <p className="text-emerald-700 mb-4">
          Discover sustainable products that are good for you and the planet
        </p>
        
        <p className="text-sm text-emerald-600 italic mt-2">
          Tip: Try searching for "bamboo toothbrush", "organic cotton clothing", or "zero waste kitchen"
        </p>
      </div>

      <div className="bg-white border border-emerald-100 rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for eco-friendly products..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default EcoProductSearch;
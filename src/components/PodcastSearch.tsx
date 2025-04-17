import { useState, useEffect } from 'react';
import { Search, Filter, Play, Image } from 'lucide-react';
import { Podcast } from '../types';
import { searchPodcasts } from '../utils/api';

const PodcastSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'all',
    'true crime',
    'comedy',
    'business',
    'technology',
    'health',
    'history',
    'science',
    'news',
    'sports',
    'fiction',
    'food',
    'education',
    'spirituality',
    'motivation',
    'suspense',
    'love'
  ];

  // Load initial podcasts on component mount
  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async (query = '', category = selectedCategory) => {
    setIsLoading(true);
    try {
      const results = await searchPodcasts(query, category !== 'all' ? category : '');
      setPodcasts(results);
    } catch (error) {
      console.error('Error fetching podcasts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    fetchPodcasts(searchQuery, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchPodcasts(searchQuery, category);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Function to handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, title: string) => {
    const img = e.target as HTMLImageElement;
    const parent = img.parentElement;
    
    if (parent) {
      // Create fallback content
      parent.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
          <span class="text-2xl font-bold">${title[0]}</span>
        </div>
      `;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for podcasts..."
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="flex space-x-2 items-center">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-0"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
      )}

      {podcasts.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-gray-500">
          <p>No podcasts found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <div key={podcast.id} className="bg-white rounded-lg shadow-md overflow-hidden podcast-card">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="min-w-[80px] h-[80px] rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={podcast.imageUrl}
                      alt={podcast.title}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, podcast.title)}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{podcast.title}</h3>
                    <p className="text-sm text-gray-600">Hosted by {podcast.host}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-600">{podcast.rating}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="category-tag">{podcast.category}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">{podcast.description}</p>
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {podcast.episodeCount} episodes • ~{podcast.averageDuration} min
                  </div>
                  <a 
                    href={podcast.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 podcast-link"
                  >
                    <Play className="w-4 h-4" />
                    <span>Listen on {podcast.platform}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PodcastSearch; 
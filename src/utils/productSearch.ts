import { GoogleGenerativeAI } from '@google/generative-ai';

interface ProductResult {
  title: string;
  link: string;
  snippet: string;
  image: string;
  price?: string;
}

export const searchEcoFriendlyProducts = async (query: string): Promise<ProductResult[]> => {
  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // First, use Gemini to enhance the search query for eco-friendly products
    const prompt = `Enhance this search query to specifically find eco-friendly, sustainable, or green products on e-commerce websites. Include terms like 'buy', 'shop', 'store', 'amazon', 'etsy', 'ebay': ${query}`;
    const result = await model.generateContent(prompt);
    const enhancedQuery = result.response.text();

    // Use Google Custom Search API with both web and image search
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${import.meta.env.VITE_GOOGLE_API_KEY}&cx=${import.meta.env.VITE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(enhancedQuery)}&num=10`;

    console.log('Searching with query:', enhancedQuery);
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.items) {
      console.log('No items found in response:', data);
      return [];
    }

    // Process and return the results
    return data.items.map((item: any) => {
      // Extract price if available in the snippet
      const priceMatch = item.snippet?.match(/\$\d+(\.\d{2})?/);
      const price = priceMatch ? priceMatch[0] : undefined;

      return {
        title: item.title,
        link: item.link,
        snippet: item.snippet || '',
        image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || '',
        price
      };
    });
  } catch (error) {
    console.error('Error searching for products:', error);
    return [];
  }
}; 
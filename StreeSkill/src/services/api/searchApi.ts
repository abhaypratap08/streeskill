// Search & Recommendation API Service
import { API_CONFIG, USE_MOCK_API } from './config';
import { ApiResponse, Course, Product, SearchResult, SearchSuggestion } from './types';
import { courseApi } from './courseApi';
import { marketplaceApi } from './marketplaceApi';

// Popular search terms for autocomplete
const TRENDING_SEARCHES = [
  'mehndi design',
  'embroidery patterns',
  'pickle recipe',
  'candle making',
  'jewelry design',
  'home decor',
  'handmade crafts',
  'cooking tips',
];

export const searchApi = {
  // Search courses, products, and posts
  search: async (query: string): Promise<ApiResponse<SearchResult>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const lowerQuery = query.toLowerCase();
      
      // Get courses
      const coursesResult = await courseApi.getCourses();
      const courses = coursesResult.data?.filter(c => 
        c.title.toLowerCase().includes(lowerQuery) || 
        c.description.toLowerCase().includes(lowerQuery) ||
        c.category.toLowerCase().includes(lowerQuery)
      ) || [];
      
      // Get products
      const productsResult = await marketplaceApi.getProducts();
      const products = productsResult.data?.filter(p => 
        p.title.toLowerCase().includes(lowerQuery) || 
        p.description.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
      ) || [];
      
      return { 
        success: true, 
        data: { courses, products, posts: [] } 
      };
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  // Get search suggestions (autocomplete)
  getSuggestions: async (query: string): Promise<ApiResponse<SearchSuggestion[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const lowerQuery = query.toLowerCase();
      
      const suggestions: SearchSuggestion[] = [];
      
      // Add matching trending searches
      TRENDING_SEARCHES.forEach(term => {
        if (term.includes(lowerQuery)) {
          suggestions.push({ text: term, type: 'trending' });
        }
      });
      
      // Add course-based suggestions
      const coursesResult = await courseApi.getCourses();
      coursesResult.data?.forEach(course => {
        if (course.title.toLowerCase().includes(lowerQuery)) {
          suggestions.push({ text: course.title, type: 'course' });
        }
      });
      
      return { success: true, data: suggestions.slice(0, 8) };
    }
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`);
      return response.json();
    } catch {
      return { success: true, data: [] };
    }
  },

  // Get recommended courses based on user activity
  getRecommendations: async (): Promise<ApiResponse<Course[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const coursesResult = await courseApi.getCourses();
      // Return top rated courses as recommendations
      const recommended = coursesResult.data?.sort((a, b) => b.rating - a.rating).slice(0, 5) || [];
      return { success: true, data: recommended };
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/recommendations`);
    return response.json();
  },

  // Get trending/popular content
  getTrending: async (): Promise<ApiResponse<{ courses: Course[]; searches: string[] }>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const coursesResult = await courseApi.getCourses();
      const trending = coursesResult.data?.sort((a, b) => b.enrolledCount - a.enrolledCount).slice(0, 3) || [];
      return { 
        success: true, 
        data: { 
          courses: trending, 
          searches: TRENDING_SEARCHES.slice(0, 5) 
        } 
      };
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/trending`);
    return response.json();
  },
};

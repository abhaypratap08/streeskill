import { API_CONFIG, USE_MOCK_API, getHeaders } from './config';
import { ApiResponse } from './types';
import { authApi } from './authApi';

export interface YouTubeShort {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  videoUrl: string;
  duration?: string;
  viewCount?: string;
  likeCount?: string;
}

export interface YouTubeShortsResponse {
  data: YouTubeShort[];
  source: 'youtube' | 'mock';
}

// Skill categories for YouTube Shorts
export type SkillCategory = 
  | 'tailoring' | 'embroidery' | 'knitting' | 'mehendi' 
  | 'baking' | 'beauty' | 'packaging' | 'beadwork' 
  | 'macrame' | 'candles' | 'quilling' | 'meesho' 
  | 'cooking' | 'pottery' | 'rangoli' | 'soap';

const MOCK_CATEGORY_LABELS: Record<SkillCategory, string> = {
  tailoring: 'Tailoring',
  embroidery: 'Embroidery',
  knitting: 'Knitting',
  mehendi: 'Mehendi',
  baking: 'Baking',
  beauty: 'Beauty',
  packaging: 'Packaging',
  beadwork: 'Beadwork',
  macrame: 'Macrame',
  candles: 'Candles',
  quilling: 'Quilling',
  meesho: 'Online Selling',
  cooking: 'Cooking',
  pottery: 'Pottery',
  rangoli: 'Rangoli',
  soap: 'Soap Making',
};

const MOCK_CHANNELS: Record<SkillCategory, string> = {
  tailoring: 'StreeSkill Tailoring',
  embroidery: 'StreeSkill Embroidery',
  knitting: 'StreeSkill Knitting',
  mehendi: 'StreeSkill Mehendi',
  baking: 'StreeSkill Baking',
  beauty: 'StreeSkill Beauty',
  packaging: 'StreeSkill Packaging',
  beadwork: 'StreeSkill Beadwork',
  macrame: 'StreeSkill Macrame',
  candles: 'StreeSkill Candles',
  quilling: 'StreeSkill Quilling',
  meesho: 'StreeSkill Business',
  cooking: 'StreeSkill Cooking',
  pottery: 'StreeSkill Pottery',
  rangoli: 'StreeSkill Rangoli',
  soap: 'StreeSkill Soap Studio',
};

const MOCK_VIDEO_IDS: Record<SkillCategory, string[]> = {
  tailoring: ['amWLrZwSPmc', 'rUbqo0XQGAI', 'ZJy7Dz3FJWQ'],
  embroidery: ['w1vHpKiPbFo', 'grKJsPbfDzs', 'xyHmPyKqaJM'],
  knitting: ['GcOzdAzmtNM', 'eqca4DwFsbc', 'GcOzdAzmtNM'],
  mehendi: ['qkLH_jWLXZk', 'Yz8koS0Z3BA', 'bJzLqGcqPeo'],
  baking: ['rj6JOKrL_vg', 'rj6JOKrL_vg', 'rj6JOKrL_vg'],
  beauty: ['xDwQ0VjE_HU', 'LYpKlXBXbio', 'xDwQ0VjE_HU'],
  packaging: ['LdLvp630plc', 'LdLvp630plc', 'LdLvp630plc'],
  beadwork: ['Ks8WH3xUo_E', 'Ks8WH3xUo_E', 'Ks8WH3xUo_E'],
  macrame: ['Ks8WH3xUo_E', 'Ks8WH3xUo_E', 'Ks8WH3xUo_E'],
  candles: ['nESKgdBXJsI', 'LdLvp630plc', 'nESKgdBXJsI'],
  quilling: ['Ks8WH3xUo_E', 'Ks8WH3xUo_E', 'Ks8WH3xUo_E'],
  meesho: ['rj6JOKrL_vg', 'rj6JOKrL_vg', 'rj6JOKrL_vg'],
  cooking: ['rj6JOKrL_vg', 'rj6JOKrL_vg', 'rj6JOKrL_vg'],
  pottery: ['Ks8WH3xUo_E', 'Ks8WH3xUo_E', 'Ks8WH3xUo_E'],
  rangoli: ['5xLAKrLlpVE', '5xLAKrLlpVE', '5xLAKrLlpVE'],
  soap: ['LdLvp630plc', 'LdLvp630plc', 'LdLvp630plc'],
};

const DASHBOARD_CATEGORIES: SkillCategory[] = [
  'mehendi',
  'embroidery',
  'tailoring',
  'baking',
  'beauty',
  'candles',
];

const buildMockShorts = (
  category: SkillCategory,
  maxResults: number
): YouTubeShort[] => {
  const label = MOCK_CATEGORY_LABELS[category];
  const channelTitle = MOCK_CHANNELS[category];
  const videoIds = MOCK_VIDEO_IDS[category];

  return Array.from({ length: maxResults }, (_, index) => {
    const videoId = videoIds[index % videoIds.length] ?? videoIds[0];
    if (!videoId) {
      return {
        id: `${category}-${index + 1}`,
        title: `${label} Tutorial ${index + 1}`,
        description: `Quick ${label.toLowerCase()} lesson for StreeSkill learners.`,
        thumbnail: '',
        channelTitle,
        publishedAt: `2024-01-${String((index % 9) + 1).padStart(2, '0')}T00:00:00.000Z`,
        videoUrl: '',
        duration: '0:45',
        viewCount: `${1200 + index * 137}`,
        likeCount: `${240 + index * 29}`,
      };
    }

    return {
      id: videoId,
      title: `${label} Tutorial ${index + 1}`,
      description: `Quick ${label.toLowerCase()} lesson for StreeSkill learners.`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle,
      publishedAt: `2024-01-${String((index % 9) + 1).padStart(2, '0')}T00:00:00.000Z`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      duration: '0:45',
      viewCount: `${1200 + index * 137}`,
      likeCount: `${240 + index * 29}`,
    };
  });
};

const buildMockResponse = (
  category: SkillCategory,
  maxResults: number
): ApiResponse<YouTubeShortsResponse> => ({
  success: true,
  data: {
    data: buildMockShorts(category, maxResults),
    source: 'mock',
  },
});

const findCategoryFromQuery = (query: string): SkillCategory => {
  const lowerQuery = query.toLowerCase();
  const matchedEntry = Object.entries(MOCK_CATEGORY_LABELS).find(
    ([category, label]) =>
      lowerQuery.includes(category) || lowerQuery.includes(label.toLowerCase())
  );

  return (matchedEntry?.[0] as SkillCategory | undefined) ?? 'mehendi';
};

const getDefaultMockShort = (videoId = 'qkLH_jWLXZk'): YouTubeShort => ({
  id: videoId,
  title: 'Mehendi Tutorial 1',
  description: 'Quick mehendi lesson for StreeSkill learners.',
  thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  channelTitle: 'StreeSkill Mehendi',
  publishedAt: '2024-01-01T00:00:00.000Z',
  videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  duration: '0:45',
  viewCount: '1200',
  likeCount: '240',
});

/**
 * YouTube Shorts API for fetching skill tutorial videos
 */
export const youtubeApi = {
  /**
   * Get YouTube Shorts for a specific skill category
   */
  getShortsByCategory: async (
    category: SkillCategory, 
    maxResults: number = 10
  ): Promise<ApiResponse<YouTubeShortsResponse>> => {
    if (USE_MOCK_API) {
      return buildMockResponse(category, maxResults);
    }

    try {
      const token = await authApi.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/youtube/shorts/${category}?maxResults=${maxResults}`,
        { headers: getHeaders(token || undefined) }
      );
      return response.json();
    } catch (error) {
      console.error('Error fetching YouTube shorts:', error);
      return buildMockResponse(category, maxResults);
    }
  },

  /**
   * Search YouTube Shorts by custom query
   */
  searchShorts: async (
    query: string, 
    maxResults: number = 10
  ): Promise<ApiResponse<YouTubeShortsResponse>> => {
    if (USE_MOCK_API) {
      return buildMockResponse(findCategoryFromQuery(query), maxResults);
    }

    try {
      const token = await authApi.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        { headers: getHeaders(token || undefined) }
      );
      return response.json();
    } catch (error) {
      console.error('Error searching YouTube shorts:', error);
      return buildMockResponse(findCategoryFromQuery(query), maxResults);
    }
  },

  /**
   * Get video details by ID
   */
  getVideoDetails: async (videoId: string): Promise<ApiResponse<YouTubeShort>> => {
    if (USE_MOCK_API) {
      const fallbackShort =
        buildMockShorts('mehendi', 1)[0] ?? null;
      if (!fallbackShort) {
        return { success: false, error: 'Video not found' };
      }

      return {
        success: true,
        data: {
          ...fallbackShort,
          id: videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        },
      };
    }

    try {
      const token = await authApi.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/youtube/video/${videoId}`,
        { headers: getHeaders(token || undefined) }
      );
      return response.json();
    } catch (error) {
      console.error('Error fetching video details:', error);
      const fallbackShort = buildMockShorts('mehendi', 1)[0] ?? getDefaultMockShort(videoId);
      return {
        success: true,
        data: {
          ...fallbackShort,
          id: videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        },
      };
    }
  },

  /**
   * Get trending skill tutorial shorts
   */
  getTrendingShorts: async (maxResults: number = 20): Promise<ApiResponse<YouTubeShortsResponse>> => {
    if (USE_MOCK_API) {
      const data = DASHBOARD_CATEGORIES.flatMap((category) =>
        buildMockShorts(category, Math.max(1, Math.ceil(maxResults / DASHBOARD_CATEGORIES.length)))
      ).slice(0, maxResults);

      return {
        success: true,
        data: {
          data,
          source: 'mock',
        },
      };
    }

    try {
      const token = await authApi.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/youtube/trending?maxResults=${maxResults}`,
        { headers: getHeaders(token || undefined) }
      );
      return response.json();
    } catch (error) {
      console.error('Error fetching trending shorts:', error);
      const data = DASHBOARD_CATEGORIES.flatMap((category) =>
        buildMockShorts(category, Math.max(1, Math.ceil(maxResults / DASHBOARD_CATEGORIES.length)))
      ).slice(0, maxResults);

      return {
        success: true,
        data: {
          data,
          source: 'mock',
        },
      };
    }
  },

  /**
   * Get shorts for multiple categories (for dashboard)
   */
  getShortsForDashboard: async (): Promise<Record<SkillCategory, YouTubeShort[]>> => {
    const categories: SkillCategory[] = [...DASHBOARD_CATEGORIES];
    const results: Record<string, YouTubeShort[]> = {};

    await Promise.all(
      categories.map(async (category) => {
        const response = await youtubeApi.getShortsByCategory(category, 5);
        if (response.success && response.data) {
          results[category] = response.data.data;
        } else {
          results[category] = [];
        }
      })
    );

    return results as Record<SkillCategory, YouTubeShort[]>;
  },

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId: (url: string): string | null => {
    if (url.startsWith('youtube:')) {
      return url.replace('youtube:', '');
    }
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1] ?? null;
    }

    return null;
  },

  /**
   * Get YouTube thumbnail URL for a video ID
   */
  getThumbnailUrl: (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string => {
    const qualityMap = {
      default: 'default',
      medium: 'mqdefault',
      high: 'hqdefault',
      maxres: 'maxresdefault',
    };
    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
  },

  /**
   * Format video URL for the player
   */
  formatVideoUrl: (videoId: string): string => {
    return `youtube:${videoId}`;
  },
};

export default youtubeApi;

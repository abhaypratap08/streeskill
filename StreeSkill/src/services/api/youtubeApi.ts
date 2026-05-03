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

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const hasYouTubeApiKey = () => API_CONFIG.YOUTUBE_API_KEY.trim() !== '';

const SKILL_SEARCH_QUERIES: Record<SkillCategory, string> = {
  tailoring: 'tailoring tutorial hindi silai machine blouse cutting',
  embroidery: 'hand embroidery tutorial hindi kadhai design',
  knitting: 'knitting crochet tutorial hindi bunai beginner',
  mehendi: 'mehndi design tutorial hindi simple beginners',
  baking: 'cake baking decoration tutorial hindi home business',
  beauty: 'beauty parlour tutorial hindi facial makeup threading',
  packaging: 'gift wrapping packaging tutorial hindi handmade products',
  beadwork: 'beaded jewelry making tutorial hindi earrings bracelet',
  macrame: 'macrame wall hanging tutorial hindi beginner',
  candles: 'candle making tutorial hindi scented candles diy',
  quilling: 'paper quilling tutorial hindi flowers jewelry',
  meesho: 'meesho selling tutorial hindi online business product listing',
  cooking: 'home cooking business tutorial hindi tiffin snacks',
  pottery: 'pottery clay art tutorial hindi diya making',
  rangoli: 'rangoli kolam design tutorial hindi simple',
  soap: 'soap making tutorial hindi homemade natural soap',
};

const coerceMaxResults = (maxResults: number): string =>
  String(Math.min(Math.max(Math.floor(maxResults), 1), 25));

const formatIsoDuration = (duration: string): string => {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) {
    return duration;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const totalMinutes = hours * 60 + minutes;

  return `${totalMinutes}:${String(seconds).padStart(2, '0')}`;
};

const mapYouTubeSearchItems = (items: unknown): YouTubeShort[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item): YouTubeShort[] => {
    if (typeof item !== 'object' || item === null) {
      return [];
    }

    const raw = item as Record<string, unknown>;
    const id = raw['id'];
    const snippet = raw['snippet'];
    const videoId =
      typeof id === 'object' &&
      id !== null &&
      typeof (id as Record<string, unknown>)['videoId'] === 'string'
        ? (id as Record<string, string>)['videoId']
        : undefined;

    if (typeof videoId !== 'string' || typeof snippet !== 'object' || snippet === null) {
      return [];
    }

    const rawSnippet = snippet as Record<string, unknown>;
    const thumbnails = rawSnippet['thumbnails'];
    const highThumbnail =
      typeof thumbnails === 'object' &&
      thumbnails !== null &&
      typeof (thumbnails as Record<string, unknown>)['high'] === 'object' &&
      (thumbnails as Record<string, unknown>)['high'] !== null
        ? ((thumbnails as Record<string, unknown>)['high'] as Record<string, unknown>)['url']
        : undefined;
    const mediumThumbnail =
      typeof thumbnails === 'object' &&
      thumbnails !== null &&
      typeof (thumbnails as Record<string, unknown>)['medium'] === 'object' &&
      (thumbnails as Record<string, unknown>)['medium'] !== null
        ? ((thumbnails as Record<string, unknown>)['medium'] as Record<string, unknown>)['url']
        : undefined;

    return [{
      id: videoId,
      title: typeof rawSnippet['title'] === 'string' ? rawSnippet['title'] : 'YouTube Tutorial',
      description: typeof rawSnippet['description'] === 'string' ? rawSnippet['description'] : '',
      thumbnail:
        typeof highThumbnail === 'string'
          ? highThumbnail
          : typeof mediumThumbnail === 'string'
            ? mediumThumbnail
            : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: typeof rawSnippet['channelTitle'] === 'string' ? rawSnippet['channelTitle'] : 'YouTube',
      publishedAt: typeof rawSnippet['publishedAt'] === 'string' ? rawSnippet['publishedAt'] : '',
      videoUrl: `youtube:${videoId}`,
    }];
  });
};

const fetchYouTubeSearch = async (
  query: string,
  maxResults: number,
  order: 'relevance' | 'viewCount' = 'relevance'
): Promise<YouTubeShort[]> => {
  const params = new URLSearchParams({
    part: 'snippet',
    q: `${query} tutorial`,
    type: 'video',
    videoDuration: 'short',
    maxResults: coerceMaxResults(maxResults),
    regionCode: 'IN',
    relevanceLanguage: 'hi',
    safeSearch: 'strict',
    order,
    key: API_CONFIG.YOUTUBE_API_KEY,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`YouTube search failed with ${response.status}`);
  }

  const payload: unknown = await response.json();
  const items =
    typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)['items']
      : undefined;

  return mapYouTubeSearchItems(items);
};

const fetchYouTubeVideoDetails = async (videoId: string): Promise<YouTubeShort | undefined> => {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoId,
    key: API_CONFIG.YOUTUBE_API_KEY,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`YouTube video details failed with ${response.status}`);
  }

  const payload: unknown = await response.json();
  const items =
    typeof payload === 'object' && payload !== null && Array.isArray((payload as Record<string, unknown>)['items'])
      ? ((payload as Record<string, unknown>)['items'] as unknown[])
      : [];
  const video = items[0];

  if (typeof video !== 'object' || video === null) {
    return undefined;
  }

  const raw = video as Record<string, unknown>;
  const snippet = raw['snippet'];
  const contentDetails = raw['contentDetails'];
  const statistics = raw['statistics'];

  if (typeof snippet !== 'object' || snippet === null) {
    return undefined;
  }

  const rawSnippet = snippet as Record<string, unknown>;
  const rawContentDetails =
    typeof contentDetails === 'object' && contentDetails !== null
      ? contentDetails as Record<string, unknown>
      : {};
  const rawStatistics =
    typeof statistics === 'object' && statistics !== null
      ? statistics as Record<string, unknown>
      : {};

  const duration = typeof rawContentDetails['duration'] === 'string'
    ? formatIsoDuration(rawContentDetails['duration'])
    : undefined;
  const viewCount = typeof rawStatistics['viewCount'] === 'string' ? rawStatistics['viewCount'] : undefined;
  const likeCount = typeof rawStatistics['likeCount'] === 'string' ? rawStatistics['likeCount'] : undefined;

  return {
    id: videoId,
    title: typeof rawSnippet['title'] === 'string' ? rawSnippet['title'] : 'YouTube Tutorial',
    description: typeof rawSnippet['description'] === 'string' ? rawSnippet['description'] : '',
    thumbnail: youtubeApi.getThumbnailUrl(videoId),
    channelTitle: typeof rawSnippet['channelTitle'] === 'string' ? rawSnippet['channelTitle'] : 'YouTube',
    publishedAt: typeof rawSnippet['publishedAt'] === 'string' ? rawSnippet['publishedAt'] : '',
    videoUrl: `youtube:${videoId}`,
    ...(duration !== undefined ? { duration } : {}),
    ...(viewCount !== undefined ? { viewCount } : {}),
    ...(likeCount !== undefined ? { likeCount } : {}),
  };
};

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

const normalizeShortsResponse = (
  value: unknown,
  fallbackCategory: SkillCategory,
  fallbackMaxResults: number
): ApiResponse<YouTubeShortsResponse> => {
  if (typeof value !== 'object' || value === null) {
    return buildMockResponse(fallbackCategory, fallbackMaxResults);
  }

  const raw = value as Record<string, unknown>;
  if (raw['success'] !== true) {
    return {
      success: false,
      error: typeof raw['error'] === 'string' ? raw['error'] : 'YouTube request failed',
    };
  }

  const source = raw['source'] === 'youtube' ? 'youtube' : 'mock';
  const data = raw['data'];

  if (Array.isArray(data)) {
    return {
      success: true,
      data: {
        data: data.filter((entry): entry is YouTubeShort => typeof entry === 'object' && entry !== null) as YouTubeShort[],
        source,
      },
    };
  }

  if (typeof data === 'object' && data !== null) {
    const nested = data as Record<string, unknown>;
    const nestedData = nested['data'];
    const nestedSource = nested['source'] === 'youtube' ? 'youtube' : source;
    if (Array.isArray(nestedData)) {
      return {
        success: true,
        data: {
          data: nestedData.filter((entry): entry is YouTubeShort => typeof entry === 'object' && entry !== null) as YouTubeShort[],
          source: nestedSource,
        },
      };
    }
  }

  return buildMockResponse(fallbackCategory, fallbackMaxResults);
};

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
    if (hasYouTubeApiKey()) {
      try {
        const data = await fetchYouTubeSearch(SKILL_SEARCH_QUERIES[category], maxResults);
        return {
          success: true,
          data: {
            data,
            source: 'youtube',
          },
        };
      } catch (error) {
        console.error('Error fetching YouTube shorts:', error);
        return buildMockResponse(category, maxResults);
      }
    }

    if (USE_MOCK_API) {
      return buildMockResponse(category, maxResults);
    }

    try {
      const token = await authApi.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/youtube/shorts/${category}?maxResults=${maxResults}`,
        { headers: getHeaders(token || undefined) }
      );
      return normalizeShortsResponse(await response.json(), category, maxResults);
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
    if (hasYouTubeApiKey()) {
      try {
        const data = await fetchYouTubeSearch(query, maxResults);
        return {
          success: true,
          data: {
            data,
            source: 'youtube',
          },
        };
      } catch (error) {
        console.error('Error searching YouTube shorts:', error);
        return buildMockResponse(findCategoryFromQuery(query), maxResults);
      }
    }

    if (USE_MOCK_API) {
      return buildMockResponse(findCategoryFromQuery(query), maxResults);
    }

    try {
      const token = await authApi.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        { headers: getHeaders(token || undefined) }
      );
      return normalizeShortsResponse(await response.json(), findCategoryFromQuery(query), maxResults);
    } catch (error) {
      console.error('Error searching YouTube shorts:', error);
      return buildMockResponse(findCategoryFromQuery(query), maxResults);
    }
  },

  /**
   * Get video details by ID
   */
  getVideoDetails: async (videoId: string): Promise<ApiResponse<YouTubeShort>> => {
    if (hasYouTubeApiKey()) {
      try {
        const data = await fetchYouTubeVideoDetails(videoId);
        return data
          ? { success: true, data }
          : { success: false, error: 'Video not found' };
      } catch (error) {
        console.error('Error fetching video details:', error);
        const fallbackShort = buildMockShorts('mehendi', 1)[0] ?? getDefaultMockShort(videoId);
        return {
          success: true,
          data: {
            ...fallbackShort,
            id: videoId,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            videoUrl: `youtube:${videoId}`,
          },
        };
      }
    }

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
    if (hasYouTubeApiKey()) {
      try {
        const data = await fetchYouTubeSearch('women skill tutorial hindi handicraft home business', maxResults, 'viewCount');
        return {
          success: true,
          data: {
            data,
            source: 'youtube',
          },
        };
      } catch (error) {
        console.error('Error fetching trending shorts:', error);
      }
    }

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
      return normalizeShortsResponse(await response.json(), 'mehendi', maxResults);
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

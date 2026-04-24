const express = require('express');
const pool = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

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

// GET /search - Search courses, products, posts
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: { courses: [], products: [], posts: [] } });
    }

    const searchTerm = `%${q}%`;

    // Search courses
    const [courses] = await pool.query(`
      SELECT * FROM courses 
      WHERE title LIKE ? OR description LIKE ? OR category LIKE ?
      ORDER BY rating DESC LIMIT 10
    `, [searchTerm, searchTerm, searchTerm]);

    // Search products
    const [products] = await pool.query(`
      SELECT * FROM products 
      WHERE status = 'active' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)
      ORDER BY created_at DESC LIMIT 10
    `, [searchTerm, searchTerm, searchTerm]);

    // Search posts
    const [posts] = await pool.query(`
      SELECT p.*, u.name as user_name, u.avatar as user_avatar
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.title LIKE ? OR p.content LIKE ?
      ORDER BY p.created_at DESC LIMIT 10
    `, [searchTerm, searchTerm]);

    res.json({
      success: true,
      data: {
        courses: courses.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          thumbnail: c.thumbnail,
          category: c.category,
          duration: c.duration,
          instructor: c.instructor,
          rating: parseFloat(c.rating),
          enrolledCount: c.enrolled_count,
          createdAt: c.created_at
        })),
        products: products.map(p => ({
          id: p.id,
          userId: p.user_id,
          title: p.title,
          description: p.description,
          price: parseFloat(p.price),
          images: p.images ? JSON.parse(p.images) : [],
          category: p.category,
          status: p.status,
          createdAt: p.created_at
        })),
        posts: posts.map(p => ({
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          userAvatar: p.user_avatar,
          title: p.title,
          content: p.content,
          category: p.category,
          upvotes: p.upvotes,
          downvotes: p.downvotes,
          createdAt: p.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /search/suggestions - Autocomplete suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q.toLowerCase()}%`;
    const suggestions = [];

    // Add matching trending searches
    TRENDING_SEARCHES.forEach(term => {
      if (term.includes(q.toLowerCase())) {
        suggestions.push({ text: term, type: 'trending' });
      }
    });

    // Add course-based suggestions
    const [courses] = await pool.query(
      'SELECT title FROM courses WHERE LOWER(title) LIKE ? LIMIT 5',
      [searchTerm]
    );
    courses.forEach(c => {
      suggestions.push({ text: c.title, type: 'course' });
    });

    res.json({ success: true, data: suggestions.slice(0, 8) });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /recommendations - Recommended courses
router.get('/recommendations', optionalAuth, async (req, res) => {
  try {
    const [courses] = await pool.query(
      'SELECT * FROM courses ORDER BY rating DESC, enrolled_count DESC LIMIT 5'
    );

    const formattedCourses = courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      category: c.category,
      duration: c.duration,
      instructor: c.instructor,
      rating: parseFloat(c.rating),
      enrolledCount: c.enrolled_count,
      createdAt: c.created_at
    }));

    res.json({ success: true, data: formattedCourses });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /trending - Trending content
router.get('/trending', async (req, res) => {
  try {
    const [courses] = await pool.query(
      'SELECT * FROM courses ORDER BY enrolled_count DESC LIMIT 3'
    );

    const formattedCourses = courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      category: c.category,
      duration: c.duration,
      instructor: c.instructor,
      rating: parseFloat(c.rating),
      enrolledCount: c.enrolled_count,
      createdAt: c.created_at
    }));

    res.json({
      success: true,
      data: {
        courses: formattedCourses,
        searches: TRENDING_SEARCHES.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

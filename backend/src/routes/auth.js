const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { formatUser } = require('../utils/userSerializer');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await pool.query(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [userId, email, hashedPassword, name]
    );

    // Create default preferences
    await pool.query(
      'INSERT INTO user_preferences (user_id, caption_languages) VALUES (?, ?)',
      [userId, JSON.stringify(['Hindi', 'English', 'Tamil'])]
    );

    // Create default stats
    await pool.query(
      'INSERT INTO user_stats (user_id) VALUES (?)',
      [userId]
    );

    // Generate token
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        user: formatUser(
          { id: userId, email, name, createdAt: new Date().toISOString() },
          { caption_languages: JSON.stringify(['Hindi', 'English', 'Tamil']) }
        ),
        tokens: { accessToken, refreshToken, expiresIn: 604800 }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Get preferences
    const [prefs] = await pool.query('SELECT * FROM user_preferences WHERE user_id = ?', [user.id]);

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        user: {
          ...formatUser(user, prefs[0] || {})
        },
        tokens: { accessToken, refreshToken, expiresIn: 604800 }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  // In a real app, you'd invalidate the token here
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If email exists, reset link sent' });
    }

    // In real app, send email with reset link
    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, name, avatar, created_at FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const [prefs] = await pool.query('SELECT * FROM user_preferences WHERE user_id = ?', [req.userId]);

    res.json({
      success: true,
      data: formatUser(users[0], prefs[0] || {})
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

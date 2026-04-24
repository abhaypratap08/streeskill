const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { formatPreferences, formatUser } = require('../utils/userSerializer');

const router = express.Router();

// GET /user/progress
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const [progress] = await pool.query(
      `SELECT course_id, GROUP_CONCAT(reel_id) as completed_reels 
       FROM user_progress WHERE user_id = ? GROUP BY course_id`,
      [req.userId]
    );

    const result = {};
    for (const p of progress) {
      const [totalReels] = await pool.query('SELECT COUNT(*) as count FROM reels WHERE course_id = ?', [p.course_id]);
      const completedReels = p.completed_reels ? p.completed_reels.split(',') : [];
      
      result[p.course_id] = {
        courseId: p.course_id,
        completedReels,
        progressPercent: Math.round((completedReels.length / totalReels[0].count) * 100)
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /user/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (avatar) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length > 0) {
      params.push(req.userId);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [users] = await pool.query('SELECT id, email, name, avatar, created_at FROM users WHERE id = ?', [req.userId]);
    const [prefs] = await pool.query('SELECT * FROM user_preferences WHERE user_id = ?', [req.userId]);

    res.json({
      success: true,
      data: formatUser(users[0], prefs[0] || {}),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /user/password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!validPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /user/settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { notifications, autoPlay, downloadOverWifi, language, captionLanguages } = req.body;
    const updates = [];
    const params = [];

    if (notifications !== undefined) { updates.push('notifications = ?'); params.push(notifications); }
    if (autoPlay !== undefined) { updates.push('auto_play = ?'); params.push(autoPlay); }
    if (downloadOverWifi !== undefined) { updates.push('download_over_wifi = ?'); params.push(downloadOverWifi); }
    if (language) { updates.push('language = ?'); params.push(language); }
    if (captionLanguages) { updates.push('caption_languages = ?'); params.push(JSON.stringify(captionLanguages)); }

    if (updates.length > 0) {
      params.push(req.userId);
      await pool.query(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`, params);
    }

    const [prefs] = await pool.query('SELECT * FROM user_preferences WHERE user_id = ?', [req.userId]);

    res.json({
      success: true,
      data: formatPreferences(prefs[0]),
      message: 'Settings updated'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /user/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [stats] = await pool.query('SELECT * FROM user_stats WHERE user_id = ?', [req.userId]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: { totalSessions: 0, minutesLearned: 0, longestStreak: 0, currentStreak: 0, coursesCompleted: 0, coursesInProgress: 0 }
      });
    }

    // Count completed and in-progress courses
    const [progress] = await pool.query(
      `SELECT course_id, COUNT(DISTINCT reel_id) as completed 
       FROM user_progress WHERE user_id = ? GROUP BY course_id`,
      [req.userId]
    );

    let coursesCompleted = 0;
    let coursesInProgress = 0;

    for (const p of progress) {
      const [totalReels] = await pool.query('SELECT COUNT(*) as count FROM reels WHERE course_id = ?', [p.course_id]);
      if (p.completed >= totalReels[0].count) {
        coursesCompleted++;
      } else if (p.completed > 0) {
        coursesInProgress++;
      }
    }

    res.json({
      success: true,
      data: {
        totalSessions: stats[0].total_sessions,
        minutesLearned: stats[0].minutes_learned,
        longestStreak: stats[0].longest_streak,
        currentStreak: stats[0].current_streak,
        coursesCompleted,
        coursesInProgress
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

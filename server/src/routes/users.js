const express = require('express');
const db      = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/history  — recent play history for the logged-in user
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        ph.id          AS history_id,
        ph.played_at,
        t.id           AS track_id,
        t.title,
        t.duration_seconds,
        ar.name        AS artist_name,
        ar.image_url   AS artist_image,
        al.title       AS album_title,
        al.cover_url   AS album_cover
      FROM play_history ph
      JOIN tracks  t  ON t.id  = ph.track_id
      JOIN artists ar ON ar.id = t.artist_id
      LEFT JOIN albums al ON al.id = t.album_id
      WHERE ph.user_id = $1
      ORDER BY ph.played_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/liked  — liked tracks
router.get('/liked', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        t.*,
        ar.name      AS artist_name,
        ar.image_url AS artist_image,
        al.title     AS album_title,
        al.cover_url AS album_cover,
        lt.liked_at
      FROM liked_tracks lt
      JOIN tracks  t  ON t.id  = lt.track_id
      JOIN artists ar ON ar.id = t.artist_id
      LEFT JOIN albums al ON al.id = t.album_id
      WHERE lt.user_id = $1
      ORDER BY lt.liked_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/following  — artists user follows
router.get('/following', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.*,
        f.followed_at,
        COUNT(DISTINCT t.id) AS track_count
      FROM follows f
      JOIN artists a ON a.id = f.artist_id
      LEFT JOIN tracks t ON t.artist_id = a.id
      WHERE f.user_id = $1
      GROUP BY a.id, f.followed_at
      ORDER BY f.followed_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

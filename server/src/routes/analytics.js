const express = require('express');
const db      = require('../db');

const router = express.Router();

// GET /api/analytics/top-tracks  — globally most played tracks
router.get('/top-tracks', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  try {
    const result = await db.query(`
      SELECT
        t.id,
        t.title,
        t.duration_seconds,
        t.audio_url,
        ar.id        AS artist_id,
        ar.name      AS artist_name,
        al.title     AS album_title,
        al.cover_url AS album_cover,
        COUNT(ph.id) AS play_count
      FROM tracks t
      JOIN artists ar ON ar.id = t.artist_id
      LEFT JOIN albums al ON al.id = t.album_id
      LEFT JOIN play_history ph ON ph.track_id = t.id
      GROUP BY t.id, ar.id, al.id
      ORDER BY play_count DESC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/top-artists  — artists ranked by total plays
router.get('/top-artists', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  try {
    const result = await db.query(`
      SELECT
        ar.id,
        ar.name,
        ar.image_url,
        ar.genre,
        COUNT(DISTINCT ph.id)   AS total_plays,
        COUNT(DISTINCT f.user_id) AS follower_count
      FROM artists ar
      LEFT JOIN tracks t ON t.artist_id = ar.id
      LEFT JOIN play_history ph ON ph.track_id = t.id
      LEFT JOIN follows f ON f.artist_id = ar.id
      GROUP BY ar.id
      ORDER BY total_plays DESC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/genre-breakdown  — play counts grouped by genre
router.get('/genre-breakdown', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        ar.genre,
        COUNT(DISTINCT ar.id)  AS artist_count,
        COUNT(DISTINCT t.id)   AS track_count,
        COUNT(ph.id)           AS total_plays
      FROM artists ar
      LEFT JOIN tracks t ON t.artist_id = ar.id
      LEFT JOIN play_history ph ON ph.track_id = t.id
      WHERE ar.genre IS NOT NULL
      GROUP BY ar.genre
      ORDER BY total_plays DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/recent-activity  — platform-wide recent plays
router.get('/recent-activity', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        ph.played_at,
        u.username,
        t.title      AS track_title,
        ar.name      AS artist_name,
        al.cover_url AS album_cover
      FROM play_history ph
      JOIN users   u  ON u.id  = ph.user_id
      JOIN tracks  t  ON t.id  = ph.track_id
      JOIN artists ar ON ar.id = t.artist_id
      LEFT JOIN albums al ON al.id = t.album_id
      ORDER BY ph.played_at DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

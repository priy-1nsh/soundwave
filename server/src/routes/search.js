const express = require('express');
const db      = require('../db');

const router = express.Router();

// GET /api/search?q=query  — search across artists, albums, tracks
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ artists: [], albums: [], tracks: [] });

  const term = `%${q.trim()}%`;
  try {
    const [artistsRes, albumsRes, tracksRes] = await Promise.all([
      db.query(`
        SELECT a.*, COUNT(DISTINCT f.user_id) AS follower_count
        FROM artists a
        LEFT JOIN follows f ON f.artist_id = a.id
        WHERE a.name ILIKE $1 OR a.genre ILIKE $1
        GROUP BY a.id
        LIMIT 5
      `, [term]),

      db.query(`
        SELECT al.*, ar.name AS artist_name
        FROM albums al
        JOIN artists ar ON ar.id = al.artist_id
        WHERE al.title ILIKE $1 OR ar.name ILIKE $1
        LIMIT 5
      `, [term]),

      db.query(`
        SELECT
          t.*,
          ar.name      AS artist_name,
          al.title     AS album_title,
          al.cover_url AS album_cover,
          COUNT(ph.id) AS play_count
        FROM tracks t
        JOIN artists ar ON ar.id = t.artist_id
        LEFT JOIN albums al ON al.id = t.album_id
        LEFT JOIN play_history ph ON ph.track_id = t.id
        WHERE t.title ILIKE $1 OR ar.name ILIKE $1
        GROUP BY t.id, ar.id, al.id
        ORDER BY play_count DESC
        LIMIT 10
      `, [term]),
    ]);

    res.json({
      artists: artistsRes.rows,
      albums:  albumsRes.rows,
      tracks:  tracksRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

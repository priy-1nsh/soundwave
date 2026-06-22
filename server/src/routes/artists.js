const express = require('express');
const db      = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/artists  — list all with follower count
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.*,
        COUNT(DISTINCT f.user_id)  AS follower_count,
        COUNT(DISTINCT t.id)       AS track_count
      FROM artists a
      LEFT JOIN follows f ON f.artist_id = a.id
      LEFT JOIN tracks  t ON t.artist_id = a.id
      GROUP BY a.id
      ORDER BY follower_count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/artists/:id  — single artist with albums and top tracks
router.get('/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [artistRes, albumsRes, topTracksRes] = await Promise.all([
      db.query(`
        SELECT
          a.*,
          COUNT(DISTINCT f.user_id) AS follower_count,
          COUNT(DISTINCT t.id)      AS track_count
        FROM artists a
        LEFT JOIN follows f ON f.artist_id = a.id
        LEFT JOIN tracks  t ON t.artist_id = a.id
        WHERE a.id = $1
        GROUP BY a.id
      `, [id]),

      db.query(`
        SELECT al.*, COUNT(t.id) AS track_count
        FROM albums al
        LEFT JOIN tracks t ON t.album_id = al.id
        WHERE al.artist_id = $1
        GROUP BY al.id
        ORDER BY al.release_date DESC
      `, [id]),

      // Top 5 tracks by total plays
      db.query(`
        SELECT t.*, COUNT(ph.id) AS play_count
        FROM tracks t
        LEFT JOIN play_history ph ON ph.track_id = t.id
        WHERE t.artist_id = $1
        GROUP BY t.id
        ORDER BY play_count DESC
        LIMIT 5
      `, [id]),
    ]);

    if (!artistRes.rows[0]) return res.status(404).json({ error: 'Artist not found' });

    // Is the logged-in user following this artist?
    let is_following = false;
    if (req.user) {
      const fRes = await db.query(
        'SELECT 1 FROM follows WHERE user_id = $1 AND artist_id = $2',
        [req.user.id, id]
      );
      is_following = fRes.rows.length > 0;
    }

    res.json({
      ...artistRes.rows[0],
      is_following,
      albums: albumsRes.rows,
      top_tracks: topTracksRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/artists/:id/follow   — follow an artist
router.post('/:id/follow', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'INSERT INTO follows (user_id, artist_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, id]
    );
    res.json({ following: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/artists/:id/follow  — unfollow
router.delete('/:id/follow', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'DELETE FROM follows WHERE user_id = $1 AND artist_id = $2',
      [req.user.id, id]
    );
    res.json({ following: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

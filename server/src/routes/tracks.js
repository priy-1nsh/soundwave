const express = require('express');
const db      = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/tracks  — list tracks with artist + album info
router.get('/', async (req, res) => {
  const { search } = req.query;
  try {
    let query = `
      SELECT
        t.*,
        ar.name      AS artist_name,
        ar.image_url AS artist_image,
        al.title     AS album_title,
        al.cover_url AS album_cover,
        COUNT(ph.id) AS play_count
      FROM tracks t
      JOIN artists ar ON ar.id = t.artist_id
      LEFT JOIN albums al ON al.id = t.album_id
      LEFT JOIN play_history ph ON ph.track_id = t.id
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE t.title ILIKE $1 OR ar.name ILIKE $1`;
    }
    query += ` GROUP BY t.id, ar.id, al.id ORDER BY play_count DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tracks/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT
        t.*,
        ar.name      AS artist_name,
        ar.image_url AS artist_image,
        al.title     AS album_title,
        al.cover_url AS album_cover
      FROM tracks t
      JOIN artists ar ON ar.id = t.artist_id
      LEFT JOIN albums al ON al.id = t.album_id
      WHERE t.id = $1
    `, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Track not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tracks/:id/play  — record a play (authenticated)
router.post('/:id/play', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'INSERT INTO play_history (user_id, track_id) VALUES ($1, $2)',
      [req.user.id, id]
    );
    res.json({ recorded: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tracks/:id/like
router.post('/:id/like', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'INSERT INTO liked_tracks (user_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, id]
    );
    res.json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tracks/:id/like
router.delete('/:id/like', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'DELETE FROM liked_tracks WHERE user_id = $1 AND track_id = $2',
      [req.user.id, id]
    );
    res.json({ liked: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

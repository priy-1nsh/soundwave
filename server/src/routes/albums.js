const express = require('express');
const db      = require('../db');

const router = express.Router();

// GET /api/albums  — list all albums with artist info
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        al.*,
        ar.name  AS artist_name,
        ar.image_url AS artist_image,
        COUNT(t.id) AS track_count
      FROM albums al
      JOIN artists ar ON ar.id = al.artist_id
      LEFT JOIN tracks t ON t.album_id = al.id
      GROUP BY al.id, ar.id
      ORDER BY al.release_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/albums/:id  — single album with all tracks
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [albumRes, tracksRes] = await Promise.all([
      db.query(`
        SELECT
          al.*,
          ar.name      AS artist_name,
          ar.image_url AS artist_image,
          ar.genre,
          COUNT(t.id)           AS track_count,
          SUM(t.duration_seconds) AS total_duration
        FROM albums al
        JOIN artists ar ON ar.id = al.artist_id
        LEFT JOIN tracks t ON t.album_id = al.id
        WHERE al.id = $1
        GROUP BY al.id, ar.id
      `, [id]),

      db.query(`
        SELECT
          t.*,
          ar.name AS artist_name,
          COUNT(ph.id) AS play_count
        FROM tracks t
        JOIN artists ar ON ar.id = t.artist_id
        LEFT JOIN play_history ph ON ph.track_id = t.id
        WHERE t.album_id = $1
        GROUP BY t.id, ar.id
        ORDER BY t.track_number
      `, [id]),
    ]);

    if (!albumRes.rows[0]) return res.status(404).json({ error: 'Album not found' });

    res.json({ ...albumRes.rows[0], tracks: tracksRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

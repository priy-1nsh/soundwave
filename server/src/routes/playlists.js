const express = require('express');
const db      = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/playlists  — all public playlists (or user's own)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.*,
        u.username,
        u.display_name,
        COUNT(pt.track_id) AS track_count
      FROM playlists p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
      WHERE p.is_public = TRUE
      GROUP BY p.id, u.id
      ORDER BY p.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/playlists/mine  — current user's playlists
router.get('/mine', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.*,
        COUNT(pt.track_id) AS track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/playlists/:id  — single playlist with tracks
router.get('/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [playlistRes, tracksRes] = await Promise.all([
      db.query(`
        SELECT p.*, u.username, u.display_name, u.avatar_url,
               COUNT(pt.track_id) AS track_count
        FROM playlists p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
        WHERE p.id = $1
        GROUP BY p.id, u.id
      `, [id]),

      db.query(`
        SELECT
          t.*,
          ar.name      AS artist_name,
          ar.image_url AS artist_image,
          al.title     AS album_title,
          al.cover_url AS album_cover,
          pt.position,
          pt.added_at  AS added_to_playlist_at
        FROM playlist_tracks pt
        JOIN tracks  t  ON t.id  = pt.track_id
        JOIN artists ar ON ar.id = t.artist_id
        LEFT JOIN albums al ON al.id = t.album_id
        WHERE pt.playlist_id = $1
        ORDER BY pt.position
      `, [id]),
    ]);

    const playlist = playlistRes.rows[0];
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (!playlist.is_public && (!req.user || req.user.id !== playlist.user_id)) {
      return res.status(403).json({ error: 'Private playlist' });
    }

    res.json({ ...playlist, tracks: tracksRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/playlists  — create
router.post('/', authenticate, async (req, res) => {
  const { name, description, is_public = true } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await db.query(`
      INSERT INTO playlists (user_id, name, description, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, name, description, is_public]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/playlists/:id  — update metadata
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, description, is_public } = req.body;
  try {
    const check = await db.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Playlist not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const result = await db.query(`
      UPDATE playlists
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          is_public   = COALESCE($3, is_public),
          updated_at  = NOW()
      WHERE id = $4
      RETURNING *
    `, [name, description, is_public, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/playlists/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const check = await db.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Playlist not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await db.query('DELETE FROM playlists WHERE id = $1', [id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/playlists/:id/tracks  — add a track
//
// Three statements (read next position → insert link row → bump updated_at)
// must be all-or-nothing: if any step fails, the playlist must not be left
// with a track row but a stale timestamp, or a gap in positions. We therefore
// run them inside a single transaction (ACID atomicity).
router.post('/:id/tracks', authenticate, async (req, res) => {
  const { id } = req.params;
  const { track_id } = req.body;
  if (!track_id) return res.status(400).json({ error: 'track_id is required' });
  try {
    const check = await db.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Playlist not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const position = await db.withTransaction(async (client) => {
      // Next position = max existing + 1 (computed inside the txn so a
      // concurrent insert can't hand out the same position).
      const posRes = await client.query(
        'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM playlist_tracks WHERE playlist_id = $1',
        [id]
      );
      const nextPos = posRes.rows[0].next_pos;

      await client.query(
        'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [id, track_id, nextPos]
      );
      await client.query('UPDATE playlists SET updated_at = NOW() WHERE id = $1', [id]);
      return nextPos;
    });

    res.json({ added: true, position });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/playlists/:id/tracks/:trackId  — remove a track
//
// Delete + timestamp bump run together in one transaction so the playlist's
// updated_at can never advance unless the track was actually removed.
router.delete('/:id/tracks/:trackId', authenticate, async (req, res) => {
  const { id, trackId } = req.params;
  try {
    const check = await db.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Playlist not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await db.withTransaction(async (client) => {
      await client.query(
        'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
        [id, trackId]
      );
      await client.query('UPDATE playlists SET updated_at = NOW() WHERE id = $1', [id]);
    });

    res.json({ removed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

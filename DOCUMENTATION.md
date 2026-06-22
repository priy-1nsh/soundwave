# Soundwave — Project Documentation

> A full-stack Spotify-like music streaming app built for DBMS course + SI interview preparation.
> Stack: React · Node.js/Express · PostgreSQL (raw SQL, no ORM) · Vite

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Why](#2-tech-stack--why)
3. [Database Schema](#3-database-schema)
4. [ER Diagram (Text)](#4-er-diagram-text)
5. [API Endpoints](#5-api-endpoints)
6. [Key SQL Queries Explained](#6-key-sql-queries-explained)
7. [Setup & Running Locally](#7-setup--running-locally)
8. [Deployment Guide](#8-deployment-guide)
9. [Interview Q&A — SQL/DBMS](#9-interview-qa--sqldbms)
10. [Project File Structure](#10-project-file-structure)

---

## 1. Project Overview

**Soundwave** is a music streaming platform database inspired by Spotify. The project demonstrates:

- **Relational schema design** with 9 tables, proper foreign keys, and referential integrity
- **Raw SQL queries** — no ORM, every DB call is parameterized SQL written by hand
- **CRUD operations** across all entities
- **Many-to-many relationships** (playlist_tracks, follows, liked_tracks)
- **Aggregation queries** (play counts, follower counts, genre breakdowns)
- **Full-text search** with `ILIKE`
- **REST API design** with JWT authentication
- **React frontend** with a music player, dark Spotify-like UI

---

## 2. Tech Stack & Why

| Layer      | Choice            | Reason |
|------------|-------------------|--------|
| Frontend   | React + Vite      | Industry standard, fast HMR, familiar |
| Backend    | Node.js + Express | Lightweight, JavaScript end-to-end |
| Database   | PostgreSQL        | ACID compliant, rich SQL feature set, industry-preferred over MySQL |
| SQL        | Raw (no ORM)      | DBMS course tests this; interviewers want to see you know SQL |
| Auth       | JWT + bcrypt      | Stateless tokens, secure password hashing |
| Deployment | Railway + Vercel  | Free tier, Railway hosts Postgres + Node together |

---

## 3. Database Schema

### Table 1: `users`
```sql
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100),
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```
- `SERIAL` = auto-incrementing integer (PostgreSQL-specific)
- `UNIQUE NOT NULL` on both `username` and `email` — uniqueness constraints enforced at DB level, not just app level
- `password_hash` stores bcrypt hash, never plaintext

### Table 2: `artists`
```sql
CREATE TABLE artists (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    bio        TEXT,
    image_url  TEXT,
    genre      VARCHAR(100),
    country    VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table 3: `albums`
```sql
CREATE TABLE albums (
    id           SERIAL PRIMARY KEY,
    artist_id    INT         NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    cover_url    TEXT,
    release_date DATE,
    album_type   VARCHAR(20) NOT NULL DEFAULT 'album'
                 CHECK (album_type IN ('album', 'single', 'ep')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
- `REFERENCES artists(id) ON DELETE CASCADE` — if artist is deleted, their albums are auto-deleted
- `CHECK` constraint enforces allowed values at the DB level

### Table 4: `tracks`
```sql
CREATE TABLE tracks (
    id               SERIAL PRIMARY KEY,
    album_id         INT REFERENCES albums(id) ON DELETE SET NULL,
    artist_id        INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
    track_number     INT,
    audio_url        TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
- `album_id` uses `ON DELETE SET NULL` — track can exist without an album (single release)
- `artist_id` uses `ON DELETE CASCADE` — track is deleted if artist is deleted
- `CHECK (duration_seconds > 0)` prevents invalid data

### Table 5: `playlists`
```sql
CREATE TABLE playlists (
    id          SERIAL PRIMARY KEY,
    user_id     INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url   TEXT,
    is_public   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table 6: `playlist_tracks` (junction table)
```sql
CREATE TABLE playlist_tracks (
    playlist_id INT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id    INT NOT NULL REFERENCES tracks(id)    ON DELETE CASCADE,
    position    INT NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id)
);
```
- **Composite primary key** — a track can only appear once in a given playlist
- `position` allows ordered track listing within a playlist

### Table 7: `follows` (many-to-many: users → artists)
```sql
CREATE TABLE follows (
    user_id     INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    artist_id   INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, artist_id)
);
```
- Composite PK prevents a user from following the same artist twice

### Table 8: `play_history`
```sql
CREATE TABLE play_history (
    id        SERIAL PRIMARY KEY,
    user_id   INT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    track_id  INT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
- No composite PK here — same track can be played many times, each row is a separate event
- This is an **event/log table**, not a state table

### Table 9: `liked_tracks` (many-to-many)
```sql
CREATE TABLE liked_tracks (
    user_id  INT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    track_id INT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, track_id)
);
```

### Indexes
```sql
CREATE INDEX idx_tracks_album_id       ON tracks(album_id);
CREATE INDEX idx_tracks_artist_id      ON tracks(artist_id);
CREATE INDEX idx_albums_artist_id      ON albums(artist_id);
CREATE INDEX idx_playlists_user_id     ON playlists(user_id);
CREATE INDEX idx_play_history_user_id  ON play_history(user_id);
CREATE INDEX idx_play_history_track_id ON play_history(track_id);
CREATE INDEX idx_follows_artist_id     ON follows(artist_id);
```
Indexes speed up `JOIN` and `WHERE` lookups on foreign keys — without them, PostgreSQL does a full table scan.

---

## 4. ER Diagram (Text)

```
users ─────────────────────────────────────────────────────┐
  │ id (PK)                                                  │
  │                                                          │
  ├──[1:N]──► playlists                                      │
  │              │ id (PK), user_id (FK→users)               │
  │              └──[M:N via playlist_tracks]──► tracks      │
  │                                                          │
  ├──[1:N]──► play_history                                   │
  │              │ user_id (FK→users), track_id (FK→tracks)  │
  │                                                          │
  ├──[M:N via follows]──► artists                            │
  │                           │ id (PK)                      │
  │                           ├──[1:N]──► albums             │
  │                           │              └──[1:N]──► tracks
  │                           └──[1:N]──► tracks             │
  │                                                          │
  └──[M:N via liked_tracks]──► tracks ──────────────────────┘
```

**Relationship Summary:**
- User → Playlists: **1:N** (one user, many playlists)
- Playlist → Tracks: **M:N** via `playlist_tracks` junction
- User → Artists: **M:N** via `follows`
- User → Tracks: **M:N** via `play_history` (with duplicates) and `liked_tracks` (unique)
- Artist → Albums: **1:N**
- Album → Tracks: **1:N**
- Artist → Tracks: **1:N** (direct, for tracks without albums)

---

## 5. API Endpoints

### Auth
| Method | Endpoint            | Description              | Auth? |
|--------|---------------------|--------------------------|-------|
| POST   | /api/auth/register  | Create account           | No    |
| POST   | /api/auth/login     | Get JWT token            | No    |
| GET    | /api/auth/me        | Get current user info    | Yes   |

### Artists
| Method | Endpoint                    | Description                      |
|--------|-----------------------------|----------------------------------|
| GET    | /api/artists                | List all with follower counts    |
| GET    | /api/artists/:id            | Artist + albums + top 5 tracks   |
| POST   | /api/artists/:id/follow     | Follow an artist                 |
| DELETE | /api/artists/:id/follow     | Unfollow an artist               |

### Albums
| Method | Endpoint       | Description                  |
|--------|----------------|------------------------------|
| GET    | /api/albums    | All albums with artist info  |
| GET    | /api/albums/:id| Album + ordered track list   |

### Tracks
| Method | Endpoint               | Description             |
|--------|------------------------|-------------------------|
| GET    | /api/tracks            | All tracks (searchable) |
| GET    | /api/tracks/:id        | Single track            |
| POST   | /api/tracks/:id/play   | Record a play event     |
| POST   | /api/tracks/:id/like   | Like a track            |
| DELETE | /api/tracks/:id/like   | Unlike a track          |

### Playlists
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/playlists                    | Public playlists         |
| GET    | /api/playlists/mine               | Current user's playlists |
| GET    | /api/playlists/:id                | Playlist + tracks        |
| POST   | /api/playlists                    | Create playlist          |
| PUT    | /api/playlists/:id                | Update name/description  |
| DELETE | /api/playlists/:id                | Delete playlist          |
| POST   | /api/playlists/:id/tracks         | Add track                |
| DELETE | /api/playlists/:id/tracks/:trackId| Remove track             |

### Users (authenticated)
| Method | Endpoint          | Description               |
|--------|-------------------|---------------------------|
| GET    | /api/users/history| Last 50 played tracks     |
| GET    | /api/users/liked  | All liked tracks          |
| GET    | /api/users/following| Artists being followed  |

### Analytics
| Method | Endpoint                      | Description                |
|--------|-------------------------------|----------------------------|
| GET    | /api/analytics/top-tracks     | Most played globally       |
| GET    | /api/analytics/top-artists    | Artists ranked by plays    |
| GET    | /api/analytics/genre-breakdown| Play counts by genre       |
| GET    | /api/analytics/recent-activity| Platform-wide recent plays |

### Search
| Method | Endpoint        | Description                           |
|--------|-----------------|---------------------------------------|
| GET    | /api/search?q=  | Search artists, albums, tracks        |

---

## 6. Key SQL Queries Explained

### Most Popular Tracks (Aggregation + Join)
```sql
SELECT
  t.id, t.title, t.duration_seconds,
  ar.name      AS artist_name,
  al.cover_url AS album_cover,
  COUNT(ph.id) AS play_count
FROM tracks t
JOIN artists ar ON ar.id = t.artist_id
LEFT JOIN albums al ON al.id = t.album_id
LEFT JOIN play_history ph ON ph.track_id = t.id
GROUP BY t.id, ar.id, al.id
ORDER BY play_count DESC
LIMIT 10;
```
**Why `LEFT JOIN` on play_history?** — tracks with 0 plays would be excluded with an INNER JOIN. LEFT JOIN includes all tracks and returns NULL (counted as 0) for unplayed ones.

---

### Artist Page: Top 5 Tracks
```sql
SELECT t.*, COUNT(ph.id) AS play_count
FROM tracks t
LEFT JOIN play_history ph ON ph.track_id = t.id
WHERE t.artist_id = $1
GROUP BY t.id
ORDER BY play_count DESC
LIMIT 5;
```

---

### Playlist Tracks (Ordered)
```sql
SELECT
  t.*,
  ar.name      AS artist_name,
  al.cover_url AS album_cover,
  pt.position,
  pt.added_at  AS added_to_playlist_at
FROM playlist_tracks pt
JOIN tracks  t  ON t.id  = pt.track_id
JOIN artists ar ON ar.id = t.artist_id
LEFT JOIN albums al ON al.id = t.album_id
WHERE pt.playlist_id = $1
ORDER BY pt.position;
```
**Notice:** `ORDER BY pt.position` — ordering comes from the junction table, not the tracks table.

---

### Add Track to Playlist (Auto-position)
```sql
SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
FROM playlist_tracks
WHERE playlist_id = $1;
```
`COALESCE(MAX(position), 0)` — if the playlist is empty, `MAX` returns NULL; COALESCE converts that to 0, so the first track gets position 1.

---

### User's Listening History
```sql
SELECT
  ph.played_at,
  t.title,
  ar.name AS artist_name,
  al.cover_url AS album_cover
FROM play_history ph
JOIN tracks  t  ON t.id  = ph.track_id
JOIN artists ar ON ar.id = t.artist_id
LEFT JOIN albums al ON al.id = t.album_id
WHERE ph.user_id = $1
ORDER BY ph.played_at DESC
LIMIT 50;
```

---

### Genre Breakdown (Multi-level Aggregation)
```sql
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
ORDER BY total_plays DESC;
```
**`COUNT(DISTINCT ...)` vs `COUNT(...)`**: `COUNT(DISTINCT ar.id)` counts unique artists, while `COUNT(ph.id)` counts every play event row.

---

### Search with ILIKE
```sql
SELECT t.*, ar.name AS artist_name
FROM tracks t
JOIN artists ar ON ar.id = t.artist_id
WHERE t.title ILIKE $1 OR ar.name ILIKE $1
```
`ILIKE` = case-insensitive LIKE in PostgreSQL. The `%` wildcards match any string.

---

### ON CONFLICT DO NOTHING (Upsert)
```sql
INSERT INTO follows (user_id, artist_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;
```
Since `(user_id, artist_id)` is a composite PK, a duplicate follow attempt would error without `ON CONFLICT DO NOTHING`. This makes the follow action idempotent.

---

## 7. Setup & Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### Step 1: Clone & Install
```bash
# Install dependencies for both client and server
cd server && npm install
cd ../client && npm install
```

### Step 2: Configure Environment
```bash
cd server
cp .env.example .env
# Edit .env with your PostgreSQL connection string:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/soundwave
# JWT_SECRET=some_random_secret_string
```

### Step 3: Create Database & Run Schema
```bash
# Create the database (in psql or pgAdmin)
createdb soundwave

# Run schema + seed
cd server
npm run db:reset
```

### Step 4: Start Both Servers
```bash
# Terminal 1 — Backend on port 4000
cd server && npm run dev

# Terminal 2 — Frontend on port 5173
cd client && npm run dev
```

Visit `http://localhost:5173`

**Demo login:** `demo@soundwave.app` / `password123`

---

## 8. Deployment Guide

### Railway (Backend + PostgreSQL)
1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add PostgreSQL plugin to your project
4. Set environment variables:
   - `DATABASE_URL` — auto-filled by Railway's Postgres plugin
   - `JWT_SECRET` — any random 32-char string
   - `CLIENT_URL` — your Vercel frontend URL
5. Set the root directory to `/server`
6. After deploy, run migrations: open Railway shell → `npm run db:reset`

### Vercel (Frontend)
1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set root directory to `/client`
4. Add environment variable:
   - `VITE_API_URL` — your Railway backend URL (update `api.js` baseURL to use this)
5. Deploy

---

## 9. Interview Q&A — SQL/DBMS

**Q: What is normalization? Is your schema normalized?**
> Normalization eliminates data redundancy. My schema is in 3NF: each table has a single purpose, no transitive dependencies. Artist info lives only in `artists`, album info only in `albums` — tracks reference them via foreign keys rather than duplicating names.

**Q: What's the difference between PRIMARY KEY and UNIQUE?**
> A PRIMARY KEY is UNIQUE + NOT NULL + only one per table. A table can have many UNIQUE constraints (e.g., both `username` and `email` are UNIQUE in `users`), but only one PRIMARY KEY.

**Q: Why do you have composite primary keys in some tables?**
> In `playlist_tracks`, `follows`, and `liked_tracks`, the combination of two foreign keys uniquely identifies a row. Using them as a composite PK also automatically creates a unique index and prevents duplicate relationships (e.g., following the same artist twice).

**Q: What's referential integrity? How is it enforced here?**
> Referential integrity means a foreign key value must always point to an existing row in the referenced table. PostgreSQL enforces this with `REFERENCES`. I chose different cascade behaviors deliberately:
> - `ON DELETE CASCADE` on artist_id in tracks — deleting an artist removes their tracks
> - `ON DELETE SET NULL` on album_id in tracks — deleting an album keeps the track (as a standalone)

**Q: What's the difference between INNER JOIN and LEFT JOIN?**
> INNER JOIN only returns rows where a match exists in both tables. LEFT JOIN returns all rows from the left table, with NULLs for the right if no match. I use LEFT JOIN when I want to count plays even for unplayed tracks — an INNER JOIN would silently exclude them.

**Q: What is COUNT(DISTINCT col) vs COUNT(col)?**
> `COUNT(col)` counts all non-NULL rows. `COUNT(DISTINCT col)` counts only unique values. In genre analytics, `COUNT(DISTINCT ar.id)` gives me unique artist count, while `COUNT(ph.id)` gives total play events including repeats.

**Q: What are indexes and when do you use them?**
> An index is a data structure (B-tree by default in Postgres) that allows fast lookups without a full table scan. I created indexes on all foreign key columns (e.g., `play_history.user_id`) because they're used in JOIN conditions and WHERE clauses. Without an index, looking up a user's history requires scanning every row in `play_history`.

**Q: What is ON CONFLICT DO NOTHING?**
> It's PostgreSQL's upsert syntax. When inserting into a table with a unique constraint, if the row already exists, instead of throwing an error, it silently does nothing. Used in follow/like endpoints to make them idempotent.

**Q: Why TIMESTAMPTZ instead of TIMESTAMP?**
> `TIMESTAMPTZ` stores timezone-aware timestamps in UTC and converts them on read. `TIMESTAMP` is naive — it stores local time with no timezone, which causes bugs in multi-timezone apps. Always use TIMESTAMPTZ.

**Q: What is COALESCE?**
> COALESCE returns the first non-NULL value from a list. `COALESCE(MAX(position), 0)` returns 0 if there are no tracks in the playlist yet (MAX returns NULL on empty sets), so the first track inserted gets position 1.

**Q: How would you scale this database?**
> For reads: add read replicas, add a Redis cache for hot data like top tracks. For writes: partition `play_history` by date (it grows fast). For search: replace ILIKE with PostgreSQL's full-text search (`tsvector`/`tsquery`) or use Elasticsearch. The schema is already designed with this in mind — `play_history` is append-only and separable.

**Q: What's the difference between DELETE CASCADE and SET NULL?**
> `ON DELETE CASCADE` means when the parent row is deleted, the child rows are also deleted. `ON DELETE SET NULL` means the child row remains but its FK column is set to NULL. I used SET NULL on `tracks.album_id` because a track can still exist without an album (it becomes a standalone single).

---

## 10. Project File Structure

```
DBMS Project/
├── DOCUMENTATION.md          ← this file
├── package.json              ← root scripts
│
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js          ← Express app entry
│       ├── db/
│       │   ├── index.js      ← pg Pool connection
│       │   ├── schema.sql    ← all CREATE TABLE statements
│       │   └── seed.sql      ← sample data
│       ├── middleware/
│       │   └── auth.js       ← JWT verify middleware
│       └── routes/
│           ├── auth.js       ← register, login, /me
│           ├── artists.js    ← CRUD + follow/unfollow
│           ├── albums.js     ← list + detail
│           ├── tracks.js     ← list + play + like
│           ├── playlists.js  ← full CRUD + add/remove tracks
│           ├── users.js      ← history, liked, following
│           ├── analytics.js  ← aggregation queries
│           └── search.js     ← cross-entity search
│
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── services/
        │   └── api.js        ← axios instance with JWT
        ├── context/
        │   ├── AuthContext.jsx
        │   └── PlayerContext.jsx
        ├── components/
        │   ├── Layout/
        │   │   ├── Sidebar.jsx + .css
        │   │   ├── Topbar.jsx + .css
        │   │   └── Player.jsx + .css
        │   └── Cards/
        │       ├── TrackRow.jsx + .css
        │       ├── ArtistCard.jsx
        │       ├── AlbumCard.jsx
        │       └── Card.module.css
        └── pages/
            ├── Home.jsx
            ├── Artist.jsx
            ├── Album.jsx
            ├── Playlist.jsx
            ├── Library.jsx
            ├── LikedSongs.jsx
            ├── Search.jsx
            ├── Analytics.jsx
            ├── Login.jsx
            └── Page.module.css
```

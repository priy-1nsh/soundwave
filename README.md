# 🎵 Soundwave — A Music Streaming Platform

> A full-stack Spotify-style music streaming application, built as a **Database Management Systems (DBMS) course project**.
> The focus of this project is a clean, normalized relational schema queried with **raw, parameterized SQL** (no ORM), backed by a documented REST API and a polished React front-end.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Design (DBMS Core)](#3-database-design-dbms-core)
   - [Entity–Relationship Model](#31-entityrelationship-model)
   - [Schema & Tables](#32-schema--tables)
   - [Keys, Constraints & Referential Integrity](#33-keys-constraints--referential-integrity)
   - [Normalization](#34-normalization)
   - [Indexing Strategy](#35-indexing-strategy)
   - [Transactions & ACID](#36-transactions--acid)
4. [Representative SQL Queries](#4-representative-sql-queries)
5. [Backend Architecture](#5-backend-architecture)
6. [REST API Reference](#6-rest-api-reference)
7. [Frontend Overview](#7-frontend-overview)
8. [Setup & Installation](#8-setup--installation)
9. [Project Structure](#9-project-structure)
10. [Security Notes](#10-security-notes)
11. [Possible Extensions](#11-possible-extensions)

---

## 1. Project Overview

Soundwave models the core domain of a music streaming service: **artists** release **albums** containing **tracks**; **users** create **playlists**, **follow** artists, **like** tracks, and build up a **play history**. Every one of these relationships is modelled relationally and enforced at the database level.

The project is intentionally **database-first**: business rules such as "a track must have a positive duration", "a playlist cannot contain the same track twice", and "deleting an artist removes their albums" are enforced by **constraints in PostgreSQL**, not just in application code.

**Key characteristics:**

- 9-table normalized relational schema (3NF)
- Raw parameterized SQL — **no ORM** (Prisma/Sequelize/TypeORM deliberately avoided so the SQL is fully visible and explainable)
- Foreign keys with deliberate `ON DELETE` rules (`CASCADE` vs `SET NULL`)
- Composite primary keys on junction tables
- `CHECK` constraints and `UNIQUE` constraints for data integrity
- Multi-statement writes wrapped in **ACID transactions**
- Indexes on every foreign-key / join column

---

## 2. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Database** | PostgreSQL 16 | Mature RDBMS with strong constraint support, `TIMESTAMPTZ`, `ILIKE`, transactions |
| **Data access** | `pg` (node-postgres) | Thin driver — lets us write **raw SQL** with parameter binding, no ORM abstraction |
| **Backend** | Node.js + Express | Lightweight REST API layer mapping HTTP routes → SQL queries |
| **Auth** | JWT + bcrypt | Stateless token auth; passwords stored only as bcrypt hashes |
| **Frontend** | React + Vite | Fast SPA with a dark, Spotify-like UI |

---

## 3. Database Design (DBMS Core)

> This is the heart of the project. The complete schema lives in [`server/src/db/schema.sql`](server/src/db/schema.sql) and sample data in [`server/src/db/seed.sql`](server/src/db/seed.sql).

### 3.1 Entity–Relationship Model

```
                         ┌──────────┐
                         │  USERS   │
                         └────┬─────┘
        ┌───────────┬─────────┼──────────┬─────────────┐
        │           │         │          │             │
   (creates)   (follows)  (likes)  (play_history)  (owns)
        │           │         │          │             │
        ▼           ▼         ▼          ▼             ▼
   ┌──────────┐  ┌────────────────┐  ┌──────────┐
   │PLAYLISTS │  │    FOLLOWS     │  │  LIKED   │
   └────┬─────┘  │ (user↔artist)  │  │  TRACKS  │
        │        └───────┬────────┘  └────┬─────┘
   (playlist_tracks)     │                │
        │                ▼                ▼
        │           ┌──────────┐     ┌──────────┐
        └──────────▶│  TRACKS  │◀────┘          │
                    └────┬─────┘                │
                  (belongs to)                  │
                    ┌────┴─────┐                │
                    ▼          ▼                │
              ┌──────────┐ ┌──────────┐         │
              │  ALBUMS  │ │ ARTISTS  │◀────────┘
              └────┬─────┘ └────▲─────┘
                   └────────────┘
                   (album belongs to artist)
```

**Relationship summary:**

| Relationship | Type | Implemented by |
|--------------|------|----------------|
| Artist → Albums | One-to-Many | `albums.artist_id` FK |
| Artist → Tracks | One-to-Many | `tracks.artist_id` FK |
| Album → Tracks | One-to-Many | `tracks.album_id` FK (nullable) |
| User → Playlists | One-to-Many | `playlists.user_id` FK |
| Playlist ↔ Tracks | Many-to-Many | `playlist_tracks` junction |
| User ↔ Artists (follow) | Many-to-Many | `follows` junction |
| User ↔ Tracks (like) | Many-to-Many | `liked_tracks` junction |
| User → Plays | One-to-Many (event log) | `play_history` |

### 3.2 Schema & Tables

| # | Table | Purpose | Primary Key |
|---|-------|---------|-------------|
| 1 | `users` | Registered accounts | `id` (surrogate) |
| 2 | `artists` | Music artists | `id` |
| 3 | `albums` | Albums released by artists | `id` |
| 4 | `tracks` | Individual songs | `id` |
| 5 | `playlists` | User-created playlists | `id` |
| 6 | `playlist_tracks` | Tracks within a playlist (ordered) | **`(playlist_id, track_id)`** composite |
| 7 | `follows` | Users following artists | **`(user_id, artist_id)`** composite |
| 8 | `play_history` | Append-only log of plays | `id` |
| 9 | `liked_tracks` | Users' liked songs | **`(user_id, track_id)`** composite |

### 3.3 Keys, Constraints & Referential Integrity

The schema demonstrates the major categories of relational constraints:

**Primary keys** — surrogate `SERIAL` keys for entities; **composite natural keys** for junction tables, which both identify the row *and* prevent duplicates (a user can't follow the same artist twice).

**Foreign keys with intentional delete behaviour:**

```sql
-- Deleting an artist removes their albums (an album cannot exist without its artist)
artist_id INT NOT NULL REFERENCES artists(id) ON DELETE CASCADE

-- Deleting an album keeps the track but nulls its album link
-- (a single/loose track can survive without an album)
album_id  INT REFERENCES albums(id) ON DELETE SET NULL
```

This contrast — `CASCADE` vs `SET NULL` — is a deliberate modelling decision and a common DBMS interview point.

**CHECK constraints** (domain integrity):

```sql
duration_seconds INT NOT NULL CHECK (duration_seconds > 0)
album_type VARCHAR(20) NOT NULL DEFAULT 'album'
           CHECK (album_type IN ('album', 'single', 'ep'))
```

**UNIQUE constraints:**

```sql
username VARCHAR(50)  UNIQUE NOT NULL,
email    VARCHAR(255) UNIQUE NOT NULL
```

**NOT NULL** is applied to every column that is logically mandatory, and `TIMESTAMPTZ NOT NULL DEFAULT NOW()` is used for all audit timestamps.

### 3.4 Normalization

The schema is in **Third Normal Form (3NF)**:

- **1NF** — all columns hold atomic values; repeating groups (e.g. "tracks in a playlist") are pushed into their own `playlist_tracks` table rather than comma-separated columns.
- **2NF** — no partial dependency on part of a composite key. In `playlist_tracks`, the non-key attributes (`position`, `added_at`) depend on the *whole* key `(playlist_id, track_id)`.
- **3NF** — no transitive dependencies. Artist details live only in `artists`; `tracks` references the artist by id rather than duplicating the artist name. Album/artist names are joined in at query time, never stored redundantly.

### 3.5 Indexing Strategy

Beyond the automatic indexes on primary and unique keys, secondary indexes are created on **every foreign-key column used in joins or filters**:

```sql
CREATE INDEX idx_tracks_album_id       ON tracks(album_id);
CREATE INDEX idx_tracks_artist_id      ON tracks(artist_id);
CREATE INDEX idx_albums_artist_id      ON albums(artist_id);
CREATE INDEX idx_playlists_user_id     ON playlists(user_id);
CREATE INDEX idx_play_history_user_id  ON play_history(user_id);
CREATE INDEX idx_play_history_track_id ON play_history(track_id);
CREATE INDEX idx_follows_artist_id     ON follows(artist_id);
```

**Rationale:** the application's hot paths are joins (`tracks ⋈ artists`, `play_history ⋈ tracks`) and per-user lookups (`WHERE user_id = $1`). Without these indexes those operations degrade to sequential scans as the tables grow; with them PostgreSQL can use index scans. You can confirm the planner's choice with `EXPLAIN ANALYZE`.

### 3.6 Transactions & ACID

Any operation that issues **more than one write** is wrapped in a transaction so it is **atomic** — it either fully succeeds or fully rolls back, never leaving the database half-updated.

A small helper checks out a single pooled connection and runs `BEGIN` / `COMMIT` / `ROLLBACK` on it ([`server/src/db/index.js`](server/src/db/index.js)):

```js
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');   // any failure undoes the whole unit
    throw err;
  } finally {
    client.release();
  }
}
```

**Example — adding a track to a playlist** ([`server/src/routes/playlists.js`](server/src/routes/playlists.js)). Three statements must succeed together: compute the next position, insert the link row, and bump the playlist's `updated_at`. If the insert fails, the timestamp update must not happen:

```js
await db.withTransaction(async (client) => {
  const { rows } = await client.query(
    'SELECT COALESCE(MAX(position),0)+1 AS next_pos FROM playlist_tracks WHERE playlist_id = $1',
    [id]
  );
  await client.query(
    'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [id, track_id, rows[0].next_pos]
  );
  await client.query('UPDATE playlists SET updated_at = NOW() WHERE id = $1', [id]);
});
```

This directly maps to the **ACID** properties: **A**tomicity (all-or-nothing via the transaction), **C**onsistency (constraints stay satisfied), **I**solation (the position is read and used on one session), **D**urability (PostgreSQL's WAL persists committed data across crashes).

---

## 4. Representative SQL Queries

These show the SQL techniques used throughout the API.

**a) Most-played tracks — aggregation + LEFT JOIN + GROUP BY + ORDER BY** ([analytics.js](server/src/routes/analytics.js)):

```sql
SELECT t.id, t.title, ar.name AS artist_name, COUNT(ph.id) AS play_count
FROM tracks t
JOIN artists ar           ON ar.id = t.artist_id
LEFT JOIN play_history ph ON ph.track_id = t.id   -- LEFT JOIN keeps never-played tracks
GROUP BY t.id, ar.id
ORDER BY play_count DESC
LIMIT $1;
```
A `LEFT JOIN` is essential here: an `INNER JOIN` would silently drop tracks with zero plays.

**b) Genre breakdown — multiple aggregates with `COUNT(DISTINCT ...)`:**

```sql
SELECT ar.genre,
       COUNT(DISTINCT ar.id) AS artist_count,
       COUNT(DISTINCT t.id)  AS track_count,
       COUNT(ph.id)          AS total_plays
FROM artists ar
LEFT JOIN tracks t        ON t.artist_id = ar.id
LEFT JOIN play_history ph ON ph.track_id = t.id
WHERE ar.genre IS NOT NULL
GROUP BY ar.genre
ORDER BY total_plays DESC;
```

**c) Auto-incrementing playlist position — `COALESCE` + `MAX`:**

```sql
SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
FROM playlist_tracks WHERE playlist_id = $1;
```

**d) Idempotent follow/like — `ON CONFLICT DO NOTHING`:**

```sql
INSERT INTO follows (user_id, artist_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING;   -- composite PK makes a repeat follow a no-op, not an error
```

**e) Cross-entity search — `ILIKE` for case-insensitive matching:**

```sql
SELECT * FROM artists WHERE name ILIKE $1 OR genre ILIKE $1 LIMIT 5;
```

---

## 5. Backend Architecture

The backend is a stateless **Express REST API** that translates HTTP requests into SQL. There is no ORM and no business logic hidden in a framework — each route reads almost exactly like the SQL it runs.

```
HTTP request
   │
   ▼
Express route (server/src/routes/*.js)
   │   ├─ validate input
   │   ├─ check authorization (JWT middleware)
   │   └─ run parameterized SQL  ── via ──▶  db.query() / db.withTransaction()
   │                                              │
   ▼                                              ▼
JSON response                              PostgreSQL (pg Pool)
```

**Key modules:**

| File | Responsibility |
|------|----------------|
| [`server/src/index.js`](server/src/index.js) | App entry — mounts routers, CORS, JSON parsing, health check |
| [`server/src/db/index.js`](server/src/db/index.js) | `pg` connection **pool**, `query()` helper, `withTransaction()` helper |
| [`server/src/middleware/auth.js`](server/src/middleware/auth.js) | `authenticate` (blocks) and `optionalAuth` (attaches user if a token is present) |
| `server/src/routes/*.js` | One router per resource (auth, artists, albums, tracks, playlists, users, analytics, search) |

**Connection pooling:** a single `pg.Pool` is shared across all requests, so connections are reused rather than opened per query. Transactions check a client out of this pool for their duration and return it afterwards.

**Authentication & authorization are separate concerns:**
- *Authentication* — `bcrypt.compare` verifies the password, then a signed **JWT** is issued (`expiresIn: 7d`).
- *Authorization* — protected routes verify the JWT, and **ownership is enforced server-side**: e.g. editing or deleting a playlist re-checks `playlists.user_id = req.user.id` and returns `403` otherwise. Permissions are never trusted from the client.

---

## 6. REST API Reference

Base URL: `/api`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Create account, returns JWT |
| `POST` | `/auth/login` | — | Log in, returns JWT |
| `GET`  | `/auth/me` | ✅ | Current user profile |

### Artists
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`    | `/artists` | — | All artists with follower & track counts |
| `GET`    | `/artists/:id` | optional | Artist + albums + top tracks (+ `is_following`) |
| `POST`   | `/artists/:id/follow` | ✅ | Follow artist (idempotent) |
| `DELETE` | `/artists/:id/follow` | ✅ | Unfollow |

### Albums & Tracks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`    | `/albums` / `/albums/:id` | — | List / album detail with tracks |
| `GET`    | `/tracks` | — | Tracks (optional `?search=`), ranked by plays |
| `GET`    | `/tracks/:id` | — | Single track |
| `POST`   | `/tracks/:id/play` | ✅ | Record a play in `play_history` |
| `POST`   | `/tracks/:id/like` | ✅ | Like (idempotent) |
| `DELETE` | `/tracks/:id/like` | ✅ | Unlike |

### Playlists
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`    | `/playlists` | optional | Public playlists |
| `GET`    | `/playlists/mine` | ✅ | Current user's playlists |
| `GET`    | `/playlists/:id` | optional | Playlist + ordered tracks (private → owner only) |
| `POST`   | `/playlists` | ✅ | Create playlist |
| `PUT`    | `/playlists/:id` | ✅ (owner) | Update metadata |
| `DELETE` | `/playlists/:id` | ✅ (owner) | Delete |
| `POST`   | `/playlists/:id/tracks` | ✅ (owner) | Add track **(transactional)** |
| `DELETE` | `/playlists/:id/tracks/:trackId` | ✅ (owner) | Remove track **(transactional)** |

### Users (library)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/history` | ✅ | Recent play history |
| `GET` | `/users/liked` | ✅ | Liked tracks |
| `GET` | `/users/following` | ✅ | Followed artists |

### Analytics & Search
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/analytics/top-tracks` | — | Most played tracks |
| `GET` | `/analytics/top-artists` | — | Artists by total plays |
| `GET` | `/analytics/genre-breakdown` | — | Plays grouped by genre |
| `GET` | `/analytics/recent-activity` | — | Platform-wide recent plays |
| `GET` | `/search?q=` | — | Search artists, albums, tracks |

---

## 7. Frontend Overview

A React + Vite single-page app providing a dark, Spotify-like interface. It is intentionally a thin presentation layer over the API — all data and rules live in the database/backend.

- **Routing:** public `/login`, everything else behind an authenticated app shell (sidebar + top bar + persistent player).
- **State:** React Context for auth (`AuthContext`) and playback (`PlayerContext`).
- **Pages:** Home, Artist, Album, Playlist, Search, Library, Liked Songs, Analytics.
- **Dev proxy:** Vite proxies `/api` → `http://127.0.0.1:4000` (IPv4 is used explicitly to avoid Windows `localhost`→IPv6 resolution issues).

---

## 8. Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 16 (ensure `psql` is on your `PATH`)

### 1. Create and seed the database
```bash
# create the database
createdb soundwave

# load schema, then sample data
psql -d soundwave -f server/src/db/schema.sql
psql -d soundwave -f server/src/db/seed.sql
```

### 2. Configure the backend
Create `server/.env` (see `server/.env.example`):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soundwave
JWT_SECRET=change_me_to_a_long_random_string
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Run
```bash
# terminal 1 — backend
cd server && npm install && npm run dev

# terminal 2 — frontend
cd client && npm install && npm run dev
```
Open **http://localhost:5173**.

### Demo accounts
All seeded users share the password **`password123`**:

| Email | Display name |
|-------|--------------|
| `demo@soundwave.app` | Demo User |
| `priyansh@soundwave.app` | Priyansh |
| `fan@soundwave.app` | Music Fan |
| `indie@soundwave.app` | Indie Lover |

---

## 9. Project Structure

```
DBMS Project/
├── README.md                  ← this file
├── DOCUMENTATION.md           ← extended schema/query notes & interview Q&A
├── server/                    ← Express + PostgreSQL backend
│   └── src/
│       ├── db/
│       │   ├── schema.sql     ← ★ tables, keys, constraints, indexes
│       │   ├── seed.sql       ← sample data
│       │   └── index.js       ← pg pool + withTransaction()
│       ├── middleware/auth.js ← JWT auth/authorization
│       ├── routes/            ← one router per resource
│       └── index.js           ← app entry
└── client/                    ← React + Vite frontend
    └── src/
        ├── pages/  components/  context/  services/
        └── App.jsx
```

---

## 10. Security Notes

- **SQL injection** is prevented everywhere by **parameterized queries** (`$1, $2 …`) — no string concatenation of user input into SQL.
- **Passwords** are never stored in plaintext; only bcrypt hashes (`SALT_ROUNDS = 10`) are persisted, and the hash is stripped from every API response.
- **Authorization is enforced server-side** per resource (ownership checks), not hidden in the UI.
- **JWT secret** and DB credentials are kept in `.env` (not committed).

---

## 11. Possible Extensions

Natural next steps that build on the DBMS foundation:

- **Database views** for the analytics queries, and **materialized views** for expensive aggregates refreshed periodically.
- **Triggers** to maintain a denormalized `play_count` column instead of counting on every read.
- **Stored procedures / functions** for the playlist-position logic.
- **Full-text search** (`tsvector` / GIN index) replacing `ILIKE` for scalable search.
- **Row-level isolation testing** and `EXPLAIN ANALYZE`-driven index tuning.

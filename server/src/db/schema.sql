-- =============================================================
--  SOUNDWAVE — PostgreSQL Schema
--  DBMS Course Project | Raw SQL, no ORM
-- =============================================================

-- Drop in reverse dependency order for clean resets
DROP TABLE IF EXISTS play_history    CASCADE;
DROP TABLE IF EXISTS liked_tracks    CASCADE;
DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists       CASCADE;
DROP TABLE IF EXISTS follows         CASCADE;
DROP TABLE IF EXISTS tracks          CASCADE;
DROP TABLE IF EXISTS albums          CASCADE;
DROP TABLE IF EXISTS artists         CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

-- -----------------------------------------------------------
-- 1. USERS
-- -----------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100),
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 2. ARTISTS
-- -----------------------------------------------------------
CREATE TABLE artists (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    bio         TEXT,
    image_url   TEXT,
    genre       VARCHAR(100),
    country     VARCHAR(100),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 3. ALBUMS
-- -----------------------------------------------------------
CREATE TABLE albums (
    id           SERIAL PRIMARY KEY,
    artist_id    INT          NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    cover_url    TEXT,
    release_date DATE,
    album_type   VARCHAR(20)  NOT NULL DEFAULT 'album'   -- 'album' | 'single' | 'ep'
                 CHECK (album_type IN ('album', 'single', 'ep')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 4. TRACKS
-- -----------------------------------------------------------
CREATE TABLE tracks (
    id               SERIAL PRIMARY KEY,
    album_id         INT          REFERENCES albums(id)  ON DELETE SET NULL,
    artist_id        INT          NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    duration_seconds INT          NOT NULL CHECK (duration_seconds > 0),
    track_number     INT,
    audio_url        TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 5. PLAYLISTS
-- -----------------------------------------------------------
CREATE TABLE playlists (
    id          SERIAL PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url   TEXT,
    is_public   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 6. PLAYLIST_TRACKS  (junction — ordered)
-- -----------------------------------------------------------
CREATE TABLE playlist_tracks (
    playlist_id INT          NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id    INT          NOT NULL REFERENCES tracks(id)    ON DELETE CASCADE,
    position    INT          NOT NULL,
    added_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id)
);

-- -----------------------------------------------------------
-- 7. FOLLOWS  (Users → Artists)
-- -----------------------------------------------------------
CREATE TABLE follows (
    user_id     INT         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    artist_id   INT         NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, artist_id)
);

-- -----------------------------------------------------------
-- 8. PLAY_HISTORY
-- -----------------------------------------------------------
CREATE TABLE play_history (
    id        SERIAL PRIMARY KEY,
    user_id   INT         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    track_id  INT         NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- 9. LIKED_TRACKS  (many-to-many, no duplicates)
-- -----------------------------------------------------------
CREATE TABLE liked_tracks (
    user_id  INT         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    track_id INT         NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    liked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, track_id)
);

-- -----------------------------------------------------------
-- INDEXES  (speed up common query patterns)
-- -----------------------------------------------------------
CREATE INDEX idx_tracks_album_id       ON tracks(album_id);
CREATE INDEX idx_tracks_artist_id      ON tracks(artist_id);
CREATE INDEX idx_albums_artist_id      ON albums(artist_id);
CREATE INDEX idx_playlists_user_id     ON playlists(user_id);
CREATE INDEX idx_play_history_user_id  ON play_history(user_id);
CREATE INDEX idx_play_history_track_id ON play_history(track_id);
CREATE INDEX idx_follows_artist_id     ON follows(artist_id);

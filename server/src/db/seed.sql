-- =============================================================
--  SOUNDWAVE — Seed Data
--  Realistic sample data for demos and interviews
-- =============================================================

-- ARTISTS
INSERT INTO artists (name, bio, image_url, genre, country) VALUES
('The Weeknd',     'Canadian singer known for dark R&B and synth-pop.',        '/covers/weeknd.svg',   'R&B',        'Canada'),
('Taylor Swift',   'Pop icon and prolific songwriter.',                          '/covers/tswift.svg',   'Pop',        'USA'),
('Kendrick Lamar', 'Pulitzer Prize-winning Compton rapper.',                    '/covers/kdot.svg',     'Hip-Hop',    'USA'),
('Dua Lipa',       'British-Albanian pop star known for disco-influenced pop.', '/covers/dualipa.svg',  'Pop',        'UK'),
('Arctic Monkeys', 'Sheffield indie rock band led by Alex Turner.',             '/covers/arcticm.svg',  'Indie Rock', 'UK'),
('Billie Eilish',  'Genre-defying pop artist who rose to fame as a teenager.',  '/covers/billie.svg',   'Pop/Alt',    'USA');

-- ALBUMS
INSERT INTO albums (artist_id, title, cover_url, release_date, album_type) VALUES
(1, 'After Hours',           '/covers/afterhours.svg',  '2020-03-20', 'album'),
(1, 'Starboy',               '/covers/starboy.svg',     '2016-11-25', 'album'),
(2, 'Midnights',             '/covers/midnights.svg',   '2022-10-21', 'album'),
(2, '1989',                  '/covers/1989ts.svg',      '2014-10-27', 'album'),
(3, 'To Pimp a Butterfly',   '/covers/tpab.svg',        '2015-03-15', 'album'),
(3, 'DAMN.',                 '/covers/damn2017.svg',    '2017-04-14', 'album'),
(4, 'Future Nostalgia',      '/covers/futurenost.svg',  '2020-03-27', 'album'),
(5, 'AM',                    '/covers/arcticam.svg',    '2013-09-09', 'album'),
(5, 'Whatever People Say I Am, That''s What I''m Not', '/covers/wpsiam.svg', '2006-01-23', 'album'),
(6, 'When We All Fall Asleep, Where Do We Go?', '/covers/wwafa.svg', '2019-03-29', 'album');

-- TRACKS
INSERT INTO tracks (album_id, artist_id, title, duration_seconds, track_number, audio_url) VALUES
-- After Hours (album 1, artist 1)
(1, 1, 'Alone Again',        237, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
(1, 1, 'Too Late',           232, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
(1, 1, 'Hardest to Love',    213, 3,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
(1, 1, 'Scared to Live',     196, 4,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
(1, 1, 'Snowchild',          255, 5,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'),
(1, 1, 'Escape from LA',     374, 6,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'),
(1, 1, 'Until I Bleed Out',  214, 7,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'),
(1, 1, 'Blinding Lights',    200, 8,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'),
(1, 1, 'In Your Eyes',       237, 9,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'),
(1, 1, 'Save Your Tears',    215, 10, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'),
-- Starboy (album 2, artist 1)
(2, 1, 'Starboy',            230, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'),
(2, 1, 'Party Monster',      238, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'),
(2, 1, 'False Alarm',        227, 3,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'),
-- Midnights (album 3, artist 2)
(3, 2, 'Lavender Haze',      202, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'),
(3, 2, 'Maroon',             218, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'),
(3, 2, 'Anti-Hero',          200, 3,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'),
(3, 2, 'Snow on the Beach', 215, 4,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
-- 1989 (album 4, artist 2)
(4, 2, 'Welcome to New York', 212, 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
(4, 2, 'Blank Space',         231, 2, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
(4, 2, 'Style',               231, 3, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
(4, 2, 'Shake It Off',        219, 4, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'),
-- To Pimp a Butterfly (album 5, artist 3)
(5, 3, 'Wesley''s Theory',   304, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'),
(5, 3, 'King Kunta',         234, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'),
(5, 3, 'Alright',            219, 3,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'),
-- DAMN. (album 6, artist 3)
(6, 3, 'HUMBLE.',            177, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'),
(6, 3, 'DNA.',               185, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'),
(6, 3, 'LOYALTY.',           233, 3,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'),
-- Future Nostalgia (album 7, artist 4)
(7, 4, 'Future Nostalgia',   209, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'),
(7, 4, 'Don''t Start Now',  183, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'),
(7, 4, 'Physical',          194, 3,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'),
(7, 4, 'Levitating',        203, 4,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'),
-- AM (album 8, artist 5)
(8, 5, 'Do I Wanna Know?',  272, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'),
(8, 5, 'R U Mine?',         200, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
(8, 5, '505',               254, 3,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
-- Whatever People Say... (album 9, artist 5)
(9, 5, 'I Bet You Look Good on the Dancefloor', 158, 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
(9, 5, 'Fake Tales of San Francisco',           150, 2, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
-- When We All Fall Asleep... (album 10, artist 6)
(10, 6, 'bad guy',          194, 1,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'),
(10, 6, 'xanny',            242, 2,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'),
(10, 6, 'you should see me in a crown', 229, 3, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'),
(10, 6, 'bury a friend',    213, 4,  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');

-- USERS (passwords are bcrypt of "password123" — pre-hashed for seed)
INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES
('demo_user',  'demo@soundwave.app',    '$2b$10$uU7cM3klD6YexvtKUBF8puzmfRicVVSs/51dQvhgnYkKK2.bJEQ8e', 'Demo User',    'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'),
('priyansh',   'priyansh@soundwave.app','$2b$10$uU7cM3klD6YexvtKUBF8puzmfRicVVSs/51dQvhgnYkKK2.bJEQ8e', 'Priyansh',     'https://api.dicebear.com/7.x/avataaars/svg?seed=priyansh'),
('music_fan',  'fan@soundwave.app',     '$2b$10$uU7cM3klD6YexvtKUBF8puzmfRicVVSs/51dQvhgnYkKK2.bJEQ8e', 'Music Fan',    'https://api.dicebear.com/7.x/avataaars/svg?seed=fan'),
('indie_lover','indie@soundwave.app',   '$2b$10$uU7cM3klD6YexvtKUBF8puzmfRicVVSs/51dQvhgnYkKK2.bJEQ8e', 'Indie Lover',  'https://api.dicebear.com/7.x/avataaars/svg?seed=indie');

-- PLAYLISTS
INSERT INTO playlists (user_id, name, description, is_public) VALUES
(1, 'Late Night Vibes',    'Perfect for 2am drives.',              TRUE),
(1, 'Workout Bangers',     'High energy tracks to push harder.',   TRUE),
(2, 'Study Session',       'Focus music for deep work.',           TRUE),
(2, 'My Favourites',       'All time personal favourites.',        FALSE),
(3, 'Indie Anthems',       'Best of British indie rock.',          TRUE),
(4, 'Hip-Hop Essentials',  'Classic and modern hip-hop.',          TRUE);

-- PLAYLIST_TRACKS
INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES
-- Late Night Vibes
(1, 8,  1), (1, 9,  2), (1, 10, 3), (1, 5,  4), (1, 38, 5), (1, 39, 6),
-- Workout Bangers
(2, 25, 1), (2, 26, 2), (2, 29, 3), (2, 30, 4), (2, 16, 5), (2, 21, 6),
-- Study Session
(3, 31, 1), (3, 32, 2), (3, 33, 3), (3, 5,  4),
-- My Favourites
(4, 8,  1), (4, 14, 2), (4, 16, 3), (4, 25, 4), (4, 38, 5),
-- Indie Anthems
(5, 31, 1), (5, 32, 2), (5, 33, 3), (5, 34, 4), (5, 35, 5),
-- Hip-Hop Essentials
(6, 22, 1), (6, 23, 2), (6, 24, 3), (6, 25, 4), (6, 26, 5), (6, 27, 6);

-- FOLLOWS (users → artists)
INSERT INTO follows (user_id, artist_id) VALUES
(1, 1), (1, 2), (1, 4),
(2, 1), (2, 3), (2, 5), (2, 6),
(3, 5), (3, 6),
(4, 3), (4, 1);

-- PLAY_HISTORY (realistic listening patterns)
INSERT INTO play_history (user_id, track_id, played_at) VALUES
(1, 8,  NOW() - INTERVAL '2 hours'),
(1, 9,  NOW() - INTERVAL '1 hour 55 minutes'),
(1, 10, NOW() - INTERVAL '1 hour 51 minutes'),
(1, 25, NOW() - INTERVAL '30 minutes'),
(1, 16, NOW() - INTERVAL '10 minutes'),
(2, 14, NOW() - INTERVAL '3 hours'),
(2, 16, NOW() - INTERVAL '2 hours 55 minutes'),
(2, 25, NOW() - INTERVAL '1 hour'),
(2, 31, NOW() - INTERVAL '45 minutes'),
(2, 38, NOW() - INTERVAL '5 minutes'),
(3, 31, NOW() - INTERVAL '4 hours'),
(3, 32, NOW() - INTERVAL '3 hours 56 minutes'),
(3, 33, NOW() - INTERVAL '3 hours 52 minutes'),
(4, 25, NOW() - INTERVAL '6 hours'),
(4, 22, NOW() - INTERVAL '5 hours 55 minutes'),
(1, 8,  NOW() - INTERVAL '1 day'),
(2, 8,  NOW() - INTERVAL '2 days'),
(3, 8,  NOW() - INTERVAL '3 days'),
(4, 8,  NOW() - INTERVAL '1 day 5 hours'),
(1, 25, NOW() - INTERVAL '2 days 2 hours');

-- LIKED_TRACKS
INSERT INTO liked_tracks (user_id, track_id) VALUES
(1, 8), (1, 9), (1, 10), (1, 25), (1, 38),
(2, 14), (2, 16), (2, 25), (2, 31),
(3, 31), (3, 32), (3, 33),
(4, 22), (4, 25), (4, 26);

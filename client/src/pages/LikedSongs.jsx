import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import TrackRow from '../components/Cards/TrackRow';
import styles from './Page.module.css';

export default function LikedSongs() {
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get('/users/liked').then(r => setTracks(r.data)).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className={styles.page} style={{ paddingTop: 60 }}>
      <h1>Liked Songs</h1>
      <p className="text-secondary" style={{ marginTop: 12 }}>
        <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link> to see your liked songs.
      </p>
    </div>
  );
  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.entityHero}>
        <div style={{
          width: 200, height: 200, borderRadius: 6, flexShrink: 0,
          background: 'linear-gradient(135deg,#450af5,#c4efd9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 72, boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
        }}>♥</div>
        <div className={styles.entityMeta}>
          <small>Playlist</small>
          <h1>Liked Songs</h1>
          <p>{tracks.length} songs</p>
        </div>
      </div>

      <div className={styles.actionRow}>
        {tracks.length > 0 && (
          <button className={styles.playBtn} onClick={() => playTrack(tracks[0], tracks)}>▶</button>
        )}
      </div>

      <div className={styles.trackList}>
        {tracks.length === 0
          ? <p className="text-secondary" style={{ padding: '24px 12px' }}>Songs you like will appear here.</p>
          : tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i + 1} queue={tracks} />)
        }
      </div>
    </div>
  );
}
